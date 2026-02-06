import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { db } from '@/db';
import { schools } from '@/db/schema';
import { eq } from 'drizzle-orm';

initAdmin();

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

function normalizeString(str: string): string {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

export async function GET(request: Request) {
    const authed = await requireAuth();
    if (!authed) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const schoolName = searchParams.get('school');

        if (!schoolName) {
            return NextResponse.json({ error: 'School name required' }, { status: 400 });
        }

        const docId = normalizeString(schoolName);
        const result = await db.select().from(schools).where(eq(schools.id, docId)).limit(1);

        if (result.length === 0) {
            return NextResponse.json({ settings: {} }, { status: 200 });
        }

        const schoolData = result[0];
        // Map DB fields to what frontend expects in "settings"
        const settings = {
            counts: schoolData.totalStudents,
            contacts: schoolData.contacts,
            inventory: schoolData.inventory,
            categories: schoolData.categories,
        };

        return NextResponse.json({ settings }, { status: 200 });
    } catch (e) {
        console.error('GET /api/schools/settings error', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const authed = await requireAuth();
    if (!authed) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { schoolName, counts, contacts } = body;

        if (!schoolName) {
            return NextResponse.json({ error: 'Missing required field: schoolName' }, { status: 400 });
        }

        const docId = normalizeString(schoolName);

        // Prepare update data
        const updateData: any = {
            updatedAt: new Date(),
        };

        if (counts) updateData.totalStudents = counts;
        if (contacts) updateData.contacts = contacts;
        if (body.inventory) updateData.inventory = body.inventory;
        if (body.categories) updateData.categories = body.categories;

        // Check if exists using count or select
        const exists = await db.select({ id: schools.id }).from(schools).where(eq(schools.id, docId)).limit(1);

        if (exists.length > 0) {
            await db.update(schools).set(updateData).where(eq(schools.id, docId));
        } else {
            // Create if not exists (upsert-ish)
            // We need required fields: name, totalStudents, contacts
            // If they are missing in body, this insert might fail if we don't provide defaults.
            // Assuming body provides them or we set defaults.
            await db.insert(schools).values({
                id: docId,
                name: schoolName,
                totalStudents: counts || { morning: 0, afternoon: 0, night: 0 },
                contacts: contacts || { email: '', whatsapp: '' },
                inventory: body.inventory || [],
                categories: body.categories || [],
                updatedAt: new Date()
            });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (e) {
        console.error('POST /api/schools/settings error', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
