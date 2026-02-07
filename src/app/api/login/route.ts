import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
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
    let sessionCookie;
    let uid;

    if (!isFirebaseAdminInitialized() && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Firebase Admin not initialized. Bypassing auth for development.');
      sessionCookie = 'DEV_TOKEN_BYPASS';
      // For dev bypass, we can't easily get UID unless we decode token manually or trust input.
      // But usually this branch is only for very early dev. 
      // Let's assume we can verify token even if not fully initialized? No.
      // We will skip role check in this specific dev bypass branch or mock it.
      uid = 'dev-user';
    } else {
      // Create cookie
      sessionCookie = await getAuth().createSessionCookie(idToken, {
        expiresIn,
      });
      // Verify token to get UID for role check
      const decodedToken = await getAuth().verifyIdToken(idToken);
      uid = decodedToken.uid;
    }

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: expiresIn / 1000,
    });

    // Fetch user role
    let role = 'school';
    if (uid) {
      try {
        const { db } = await import('@/db');
        const { users } = await import('@/db/schema');
        const { eq } = await import('drizzle-orm');

        const userResults = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
        if (userResults.length > 0) {
          role = userResults[0].role || 'school';
        }
      } catch (dbError) {
        console.error("Error fetching user role from Postgres:", dbError);
        // Fallback or just proceed as school
      }
    }

    return NextResponse.json({ success: true, role });
  } catch (error: any) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json(
      { success: false, message: 'Falha na autenticação: ' + error.message },
      { status: 401 }
    );
  }
}
