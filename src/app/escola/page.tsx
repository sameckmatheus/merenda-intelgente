'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Use exported auth instead
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase'; // Import auth from here
import SchoolDashboardContent from '@/components/school-dashboard-content';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Loader2, AlertTriangle, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function SchoolDashboardPage() {
    const router = useRouter();
    const [schools, setSchools] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState<string>('');
    const [authError, setAuthError] = useState<string | null>(null);

    useEffect(() => {
        // const auth = getAuth(); // Use singleton
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setAuthError(null); // Reset error on change

            if (!user) {
                // Not logged in.
                // Wait a moment to ensure it's not a temporary glitch, but effectively we should go to login.
                // However, do NOT force logout API immediately if we are just "not logged in client side".
                // If we are here, the client has NO user.
                // If we redirect to /login, Middleware checks cookie.
                // If Middleware sees cookie, it bounces back here.
                // So we MUST clear cookie if we are truly logged out.

                // Let's force logout ONLY if we are sure. 
                // Using a small timeout or just assuming if onAuthStateChanged says null => logout.
                await fetch('/api/logout', { method: 'POST' });
                router.push('/login');
                return;
            }

            if (!user.email) {
                await fetch('/api/logout', { method: 'POST' });
                router.push('/login');
                return;
            }

            try {
                // Fetch user data from our own API to bypass client permission issues
                // Use ID token to ensure auth works even if cookie is missing
                const idToken = await user.getIdToken();
                const res = await fetch('/api/user/me', {
                    headers: {
                        'Authorization': `Bearer ${idToken}`
                    }
                });

                if (!res.ok) {
                    throw new Error("Failed to fetch user profile");
                }
                const userData = await res.json();

                if (userData.role === 'admin') {
                    // Redirect admin users to their correct dashboard
                    router.push('/admin');
                    return;
                }

                if (userData.role !== "school") {
                    // Do NOT redirect if unknown role. Show error state.
                    setAuthError("Sua conta não possui permissão de escola. Entre em contato com o administrador.");
                    setLoading(false);
                    return;
                }

                const userSchools = userData.schools || [];
                if (userSchools.length === 0) {
                    setAuthError("Nenhuma escola vinculada à sua conta.");
                    setLoading(false);
                    return;
                }

                setUserEmail(user.email);
                setSchools(userSchools);
            } catch (error) {
                console.error("Error fetching user data:", error);
                setAuthError("Erro ao carregar dados do usuário.");
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-slate-600">Verificando acesso...</p>
                </div>
            </div>
        );
    }

    if (authError) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-8 h-8 text-amber-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 mb-2">Acesso Negado</h1>
                        <p className="text-slate-600">{authError}</p>
                    </div>
                    <Button
                        onClick={async () => {
                            await fetch('/api/logout', { method: 'POST' });
                            router.push('/login');
                        }}
                        variant="outline"
                        className="w-full"
                    >
                        <LogOut className="mr-2 h-4 w-4" /> Voltar para Login
                    </Button>
                </div>
            </div>
        );
    }

    // Single school - show directly
    if (schools.length === 1) {
        return <SchoolDashboardContent school={schools[0]} hideHeader={true} />;
    }

    // Multiple schools - show tabs
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="p-4 md:p-6">
                <Tabs defaultValue={schools[0]} className="w-full">
                    <TabsList className="w-full sm:w-auto grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
                        {schools.map((school) => (
                            <TabsTrigger
                                key={school}
                                value={school}
                                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all rounded-md px-4 py-2 text-sm font-medium"
                            >
                                {school}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {schools.map((school) => (
                        <TabsContent key={school} value={(school)} className="mt-0">
                            <SchoolDashboardContent school={school} hideHeader={true} />
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </div>
    );
}
