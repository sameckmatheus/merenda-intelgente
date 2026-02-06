import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { db } from '@/db';
import { systemSettings } from '@/db/schema';
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

export async function GET(request: Request) {
    const authed = await requireAuth();
    if (!authed) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await db.select().from(systemSettings).where(eq(systemSettings.id, 'general')).limit(1);

        if (result.length === 0) {
            // Fallback default structure if not found
            // This mimics the dev mock data structure
            return NextResponse.json({
                settings: {
                    inventoryCategories: ["Todos", "Estocáveis", "Proteínas", "Hortifruti", "Material de Limpeza", "Outros"],
                    inventoryItems: []
                }
            }, { status: 200 });
        }

        // Return data from JSON column, merging with flattened structure if needed by frontend
        // Frontend expects `{ settings: { ...fields } }`
        return NextResponse.json({ settings: result[0].data }, { status: 200 });
    } catch (e) {
        console.error('GET /api/settings error', e);
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

        // Upsert
        const current = await db.select().from(systemSettings).where(eq(systemSettings.id, 'general')).limit(1);

        if (current.length > 0) {
            // Merge existing data with new body? Firestore merge: true did this.
            // Postgres update replaces the value. I need to merge properly if I want partial updates.
            // But usually the settings UI sends the whole object or I can merge in code.
            // For now, let's merge with existing data in code.
            const existingData = current[0].data as any;
            const newData = { ...existingData, ...body };

            await db.update(systemSettings).set({
                data: newData,
                updatedAt: new Date(),
                updatedBy: authed.uid
            }).where(eq(systemSettings.id, 'general'));
        } else {
            // Insert
            await db.insert(systemSettings).values({
                id: 'general',
                data: body,
                updatedAt: new Date(),
                updatedBy: authed.uid
            });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (e) {
        console.error('POST /api/settings error', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
