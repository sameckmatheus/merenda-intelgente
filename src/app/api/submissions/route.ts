import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { getFirestore, Timestamp as AdminTimestamp } from 'firebase-admin/firestore';

initAdmin();

async function requireAuth() {
  const cookieStore = cookies();
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
    let q = db.collection('submissions') as FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;

    if (start && end) {
      q = q
        .where('date', '>=', AdminTimestamp.fromMillis(Number(start)))
        .where('date', '<=', AdminTimestamp.fromMillis(Number(end)));
    }
    if (school && school !== 'all') {
      q = q.where('school', '==', school);
    }

    const snapshot = await q.get();
    const submissions = snapshot.docs
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


