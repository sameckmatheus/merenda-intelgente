import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

// Initialize the Firebase Admin SDK
initAdmin();

export async function POST(request: Request) {
  const body = await request.json();
  const { idToken } = body;

  if (!idToken) {
    return NextResponse.json(
      { success: false, message: 'ID token não fornecido' },
      { status: 400 }
    );
  }

  try {
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await getAuth().createSessionCookie(idToken, {
      expiresIn,
    });

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: expiresIn / 1000,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json(
      { success: false, message: 'Falha na autenticação: ' + error.message },
      { status: 401 }
    );
  }
}
