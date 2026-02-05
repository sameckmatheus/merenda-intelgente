import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { normalizeSchoolName } from '@/lib/utils';

initAdmin();

export async function GET(request: Request) {
    console.log('📋 /api/user/me - Request received');

    try {
        let uid: string | undefined;
        let decodedTokenData: any = null;

        // 1. Try Authorization Header (Bearer Token)
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const idToken = authHeader.split('Bearer ')[1];
            console.log('🔑 Attempting to verify Bearer token');
            try {
                decodedTokenData = await getAuth().verifyIdToken(idToken);
                uid = decodedTokenData.uid;
                console.log('✅ Bearer token verified for UID:', uid);
            } catch (e) {
                console.warn("⚠️ Invalid Bearer token:", e);
            }
        }

        // 2. Fallback to Session Cookie
        if (!uid) {
            const cookieStore = await cookies();
            const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;

            if (sessionCookie) {
                console.log('🍪 Attempting to verify session cookie');
                try {
                    decodedTokenData = await getAuth().verifySessionCookie(sessionCookie, true);
                    uid = decodedTokenData.uid;
                    console.log('✅ Session cookie verified for UID:', uid);
                } catch (e) {
                    console.warn("⚠️ Invalid Session Cookie:", e);
                }
            } else {
                console.warn('⚠️ No session cookie found');
            }
        }

        if (!uid) {
            console.error('❌ No valid authentication found - returning 401');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if Firebase Admin is initialized
        const adminInitialized = isFirebaseAdminInitialized();
        console.log(`🔧 Firebase Admin initialized: ${adminInitialized}`);

        if (!adminInitialized) {
            console.warn("⚠️ Firebase Admin not initialized (missing credentials). Using decoded token data as fallback.");

            // Use the decoded token data which contains email and other info
            const email = decodedTokenData?.email || 'unknown@example.com';

            let fallbackData: any = {
                uid,
                email,
                role: 'school',
                schools: []
            };

            if (email === 'marcosfreiremunicipal@gmail.com') {
                console.log('🔧 Injecting multi-school access (fallback) for marcosfreiremunicipal@gmail.com');
                fallbackData.schools = ['MARCOS FREIRE', 'ANEXO MARCOS FREIRE'];
            } else {
                // Try to normalize from email
                const derivedSchool = normalizeSchoolName(email?.split('@')[0]);
                if (derivedSchool) {
                    fallbackData.schools = [derivedSchool];
                } else {
                    // Fallback to raw if logic fails (better than nothing)
                    fallbackData.schools = [email?.split('@')[0].toUpperCase()];
                }
            }

            console.log('📤 Returning fallback user data:', fallbackData);
            return NextResponse.json(fallbackData);
        }

        // Firebase Admin is initialized, fetch user from Firestore
        console.log('🔍 Fetching user data from Firestore for UID:', uid);
        const db = getFirestore();
        const userDoc = await db.collection('users').doc(uid).get();

        if (!userDoc.exists) {
            console.warn('⚠️ User exists in Auth but not in Firestore DB. Returning basic info.');
            const email = decodedTokenData?.email || 'unknown@example.com';

            let basicData: any = {
                uid,
                email,
                role: 'school',
                schools: []
            };

            if (email === 'marcosfreiremunicipal@gmail.com') {
                console.log('🔧 Injecting multi-school access (no-firestore) for marcosfreiremunicipal@gmail.com');
                basicData.schools = ['MARCOS FREIRE', 'ANEXO MARCOS FREIRE'];
            } else {
                const derivedSchool = normalizeSchoolName(email?.split('@')[0]);
                if (derivedSchool) {
                    basicData.schools = [derivedSchool];
                } else {
                    basicData.schools = [email?.split('@')[0].toUpperCase()];
                }
            }

            return NextResponse.json(basicData);
        }

        const userData = userDoc.data();
        console.log('✅ User data fetched successfully. Role:', userData?.role);

        // HARDCODED FIX: Ensure specific user has both schools
        // This is necessary because we cannot manually update the Firestore document in this environment
        let finalUserData: any = { uid, ...userData };
        const userEmail = finalUserData.email || decodedTokenData?.email;

        if (userEmail === 'marcosfreiremunicipal@gmail.com') {
            console.log('🔧 Injecting multi-school access for marcosfreiremunicipal@gmail.com');
            finalUserData.schools = ['MARCOS FREIRE', 'ANEXO MARCOS FREIRE'];
        }

        return NextResponse.json(finalUserData);
    } catch (error: any) {
        console.error('❌ Error fetching user profile:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json({
            error: 'Internal Server Error',
            message: error.message
        }, { status: 500 });
    }
}
