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

// Initial seed list
const DEFAULT_SCHOOL_NAMES = [
    "ANEXO MARCOS FREIRE", "BARBAPAPA", "CARLOS AYRES", "DILMA",
    "FRANCELINA", "GERCINA ALVES", "JOÃO BENTO", "MARCOS FREIRE",
    "MARIA JOSÉ", "MARIA OLIVEIRA", "MUNDO DA CRIANÇA", "MÃE BELA",
    "OTACÍLIA", "SABINO", "ZÉLIA", "ZULEIDE"
];

function normalizeString(str: string): string {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// Global in-memory store for development mock
// Use globalThis to persist across module reloads in dev
const GLOBAL_KEY = 'mock_users_db';
const globalStore = globalThis as unknown as { [key: string]: any[] };

if (!globalStore[GLOBAL_KEY]) {
    globalStore[GLOBAL_KEY] = DEFAULT_SCHOOL_NAMES.map(name => ({
        id: normalizeString(name),
        name: name,
        email: `${normalizeString(name).replace(/\s+/g, '.')}@escola.gov.br`,
        responsibleName: "Diretor(a) Responsável",
        phone: "81 99999-9999",
        address: "Rua das Escolas, S/N",
        status: 'active' as const
    }));
}

export async function GET(request: Request) {
    const authed = await requireAuth();
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        if (!isFirebaseAdminInitialized() && process.env.NODE_ENV === 'development') {
            return NextResponse.json({ users: globalStore[GLOBAL_KEY] });
        }

        const db = getFirestore();
        const schoolsSnapshot = await db.collection('schools').get();

        if (schoolsSnapshot.empty) {
            // Return defaults if empty
            return NextResponse.json({
                users: DEFAULT_SCHOOL_NAMES.map(name => ({
                    id: normalizeString(name),
                    name: name,
                    email: `${normalizeString(name).replace(/\s+/g, '.')}@escola.gov.br`,
                    responsibleName: "Diretor(a) Responsável",
                    phone: "81 99999-9999",
                    address: "Rua das Escolas, S/N",
                    status: 'active'
                }))
            });
        }

        const users = schoolsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

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
        const { id, ...data } = body;

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        if (!isFirebaseAdminInitialized() && process.env.NODE_ENV === 'development') {
            // Update in-memory mock DB using global store
            globalStore[GLOBAL_KEY] = globalStore[GLOBAL_KEY].map((user: any) =>
                user.id === id ? { ...user, ...data } : user
            );
            return NextResponse.json({ success: true });
        }

        const db = getFirestore();
        await db.collection('schools').doc(id).set({
            ...data,
            updatedAt: new Date(),
            updatedBy: authed.uid
        }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('POST /api/users error', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
