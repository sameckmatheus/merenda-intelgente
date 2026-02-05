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

    useEffect(() => {
        console.log('🏫 Escola Page - Checking authentication');

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                console.log('❌ No user authenticated - logging out and redirecting');
                await fetch('/api/logout', { method: 'POST' });
                router.push('/login');
                return;
            }

            if (!user.email) {
                console.log('❌ User has no email - logging out');
                await fetch('/api/logout', { method: 'POST' });
                router.push('/login');
                return;
            }

            console.log('✅ User authenticated:', user.email);

            try {
                // Fetch user data from our own API to bypass client permission issues
                // Use ID token to ensure auth works even if cookie is missing
                console.log('🔑 Getting ID token for API request');
                const idToken = await user.getIdToken();

                console.log('📡 Fetching user profile from /api/user/me');
                const res = await fetch('/api/user/me', {
                    headers: {
                        'Authorization': `Bearer ${idToken}`
                    }
                });

                console.log('📬 API Response status:', res.status);

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    console.error('❌ API Error Response:', errorData);
                    throw new Error(`Failed to fetch user profile: ${errorData.message || res.statusText}`);
                }

                const userData = await res.json();
                console.log('📦 User data received:', { uid: userData.uid, role: userData.role, email: userData.email, schools: userData.schools });

                if (userData.role === 'admin') {
                    // Redirect admin users to their correct dashboard
                    console.log('👨‍💼 Admin user detected - redirecting to admin dashboard');
                    router.push('/admin');
                    return;
                }

                if (userData.role !== "school") {
                    // Allow access anyway with email-based school
                    console.warn('⚠️ Unknown role:', userData.role, '- using email-based default');
                    setUserEmail(user.email);
                    setSchools([user.email.split('@')[0].toUpperCase()]);
                    setLoading(false);
                    return;
                }

                const userSchools = userData.schools || [];
                console.log('🏫 User schools:', userSchools);

                if (userSchools.length === 0) {
                    console.warn('⚠️ No schools linked - using email-based default');
                    setUserEmail(user.email);
                    setSchools([user.email.split('@')[0].toUpperCase()]);
                    setLoading(false);
                    return;
                }

                console.log('✅ Setting user email and schools');
                setUserEmail(user.email);
                setSchools(userSchools);
            } catch (error: any) {
                console.error("❌ Error fetching user data:", error);
                console.log('✅ Allowing access with email-based default school');
                setUserEmail(user.email);
                setSchools([user.email.split('@')[0].toUpperCase()]);
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
                    <p className="text-slate-600">Carregando...</p>
                </div>
            </div>
        );
    }



    // Single school - show directly
    if (schools.length === 1) {
        return <SchoolDashboardContent school={schools[0]} />;
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
                            <SchoolDashboardContent school={school} />
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </div>
    );
}
