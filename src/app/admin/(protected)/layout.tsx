import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAuth } from "firebase-admin/auth";
import { initAdmin, isFirebaseAdminInitialized } from "@/lib/firebase-admin";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { isSchoolEmail } from "@/lib/school-auth";

// Initialize Firebase Admin
initAdmin();

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);

    if (!sessionCookie) {
        redirect("/admin/login");
    }

    try {
        if (!isFirebaseAdminInitialized() && process.env.NODE_ENV === 'development') {
            console.warn("⚠️ Bypassing admin auth check in development (Firebase Admin not initialized)");
            return <>{children}</>;
        }

        // Verify the session cookie and get user info
        const decodedClaims = await getAuth().verifySessionCookie(sessionCookie.value, true);

        // Check if the user is a school account
        if (decodedClaims.email && isSchoolEmail(decodedClaims.email)) {
            console.warn(`⛔ School account ${decodedClaims.email} attempted to access admin panel`);
            redirect("/escola");
        }

    } catch (error) {
        console.error("Auth verification failed in layout:", error);
        redirect("/admin/login");
    }

    return <>{children}</>;
}
