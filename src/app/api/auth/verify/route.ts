import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {getAuth} from 'firebase-admin/auth';
import {initAdmin} from '@/lib/firebase-admin';
import {AUTH_COOKIE_NAME} from '@/lib/constants';

initAdmin();

export async function GET() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);

  if (!sessionCookie) {
    return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  }

  try {
    const decodedClaims = await getAuth().verifySessionCookie(
      sessionCookie.value,
      true
    );
    // You can add more checks here, e.g., if the user is an admin
    return NextResponse.json(
      {uid: decodedClaims.uid, email: decodedClaims.email},
      {status: 200}
    );
  } catch (error) {
    // Session cookie is invalid or expired.
    return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  }
}
