import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { getFirestore, Timestamp as AdminTimestamp } from 'firebase-admin/firestore';

initAdmin();

async function requireAuth() {
  // cookies() can be async in some Next.js versions/TS types
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get?.(AUTH_COOKIE_NAME) || cookieStore.get(AUTH_COOKIE_NAME as any);
  if (!sessionCookie) return null;

  if (!isFirebaseAdminInitialized() && process.env.NODE_ENV === 'development') {
    return { uid: 'dev-user' }; // Mock decoded token
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
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const school = searchParams.get('school');
    const status = searchParams.get('status');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 100;

    if (!isFirebaseAdminInitialized() && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Returning empty submissions (Firebase Admin not initialized)');
      return NextResponse.json({ submissions: [] }, { status: 200 });
    }

    const db = getFirestore();
    const collectionRef = db.collection('submissions') as FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>;
    let q: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = collectionRef;

    if (start && end) {
      q = q
        .where('date', '>=', AdminTimestamp.fromMillis(Number(start)))
        .where('date', '<=', AdminTimestamp.fromMillis(Number(end)));
    }

    // Apply limit to base query if possible (note: complex filters might require logic adjustment below)
    // However, since we filter locally for school sometimes, we should be careful.
    // Ideally we limit the initial fetch.
    if (!school || school === 'all') {
      q = q.limit(limit);
    }

    // If both date range and school are provided, Firestore may require a composite index
    // for combining range queries with equality on another field. To avoid forcing an
    // index, run the date-range query and filter by school locally. If only school is
    // provided, query by school directly.
    let docs: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>[] = [];

    // Helper for normalizing strings (remove accents, lowercase)
    function normalizeString(str: string): string {
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
    }

    try {
      // Se temos filtro por escola e data, precisamos filtrar escola localmente
      if (school && school !== 'all' && start && end) {
        // Note: limiting here might miss results if we filter locally. 
        // For now, let's keep the limit on the query to protect usage, 
        // even if it means we might get fewer than 'limit' results after filtering.
        // Ideally we would use a composite index and .where('school', '==', school)
        const snapshot = await q.limit(limit).get();
        const targetSchool = normalizeString(school);
        docs = snapshot.docs.filter((d) => normalizeString(d.data()?.school || '') === targetSchool);
      }
      // Se temos apenas escola, podemos filtrar direto no Firestore
      else if (school && school !== 'all') {
        const snapshot = await collectionRef.where('school', '==', school).limit(limit).get();
        docs = snapshot.docs;
      }
      // Sem filtros específicos, usar a query base
      else {
        const snapshot = await q.get();
        docs = snapshot.docs;
      }
    } catch (firestoreError: any) {
      // Handle quota exceeded error specifically
      if (firestoreError.code === 8 || firestoreError.message?.includes('RESOURCE_EXHAUSTED')) {
        console.error('Firestore quota exceeded in submissions API');
        return NextResponse.json({
          submissions: [],
          warning: 'System is currently under heavy load (Quota Exceeded). Please try again later.'
        }, { status: 200 });
      }
      throw firestoreError;
    }

    // Aplicar filtro por status localmente se fornecido
    if (status && status !== 'all') {
      docs = docs.filter((d) => (d.data()?.status || 'pendente') === status);
    }

    const submissions = docs
      .map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          date: d.date?.toMillis?.() ?? null,
          createdAt: d.createdAt?.toMillis?.() ?? null,
        };
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return NextResponse.json({ submissions }, { status: 200 });
  } catch (e) {
    console.error('GET /api/submissions error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


