import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { normalizeSchoolName } from '@/lib/utils';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

        // Check if Firebase Admin is initialized (still needed for Auth, but DB is separate now)
        const adminInitialized = isFirebaseAdminInitialized();
        console.log(`🔧 Firebase Admin initialized: ${adminInitialized}`);

        // Drizzle Fetch
        console.log('🔍 Fetching user data from Postgres for UID:', uid);
        const userResults = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
        let userData = userResults[0];

        if (!userData) {
            console.log('⚠️ User exists in Auth but not in Postgres DB. Auto-provisioning...');
            const email = decodedTokenData?.email || 'unknown@example.com';

            // Determine School ID
            let schoolId: string | null = null;
            let role: "school_responsible" | "admin" | "nutritionist" = "school_responsible";

            if (email === 'marcosfreiremunicipal@gmail.com') { // Hardcoded admin/special for now
                schoolId = 'marcos freire'; // OR 'anexo marcos freire'? The old logic injected multiple.
                // Actually, if they need multiple access, the DB schema `schoolId` is limiting.
                // But for "distinct user", let's assign them to the main school.
                // Or we can make them ADMIN?
            } else {
                // Try to match school by email prefix
                const derivedSchool = normalizeSchoolName(email?.split('@')[0]);
                if (derivedSchool) {
                    // Check if school exists?
                    // const schoolExists = await db.select().from(schools).where(eq(schools.id, derivedSchool));
                    schoolId = derivedSchool;
                } else {
                    // Fallback to email prefix as ID?
                    schoolId = email?.split('@')[0].toLowerCase(); // normalized ID
                }
            }

            // Create User
            try {
                const newUser = {
                    id: uid, // Use Auth UID as PK
                    uid: uid,
                    name: decodedTokenData?.name || email.split('@')[0],
                    email: email,
                    role: role,
                    schoolId: schoolId,
                    status: 'active' as const,
                    createdAt: new Date(),
                };

                await db.insert(users).values(newUser);
                console.log(`✅ User ${email} auto-provisioned in Postgres.`);

                // Return as normal user
                // We need to re-fetch or just use the object
                userData = newUser as any;
            } catch (e) {
                console.error("Failed to auto-provision user:", e);
                return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
            }
        }

        // Proceed with userData (either fetched or created)
        // ... (existing logic to format response)


        console.log('✅ User data fetched successfully. Role:', userData?.role);

        let finalUserData: any = { ...userData };
        const userEmail = finalUserData.email || decodedTokenData?.email;

        // Map schoolId to schools array to match expected frontend structure
        // If the DB has `schoolId`, we put it in `schools` array. 
        // Note: The original returned `schools` array, but schema has `schoolId` (single).
        // If we want to support multiple schools, we might need a change or logic here.
        // For now, let's map single ID to array.
        if (finalUserData.schoolId) {
            // Need to fetch school name? Or is schoolId the name?
            // In schema: `schoolId: text("school_id")`.
            // In Firestore data, users had `schools: string[]`. 
            // My schema defined `schoolId: text`. 
            // If the user needs multiple schools, schema might be insufficient or I should treat `schoolId` as one of them.
            // But wait, the previous code had logic to inject multiple schools.
            // Check schema again. `schools` table has `id` which is normalized name.
            // `users` table has `schoolId`.
            // User might need `schools` array in response.
            finalUserData.schools = [finalUserData.schoolId];
        } else {
            finalUserData.schools = [];
        }

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
