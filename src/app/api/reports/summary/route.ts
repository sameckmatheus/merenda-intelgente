import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { getFirestore, Timestamp as AdminTimestamp } from 'firebase-admin/firestore';

initAdmin();

async function requireAuth() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);
  if (!sessionCookie) return null;
  try {
    const decoded = await getAuth().verifySessionCookie(sessionCookie.value, true);
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

    const db = getFirestore();
    const collectionRef = db.collection('submissions') as FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>;

    let q: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = collectionRef;
    if (start && end) {
      q = q.where('date', '>=', AdminTimestamp.fromMillis(Number(start))).where('date', '<=', AdminTimestamp.fromMillis(Number(end)));
    }

  const snapshot = await q.get();
  const docs = snapshot.docs.map((d) => ({ id: d.id, ...((d.data() || {}) as any) } as any));

    // If school filter provided, filter locally
    const filtered = school && school !== 'all' ? docs.filter(d => (d.school || '') === school) : docs;

    const bySchoolMap: Record<string, number> = {};
    const byStatusMap: Record<string, number> = {};

    filtered.forEach((d) => {
      const name = d.school || 'Desconhecida';
      bySchoolMap[name] = (bySchoolMap[name] || 0) + 1;

      const st = d.status || 'pendente';
      byStatusMap[st] = (byStatusMap[st] || 0) + 1;
    });

    const bySchool = Object.entries(bySchoolMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    const byStatus = Object.entries(byStatusMap).map(([name, value]) => ({ name, value }));

    return NextResponse.json({ bySchool, byStatus }, { status: 200 });
  } catch (e) {
    console.error('GET /api/reports/summary error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
