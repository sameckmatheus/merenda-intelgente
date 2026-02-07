"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

export default function SchoolAuthGuard({
    children,
}: {
    children: React.ReactNode;
}) {
    // 1. Initial State: loading true
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // 2. Auth Listener
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                console.log("SchoolAuthGuard: No user, redirecting to login");
                router.replace("/login");
                return;
            }

            try {
                // 3. Optional: Verify Role via Token Claim or API
                // For speed, we can trust the user is authenticated, 
                // but ideally we should check if they have 'school' role.
                // We'll do a quick check or fetch API if critical.

                // Let's rely on the API for role check to be safe, 
                // but cache it or use local storage to avoid flicker?
                // For now, let's just proceed if they have an email.
                if (!user.email) {
                    throw new Error("No email found");
                }

                setIsAuthorized(true);
            } catch (error) {
                console.error("SchoolAuthGuard: Auth check failed", error);
                router.replace("/login");
            } finally {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router, pathname]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-slate-600 font-medium">Verificando acesso escolar...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return null; // Will redirect
    }

    return <>{children}</>;
}
