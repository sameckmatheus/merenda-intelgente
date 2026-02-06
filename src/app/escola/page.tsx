'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Use exported auth instead
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '@/lib/firebase'; // Import auth from here
import { normalizeSchoolName } from '@/lib/utils';
import SchoolDashboardContent from '@/components/school-dashboard-content';
import { GraduationCap, Loader2, RefreshCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
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

                if (userData.role !== "school") {
                    // Allow access anyway with email-based school
                    console.warn('⚠️ Unknown role:', userData.role, '- using email-based default');
                    setUserEmail(user.email);
                    const derivedSchool = normalizeSchoolName(user.email?.split('@')[0]) || user.email?.split('@')[0].toUpperCase();
                    setSchools([derivedSchool]);
                    setLoading(false);
                    return;
                }

                const userSchools = userData.schools || [];
                console.log('🏫 User schools:', userSchools);

                if (userSchools.length === 0) {
                    console.warn('⚠️ No schools linked - using email-based default');
                    setUserEmail(user.email);
                    setUserEmail(user.email);
                    const defaultSchool = normalizeSchoolName(user.email?.split('@')[0]) || user.email?.split('@')[0].toUpperCase();
                    setSchools([defaultSchool]);
                    setActiveTab(defaultSchool);
                    setLoading(false);
                    return;
                }

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
                {/* Header with Switcher */}
                {activeTab && (
                    <div className="flex flex-col space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                    <GraduationCap className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-blue-600 tracking-wider uppercase">Unidade Escolar</p>
                                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{getFullSchoolName(activeTab)}</h1>
                                </div>
                            </div>

                            {schools.length > 1 && (
                                <Button
                                    onClick={() => {
                                        const currentIndex = schools.indexOf(activeTab);
                                        const nextIndex = (currentIndex + 1) % schools.length;
                                        setActiveTab(schools[nextIndex]);
                                    }}
                                    variant="outline"
                                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 hover:text-white text-white gap-2 h-10"
                                >
                                    <RefreshCcw className="h-4 w-4" />
                                    Trocar de Escola
                                </Button>
                            )}
                        </div>

                        {/* Content Area */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <SchoolDashboardContent school={activeTab} hideHeader={true} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
