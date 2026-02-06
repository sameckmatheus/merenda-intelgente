import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { AUTH_COOKIE_NAME, SCHOOLS_LIST } from '@/lib/constants';
import { db } from '@/db';
import { schools, submissions } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

initAdmin();

// Helper to match settings/route.ts ID strategy
function normalizeString(str: string): string {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

async function requireAuth() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get?.(AUTH_COOKIE_NAME) || cookieStore.get(AUTH_COOKIE_NAME as any);
    if (!sessionCookie) return null;

    if (!isFirebaseAdminInitialized() && process.env.NODE_ENV === 'development') {
        return { uid: 'dev-user' };
    }

    try {
        const decoded = await getAuth().verifySessionCookie((sessionCookie as any).value, true);
        return decoded;
    } catch {
        return null;
    }
}

export async function GET(request: Request) {
    const authed = await requireAuth();
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const schoolsList = await db.select().from(schools).orderBy(asc(schools.name));

        // Fallback or Seeding if empty and in dev handling (Optional, but good for migration transition)
        // If DB is empty but we have SCHOOLS_LIST constant, we could return that, 
        // but let's assume valid DB state or allow empty.

        return NextResponse.json({ schools: schoolsList });
    } catch (e) {
        console.error('GET /api/schools error', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const authed = await requireAuth();
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { name } = body;

        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        const docId = normalizeString(name);

        // Check existence
        const existing = await db.select().from(schools).where(eq(schools.id, docId)).execute();
        if (existing.length > 0) {
            return NextResponse.json({ error: 'School already exists' }, { status: 409 });
        }

        const newSchool = {
            id: docId,
            name,
            totalStudents: { morning: 0, afternoon: 0, night: 0 }, // Default values
            contacts: { email: '', whatsapp: '' }, // Default values
            responsibleIds: [],
            updatedAt: new Date()
        };

        await db.insert(schools).values(newSchool).execute();

        return NextResponse.json({ success: true, id: docId, name });
    } catch (e) {
        console.error('POST /api/schools error', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const authed = await requireAuth();
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { id, name } = body;

        if (!id || !name) return NextResponse.json({ error: 'ID and Name are required' }, { status: 400 });

        const newId = normalizeString(name);

        if (newId === id) {
            // Simple update
            await db.update(schools)
                .set({ name, updatedAt: new Date() })
                .where(eq(schools.id, id));
        } else {
            // Rename logic: Check if target exists
            const existingTarget = await db.select().from(schools).where(eq(schools.id, newId)).execute();
            if (existingTarget.length > 0) {
                return NextResponse.json({ error: 'Target school name already exists' }, { status: 409 });
            }

            const oldSchoolResult = await db.select().from(schools).where(eq(schools.id, id)).execute();
            if (oldSchoolResult.length === 0) {
                return NextResponse.json({ error: 'School not found' }, { status: 404 });
            }
            const oldSchool = oldSchoolResult[0];

            await db.transaction(async (tx) => {
                // 1. Create new school with old data but new ID/Name
                await tx.insert(schools).values({
                    ...oldSchool,
                    id: newId,
                    name: name,
                    updatedAt: new Date()
                });

                // 2. Update submissions
                await tx.update(submissions)
                    .set({ school: name })
                    .where(eq(submissions.school, oldSchool.name));

                // 3. Delete old school
                await tx.delete(schools).where(eq(schools.id, id));
            });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('PUT /api/schools error', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const authed = await requireAuth();
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { id } = body;

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        await db.delete(schools).where(eq(schools.id, id));

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('DELETE /api/schools error', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
