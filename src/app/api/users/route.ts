import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { getFirestore } from 'firebase-admin/firestore';

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
        if (!isFirebaseAdminInitialized() && process.env.NODE_ENV === 'development') {
            // Return empty or mock for strictly local without firebase
            return NextResponse.json({ users: [] });
        }

        const db = getFirestore();
        const usersSnapshot = await db.collection('users').get();

        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json({ users });
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

        const db = getFirestore();
        let { id, ...data } = body;

        if (!id) {
            // Create new
            const ref = db.collection('users').doc();
            id = ref.id;
        }

        const userData = {
            ...data,
            updatedAt: new Date(),
            updatedBy: authed.uid
        };

        if (!data.createdAt) {
            userData.createdAt = new Date();
        }

        await db.collection('users').doc(id).set(userData, { merge: true });

        return NextResponse.json({ success: true, id });
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

        const db = getFirestore();
        await db.collection('users').doc(id).delete();

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('DELETE /api/users error', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
