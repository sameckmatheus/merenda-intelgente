'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { getSchoolsByEmail, isSchoolEmail } from '@/lib/school-auth';
import SchoolDashboardContent from '@/components/school-dashboard-content';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SchoolDashboardPage() {
    const router = useRouter();
    const [schools, setSchools] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState<string>('');

    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user || !user.email) {
                router.push('/login');
                return;
            }

            // Verify it's a school email
            if (!isSchoolEmail(user.email)) {
                router.push('/login?error=not_school');
                return;
            }

            const userSchools = getSchoolsByEmail(user.email);
            if (!userSchools || userSchools.length === 0) {
                router.push('/login?error=not_school');
                return;
            }

            setUserEmail(user.email);
            setSchools(userSchools);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        const auth = getAuth(app);
        await auth.signOut();

        // Clear session cookie
        await fetch('/api/logout', { method: 'POST' });

        router.push('/login');
    };

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
