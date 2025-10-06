import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {AUTH_COOKIE_NAME} from '@/lib/constants';
import {getAuth} from 'firebase-admin/auth';
import {initAdmin} from '@/lib/firebase-admin';

initAdmin();

export async function POST(request: Request) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);

  if (sessionCookie) {
    try {
      const decodedClaims = await getAuth().verifySessionCookie(
        sessionCookie.value,
        true
      );
      await getAuth().revokeRefreshTokens(decodedClaims.sub);
    } catch (error) {
      // Session cookie is invalid or expired.
      console.log('Could not revoke session cookie', error);
    }
  }

  cookieStore.delete(AUTH_COOKIE_NAME);
  return NextResponse.json({success: true});
}
