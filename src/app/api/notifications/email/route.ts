import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

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

export async function POST(request: Request) {
    const authed = await requireAuth();
    if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { schoolId, subject, message, recipientEmail } = body;

        console.log(`[Mock Email Service] Sending email to ${recipientEmail} (SchoolID: ${schoolId})`);
        console.log(`Subject: ${subject}`);
        console.log(`Message: ${message}`);

        // In a real app, integrate Resend, SendGrid, or Nodemailer here.

        return NextResponse.json({ success: true, message: 'Email queued successfully' });
    } catch (e) {
        console.error('POST /api/notifications/email error', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
