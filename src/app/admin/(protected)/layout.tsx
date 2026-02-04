"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

export default function AdminProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push("/login?error=no_session");
                return;
            }

            try {
                // Verify admin role via API to bypass client permission issues
                // Use ID token to ensure auth works even if cookie is missing
                const idToken = await user.getIdToken();
                const res = await fetch('/api/user/me', {
                    headers: {
                        'Authorization': `Bearer ${idToken}`
                    }
                });

                if (!res.ok) {
                    if (res.status === 401) {
                        router.push("/login?error=no_session");
                        return;
                    }
                    throw new Error("Failed to fetch user profile");
                }
                const userData = await res.json();

                // Check if role is admin
                if (userData.role !== "admin") {
                    console.warn("Unauthorized access attempt to admin area by:", user.email);
                    // Redirect to appropriate dashboard based on role
                    if (userData.role === "school") {
                        router.push("/escola");
                    } else {
                        router.push("/login?error=unauthorized");
                    }
                    return;
                }

                setIsAuthorized(true);
            } catch (error) {
                console.error("Error verifying admin permissions:", error);
                router.push("/login?error=auth_error");
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-slate-600 font-medium">Verificando permissões administrativas...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return null; // Will redirect
    }

    return <>{children}</>;
}
