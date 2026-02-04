"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { isSchoolEmail } from "@/lib/school-auth";
import { SchoolNav } from "@/components/school-nav";

export default function SchoolLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user || !user.email) {
                router.push("/login");
                return;
            }

            // Verify it's a school email, not admin
            if (!isSchoolEmail(user.email)) {
                console.warn(`⛔ Non-school account ${user.email} attempted to access school panel`);
                router.push("/admin/login");
                return;
            }
        });

        return () => unsubscribe();
    }, [router]);

    return (
        <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
            <SchoolNav />
            {children}
        </div>
    );
}
