import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { AUTH_COOKIE_NAME, SCHOOLS_LIST } from '@/lib/constants';
import { getFirestore } from 'firebase-admin/firestore';

initAdmin();

// In-memory cache to reduce Firestore reads
let schoolsCache: { schools: any[], timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function isCacheValid(): boolean {
    if (!schoolsCache) return false;
    const now = Date.now();
    return (now - schoolsCache.timestamp) < CACHE_DURATION;
}

function invalidateCache() {
    schoolsCache = null;
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
        // Return cached data if valid
        if (isCacheValid() && schoolsCache) {
            console.log('Returning cached schools data');
            return NextResponse.json({ schools: schoolsCache.schools });
        }

        if (!isFirebaseAdminInitialized() && process.env.NODE_ENV === 'development') {
            // Fallback for dev without firebase: return constant list transformed to objects
            const schools = SCHOOLS_LIST.map((name, index) => ({ id: normalizeString(name), name }));
            return NextResponse.json({ schools });
        }

        const db = getFirestore();
        let schoolsSnapshot;

        try {
            schoolsSnapshot = await db.collection('schools').get();
        } catch (firestoreError: any) {
            // Handle quota exceeded error specifically
            if (firestoreError.code === 8 || firestoreError.message?.includes('RESOURCE_EXHAUSTED')) {
                console.error('Firestore quota exceeded, falling back to constants');
                const fallbackSchools = SCHOOLS_LIST.map(name => ({
                    id: normalizeString(name),
                    name
                }));
                // Cache the fallback for 1 minute to avoid hammering Firestore
                schoolsCache = { schools: fallbackSchools, timestamp: Date.now() };
                return NextResponse.json({
                    schools: fallbackSchools,
                    warning: 'Using cached data due to quota limits'
                });
            }
            throw firestoreError;
        }

        let schools = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const schoolsMap = new Map(schools.map((s: any) => [normalizeString(s.name), s]));

        // Check for missing schools from the constant list
        const missingSchools = SCHOOLS_LIST.filter(name => !schoolsMap.has(normalizeString(name)));

        if (missingSchools.length > 0) {
            console.log(`Found ${missingSchools.length} missing schools. Seeding...`);
            const batch = db.batch();
            const newSchools: any[] = [];

            for (const name of missingSchools) {
                const docId = normalizeString(name);
                const ref = db.collection('schools').doc(docId);
                const data = { name, createdAt: new Date() };
                batch.set(ref, data);
                newSchools.push({ id: ref.id, ...data });
            }

            await batch.commit();

            // Append new schools to the list
            schools = [...schools, ...newSchools];
        }

        // Sort by name
        schools.sort((a: any, b: any) => a.name.localeCompare(b.name));

        // Update cache
        schoolsCache = { schools, timestamp: Date.now() };

        return NextResponse.json({ schools });
    } catch (e) {
        console.error('GET /api/schools error', e);

        // If we have cached data, return it even if expired
        if (schoolsCache) {
            console.log('Returning stale cache due to error');
            return NextResponse.json({
                schools: schoolsCache.schools,
                warning: 'Using cached data due to error'
            });
        }

        // Final fallback to constants
        const fallbackSchools = SCHOOLS_LIST.map(name => ({
            id: normalizeString(name),
            name
        }));
        return NextResponse.json({
            schools: fallbackSchools,
            warning: 'Using fallback data'
        });
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

        // Invalidate cache
        invalidateCache();

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
            const oldName = data?.name;

            const batch = db.batch();
            // We should ideally carry over subcollections too, but standard Firestore move doesn't support recursive move trivially.
            // For now, assuming shallow move is enough OR settings are stored within the doc fields (confirmed in settings/route.ts, settings are fields).

            // 1. Move School Document
            batch.set(newRef, { ...data, name, updatedAt: new Date(), updatedBy: authed.uid });
            batch.delete(oldRef);

            // 2. Update all Submissions referencing this school
            if (oldName) {
                const submissionsSnapshot = await db.collection('submissions').where('school', '==', oldName).get();
                if (!submissionsSnapshot.empty) {
                    console.log(`Propagating rename from "${oldName}" to "${name}" for ${submissionsSnapshot.size} submissions.`);
                    submissionsSnapshot.docs.forEach(doc => {
                        batch.update(doc.ref, { school: name });
                    });
                }
            }

            await batch.commit();
        }

        // Invalidate cache
        invalidateCache();

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

        // Invalidate cache
        invalidateCache();

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('DELETE /api/schools error', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
