import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { getFirestore } from 'firebase-admin/firestore';

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

export async function PATCH(
  _request: Request,
  context: any
) {
  const { params } = context || {};
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getFirestore();
    const body = await _request.json();
    const { status } = body as { status: 'pendente' | 'atendido' | 'atendido_parcialmente' | 'recusado' };
    if (!status) {
      return NextResponse.json({ error: 'status é obrigatório' }, { status: 400 });
    }

    await db.collection('submissions').doc(params.id).update({ status });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('PATCH /api/submissions/[id]/status error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


