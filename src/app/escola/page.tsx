'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Use exported auth instead
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '@/lib/firebase'; // Import auth from here
import { normalizeSchoolName } from '@/lib/utils';
import SchoolDashboardContent from '@/components/school-dashboard-content';
import { GraduationCap, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFullSchoolName } from "@/lib/utils";

export default function SchoolDashboardPage() {
    const router = useRouter();
    const [schools, setSchools] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState<string>('');
    const [activeTab, setActiveTab] = useState<string>('');

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

                const userSchools = userData.schools || [];
                console.log('🏫 User schools:', userSchools);

                if (userSchools.length > 0) {
                    // Check role just for warning/logging, but allow access if schools exist
                    if (userData.role !== "school" && userData.role !== "school_responsible") {
                        console.warn('⚠️ Unknown role:', userData.role, '- but schools present, allowing access');
                    }

                    console.log('✅ Setting user email and schools from API');
                    setUserEmail(user.email);
                    setSchools(userSchools);
                    setActiveTab(userSchools[0]);
                    setLoading(false);
                    return;
                }

                // If we reach here, no schools were returned from API
                console.warn('⚠️ No schools linked in API - using email-based default');

                // Fallback logic
                setUserEmail(user.email);
                const defaultSchool = normalizeSchoolName(user.email?.split('@')[0]) || user.email?.split('@')[0].toUpperCase();
                setSchools([defaultSchool]);
                setActiveTab(defaultSchool);
                setLoading(false);


                console.log('✅ Setting user email and schools');
                setUserEmail(user.email);
                setSchools(userSchools);
                if (userSchools.length > 0) {
                    setActiveTab(userSchools[0]);
                }
            } catch (error: any) {
                console.error("❌ Error fetching user data:", error);
                console.log('✅ Allowing access with email-based default school');
                setUserEmail(user.email);
                console.log('✅ Allowing access with email-based default school');
                setUserEmail(user.email);
                const defaultSchool = normalizeSchoolName(user.email?.split('@')[0]) || user.email?.split('@')[0].toUpperCase();
                setSchools([defaultSchool]);
                setActiveTab(defaultSchool);
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
            <div className="p-4 md:p-6 space-y-6">

                {/* School Selector Tabs */}
                {activeTab && (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col space-y-6">
                        <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                                        <GraduationCap className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-blue-600 tracking-wider uppercase">Unidade Escolar</p>
                                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 line-clamp-1">{getFullSchoolName(activeTab)}</h1>
                                    </div>
                                </div>
                            </div>

                            {schools.length > 1 && (
                                <TabsList className="w-full justify-start h-auto p-1 bg-slate-100 rounded-lg overflow-x-auto flex-wrap sm:flex-nowrap">
                                    {schools.map((school) => (
                                        <TabsTrigger
                                            key={school}
                                            value={school}
                                            className="flex-1 min-w-[150px] rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm data-[state=active]:font-semibold py-2 transition-all"
                                        >
                                            {getFullSchoolName(school)}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            )}
                        </div>

                        {/* Content Area */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <SchoolDashboardContent school={activeTab} hideHeader={true} />
                        </div>
                    </Tabs>
                )}
            </div>
        </div>
    );
}
