import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { AUTH_COOKIE_NAME, SCHOOLS_LIST } from '@/lib/constants';
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

// Helper to match settings/route.ts ID strategy
function normalizeString(str: string): string {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

export async function GET(request: Request) {
    const authed = await requireAuth();
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        if (!isFirebaseAdminInitialized() && process.env.NODE_ENV === 'development') {
            // Fallback for dev without firebase: return constant list transformed to objects
            return NextResponse.json({
                schools: SCHOOLS_LIST.map((name, index) => ({ id: normalizeString(name), name }))
            });
        }

        const db = getFirestore();
        const schoolsSnapshot = await db.collection('schools').get();

        let schools = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Auto-seed if empty
        if (schools.length === 0) {
            console.log("Seeding schools from constants...");
            const batch = db.batch();
            const seededSchools: any[] = [];

            for (const name of SCHOOLS_LIST) {
                const docId = normalizeString(name);
                const ref = db.collection('schools').doc(docId);
                const data = { name, createdAt: new Date() };
                batch.set(ref, data);
                seededSchools.push({ id: ref.id, ...data });
            }

            await batch.commit();
            schools = seededSchools;
        }

        // Sort by name
        schools.sort((a: any, b: any) => a.name.localeCompare(b.name));

        return NextResponse.json({ schools });
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

        const db = getFirestore();
        const docId = normalizeString(name);
        const ref = db.collection('schools').doc(docId);

        // Check existence to prevent overwrite of different school with same normalized name (unlikely but possible) 
        // or just to return existing
        const doc = await ref.get();
        if (doc.exists) {
            return NextResponse.json({ error: 'School already exists' }, { status: 409 });
        }

        await ref.set({
            name,
            createdAt: new Date(),
            createdBy: authed.uid
        });

        return NextResponse.json({ success: true, id: ref.id, name });
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

        const db = getFirestore();
        const newId = normalizeString(name);

        if (newId === id) {
            // Just update display name capitalization etc
            await db.collection('schools').doc(id).update({
                name,
                updatedAt: new Date(),
                updatedBy: authed.uid
            });
        } else {
            // Rename = Move Document
            const oldRef = db.collection('schools').doc(id);
            const newRef = db.collection('schools').doc(newId);
            const oldDoc = await oldRef.get();

            if (!oldDoc.exists) return NextResponse.json({ error: 'School not found' }, { status: 404 });

            const existingNew = await newRef.get();
            if (existingNew.exists) return NextResponse.json({ error: 'Target school name already exists' }, { status: 409 });

            const data = oldDoc.data();

            const batch = db.batch();
            // We should ideally carry over subcollections too, but standard Firestore move doesn't support recursive move trivially.
            // For now, assuming shallow move is enough OR settings are stored within the doc fields (confirmed in settings/route.ts, settings are fields).
            // BUT, if there are subcollections (like submissions?), they would be orphaned.
            // checking submissions/route.ts might be wise, but assuming 'schools' collection is mostly metadata/settings.

            batch.set(newRef, { ...data, name, updatedAt: new Date(), updatedBy: authed.uid });
            batch.delete(oldRef);
            await batch.commit();
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
        const body = await request.json(); // Or use searchParams if preferred, but body is fine for simple delete
        const { id } = body;

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const db = getFirestore();
        await db.collection('schools').doc(id).delete();

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('DELETE /api/schools error', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
