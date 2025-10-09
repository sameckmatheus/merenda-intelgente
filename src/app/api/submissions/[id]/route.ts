import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { getFirestore } from 'firebase-admin/firestore';

initAdmin();

async function requireAuth() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get?.(AUTH_COOKIE_NAME) || cookieStore.get(AUTH_COOKIE_NAME as any);
  if (!sessionCookie) return null;
  try {
    const decoded = await getAuth().verifySessionCookie((sessionCookie as any).value, true);
    return decoded;
  } catch {
    return null;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getFirestore();
    await db.collection('submissions').doc(params.id).delete();
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('DELETE /api/submissions/[id] error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
