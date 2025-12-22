
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { getFirestore } from 'firebase-admin/firestore';
import { HelpRequest } from '@/lib/types';
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

export async function GET(request: Request) {
    const authed = await requireAuth();
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const schoolId = searchParams.get('schoolId');
        const status = searchParams.get('status');

        if (!isFirebaseAdminInitialized() && process.env.NODE_ENV === 'development') {
            return NextResponse.json({ helpRequests: [] });
        }

        const db = getFirestore();
        let query: FirebaseFirestore.Query = db.collection('help_requests');

        if (schoolId) query = query.where('schoolId', '==', schoolId);
        if (status && status !== 'all') query = query.where('status', '==', status);

        const snapshot = await query.orderBy('createdAt', 'desc').get();
        const helpRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json({ helpRequests });
    } catch (e) {
        console.error('GET /api/help-requests error', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const authed = await requireAuth();
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { schoolId, schoolName, description, priority } = body;

        if (!schoolId || !description) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const protocol = new Date().toISOString().replace(/\D/g, '').slice(0, 14) + Math.floor(Math.random() * 1000);

        const helpRequest: Omit<HelpRequest, 'id'> = {
            protocol,
            schoolId,
            schoolName,
            description,
            status: 'open',
            priority: priority || 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const db = getFirestore();
        const docRef = await db.collection('help_requests').add(helpRequest);

        return NextResponse.json({ success: true, id: docRef.id, protocol });
    } catch (e) {
        console.error('POST /api/help-requests error', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const authed = await requireAuth();
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { id, status, resolutionType, resolutionNotes } = body;

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const db = getFirestore();
        const updateData: any = {
            updatedAt: new Date(),
            status
        };

        if (resolutionType) updateData.resolutionType = resolutionType;
        if (resolutionNotes) updateData.resolutionNotes = resolutionNotes;

        await db.collection('help_requests').doc(id).update(updateData);

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('PATCH /api/help-requests error', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
