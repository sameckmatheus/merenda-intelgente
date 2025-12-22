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

        if (!isFirebaseAdminInitialized() && process.env.NODE_ENV === 'development') {
            return NextResponse.json({ settings: {} }, { status: 200 });
        }

        const db = getFirestore();
        const docId = normalizeString(schoolName);
        const doc = await db.collection('schools').doc(docId).get();

        if (!doc.exists) {
            return NextResponse.json({ settings: {} }, { status: 200 });
        }

        return NextResponse.json({ settings: doc.data() }, { status: 200 });
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

        if (!isFirebaseAdminInitialized() && process.env.NODE_ENV === 'development') {
            console.log('Mock saving school settings:', body);
            return NextResponse.json({ success: true }, { status: 200 });
        }

        const db = getFirestore();
        const docId = normalizeString(schoolName);

        const updateData: any = {
            name: schoolName, // Store original name for display if needed later
            updatedAt: new Date(),
            updatedBy: authed.uid
        };

        if (counts) updateData.counts = counts;
        if (contacts) updateData.contacts = contacts;

        await db.collection('schools').doc(docId).set(updateData, { merge: true });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (e) {
        console.error('POST /api/schools/settings error', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
