'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import SchoolDashboardContent from '@/components/school-dashboard-content';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Loader2 } from 'lucide-react';

export default function SchoolDashboardPage() {
    const router = useRouter();
    const [schools, setSchools] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState<string>('');

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user || !user.email) {
                router.push('/login');
                return;
            }

            try {
                // Get user document from Firestore
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists() || userDoc.data().role !== "school") {
                    router.push('/login?error=not_school');
                    return;
                }

                const userSchools = userDoc.data().schools || [];
                if (userSchools.length === 0) {
                    router.push('/login?error=not_school');
                    return;
                }

                setUserEmail(user.email);
                setSchools(userSchools);
            } catch (error) {
                console.error("Error fetching user data:", error);
                router.push('/login');
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
