import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { db } from '@/db';
import { submissions } from '@/db/schema';
import { eq } from 'drizzle-orm';

initAdmin();

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sub = await db.select().from(submissions).where(eq(submissions.id, params.id)).limit(1);
    if (!sub || sub.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data = {
      ...sub[0],
      date: sub[0].date.toISOString(),
      createdAt: sub[0].createdAt ? sub[0].createdAt.toISOString() : null
    };

    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    console.error('GET /api/submissions/[id] error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
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

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await db.delete(submissions).where(eq(submissions.id, params.id));
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('DELETE /api/submissions/[id] error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    // Allow updating specific fields. For now, we trust the body matches schema or we pick allowed fields.
    // Status is the main one.
    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.itemsPurchased !== undefined) updateData.itemsPurchased = body.itemsPurchased;
    if (body.suppliesReceived !== undefined) updateData.suppliesReceived = body.suppliesReceived;

    await db.update(submissions).set(updateData).where(eq(submissions.id, params.id));
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('PATCH /api/submissions/[id] error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
