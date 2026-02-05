"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { isAdminEmail } from "@/lib/admin-whitelist";
import { Loader2 } from "lucide-react";

export default function AdminProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('🔐 Admin Layout - Checking authentication');

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                console.log('❌ No user authenticated - redirecting to login');
                router.push("/login?error=no_session");
                return;
            }

            console.log('✅ User authenticated:', user.email);

            // Check if email is in admin whitelist
            if (!user.email || !isAdminEmail(user.email)) {
                console.warn('⚠️ Email not in admin whitelist:', user.email);
                console.log('🏫 Redirecting to escola dashboard');
                router.push("/escola");
                return;
            }

            console.log('✅ Email authorized as admin:', user.email);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-slate-600 font-medium">Carregando...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
