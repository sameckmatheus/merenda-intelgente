import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { db } from '@/db';
import { submissions } from '@/db/schema';
import { and, desc, eq, gte, lte, ilike } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

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
    let limit = limitParam ? parseInt(limitParam) : 100;
    if (isNaN(limit)) limit = 100;

    const conditions = [];

    if (start && end) {
      const startDate = new Date(parseInt(start));
      const endDate = new Date(parseInt(end));
      conditions.push(gte(submissions.date, startDate));
      conditions.push(lte(submissions.date, endDate));
    }

    if (status && status !== 'all') {
      conditions.push(eq(submissions.status, status as any));
    }

    if (school && school !== 'all') {
      conditions.push(ilike(submissions.school, `%${school}%`));
    }

    const data = await db.select()
      .from(submissions)
      .where(and(...conditions))
      .orderBy(desc(submissions.createdAt))
      .limit(limit);

    const mappedSubmissions = data.map(sub => ({
      ...sub,
      date: sub.date.getTime(),
      createdAt: sub.createdAt ? sub.createdAt.getTime() : null,
    }));

    return NextResponse.json({ submissions: mappedSubmissions }, { status: 200 });

  } catch (e) {
    console.error('GET /api/submissions error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    // Body should match the structure sent by the frontend, but we need to ensure correct Date objects
    // Frontend sends 'date' as ISO string or timestamp? 
    // In page.tsx: `Timestamp.fromDate(values.date)` -> this object structure might be complex (seconds, nanoseconds).
    // EXCEPT we are changing the frontend to JSON.stringify().
    // So we should expect ISO string or timestamp number from the frontend's fetch call.
    // Let's assume user will update frontend to send ISO string or timestamp.

    const id = uuidv4();
    const now = new Date();

    // Parse date: handle ISO string or timestamp or Firebase Timestamp like object
    let submissionDate = new Date();
    if (body.date) {
      if (typeof body.date === 'string' || typeof body.date === 'number') {
        submissionDate = new Date(body.date);
      } else if (body.date.seconds) { // Firebase Timestamp object
        submissionDate = new Date(body.date.seconds * 1000);
      }
    }

    await db.insert(submissions).values({
      id,
      respondentName: body.respondentName,
      school: body.school,
      date: submissionDate,
      shift: body.shift,
      menuType: body.menuType,
      totalStudents: Number(body.totalStudents),
      presentStudents: Number(body.presentStudents),
      helpNeeded: !!body.helpNeeded,
      description: body.description,
      status: 'pendente',
      alternativeMenuDescription: body.alternativeMenuDescription,
      itemsPurchased: !!body.itemsPurchased, // Check if frontend sends boolean or string
      missingItems: body.missingItems,
      canBuyMissingItems: body.canBuyMissingItems === true || body.canBuyMissingItems === 'sim' || body.canBuyMissingItems === 'true',
      suppliesReceived: !!body.suppliesReceived,
      suppliesDescription: body.suppliesDescription,
      observations: body.observations,
      menuAdaptationReason: body.menuAdaptationReason,
      createdAt: now
    });

    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (e) {
    console.error('POST /api/submissions error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}



