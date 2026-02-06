import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

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

// Initial seed list - kept for reference or init, but we will mostly rely on DB now
const DEFAULT_SCHOOL_NAMES = [
    "ANEXO MARCOS FREIRE", "BARBAPAPA", "CARLOS AYRES", "DILMA",
    "FRANCELINA", "GERCINA ALVES", "JOÃO BENTO", "MARCOS FREIRE",
    "MARIA JOSÉ", "MARIA OLIVEIRA", "MUNDO DA CRIANÇA", "MÃE BELA",
    "OTACÍLIA", "SABINO", "ZÉLIA", "ZULEIDE"
];

function normalizeString(str: string): string {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export async function GET(request: Request) {
    const authed = await requireAuth();
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const usersList = await db.select().from(users).execute();
        return NextResponse.json({ users: usersList });
    } catch (e) {
        console.error('GET /api/users error', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const authed = await requireAuth();
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        // Body should match User interface
        // id might be present (update) or absent (create)

        let { id, ...data } = body;

        let newId = id;
        if (!newId) {
            newId = uuidv4();
        }

        const userData: any = {
            id: newId,
            uid: data.uid,
            name: data.name,
            email: data.email,
            role: data.role || 'school_responsible',
            schoolId: data.schoolId,
            phone: data.phone,
            status: data.status || 'active',
            createdAt: new Date()
        };
        // Note: Drizzle insert ignores 'createdAt' default if not provided, but we can rely on DB default if we omit it. 
        // However, updating means we might need merged data.

        // Upsert logic: simple strategy is check if exists update, else insert.
        // Or if ID provided, update.

        if (id) {
            await db.update(users).set({
                ...userData,
                // Don't overwrite createdAt on update usually, but body might not have it.
            }).where(eq(users.id, id));
        } else {
            await db.insert(users).values(userData);
        }

        return NextResponse.json({ success: true, id: newId });
    } catch (e) {
        console.error('POST /api/users error', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const authed = await requireAuth();
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { id } = body;

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        await db.delete(users).where(eq(users.id, id));

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('DELETE /api/users error', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
