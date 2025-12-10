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

    // If both date range and school are provided, Firestore may require a composite index
    // for combining range queries with equality on another field. To avoid forcing an
    // index, run the date-range query and filter by school locally. If only school is
    // provided, query by school directly.
    let docs: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>[] = [];

    // Se temos filtro por escola e data, precisamos filtrar escola localmente
    if (school && school !== 'all' && start && end) {
      const snapshot = await q.get();
      docs = snapshot.docs.filter((d) => (d.data()?.school || '') === school);
    }
    // Se temos apenas escola, podemos filtrar direto no Firestore
    else if (school && school !== 'all') {
      const snapshot = await collectionRef.where('school', '==', school).get();
      docs = snapshot.docs;
    }
    // Sem filtros específicos, usar a query base
    else {
      const snapshot = await q.get();
      docs = snapshot.docs;
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


