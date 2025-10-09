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

function toCsvRow(obj: any) {
  const escape = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    return `"${s}"`;
  };
  return [
    escape(obj.id),
    escape(obj.school),
    escape(obj.respondentName),
    escape(obj.shift),
    escape(obj.status),
    escape(obj.helpNeeded),
    escape(obj.missingItems),
    escape(obj.itemsPurchased),
    escape(obj.createdAt ?? obj.date ?? ''),
  ].join(',');
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
    const helpNeeded = searchParams.get('helpNeeded');

    const db = getFirestore();
    const collectionRef = db.collection('submissions') as FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>;
    let q: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = collectionRef;
    if (start && end) {
      q = q.where('date', '>=', AdminTimestamp.fromMillis(Number(start))).where('date', '<=', AdminTimestamp.fromMillis(Number(end)));
    }
    const snapshot = await q.get();
    let docs = snapshot.docs.map(d => ({ id: d.id, ...((d.data() || {}) as any) } as any));
    if (school && school !== 'all') docs = docs.filter(d => (d.school || '') === school);
    if (status && status !== 'all') docs = docs.filter(d => (d.status || 'pendente') === status);
    if (helpNeeded && helpNeeded !== 'all') {
      if (helpNeeded === 'yes') docs = docs.filter(d => !!d.helpNeeded);
      if (helpNeeded === 'no') docs = docs.filter(d => !d.helpNeeded);
    }

    const header = 'id,school,respondentName,shift,status,helpNeeded,missingItems,itemsPurchased,date\n';
    const rows = docs.map(d => toCsvRow(d)).join('\n');
    const csv = header + rows;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="relatorio-submissions.csv"',
      },
    });
  } catch (e) {
    console.error('GET /api/reports/csv error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
