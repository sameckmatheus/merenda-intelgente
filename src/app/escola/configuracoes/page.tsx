"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { User, Save, Mail, Loader2, LogOut } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SchoolProfile = {
    name: string;
    email: string;
    contacts: {
        email: string;
        whatsapp: string;
    };
    studentCounts: {
        morning: number;
        afternoon: number;
        night: number;
    };
};

export default function SchoolSettingsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [schoolName, setSchoolName] = useState("");
    const [userEmail, setUserEmail] = useState("");

    const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>({
        name: "",
        email: "",
        contacts: {
            email: "",
            whatsapp: "",
        },
        studentCounts: {
            morning: 0,
            afternoon: 0,
            night: 0,
        },
    });

    const [availableSchools, setAvailableSchools] = useState<string[]>([]);

    const fetchSettings = async (school: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/schools/settings?school=${encodeURIComponent(school)}`);
            if (response.ok) {
                const data = await response.json();
                setSchoolProfile(prev => ({
                    ...prev,
                    name: school, // Update name
                    contacts: data.settings?.contacts || { email: "", whatsapp: "" },
                    studentCounts: data.settings?.counts || { morning: 0, afternoon: 0, night: 0 }, // API returns 'counts' not 'studentCounts' based on SchoolDashboardContent
                }));
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast({
                title: "Erro",
                description: "Não foi possível carregar as configurações.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user || !user.email) {
                router.push("/login");
                return;
            }

            setUserEmail(user.email);
            setSchoolProfile(prev => ({ ...prev, email: user.email || "" }));

            try {
                // Fetch user data from API to get accurate schools list (handling exceptions/patches)
                const idToken = await user.getIdToken();
                const res = await fetch('/api/user/me', {
                    headers: {
                        'Authorization': `Bearer ${idToken}`
                    }
                });

                if (!res.ok) throw new Error('Failed to fetch user data');
                const userData = await res.json();

                if (userData.role !== "school") {
                    router.push("/login");
                    return;
                }

                const schools = userData.schools || [];
                if (schools.length === 0) {
                    router.push("/login");
                    return;
                }

                setAvailableSchools(schools);

                // Select first school by default if none selected
                if (!schoolName) {
                    const initialSchool = schools[0];
                    setSchoolName(initialSchool);
                    fetchSettings(initialSchool);
                }

            } catch (error) {
                console.error("Error fetching user data:", error);
                router.push("/login");
            }
        });

        return () => unsubscribe();
    }, [router, schoolName]);

    const handleSchoolChange = (newSchool: string) => {
        setSchoolName(newSchool);
        fetchSettings(newSchool);
    };


    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`/api/schools/settings?school=${encodeURIComponent(schoolName)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contacts: schoolProfile.contacts,
                    studentCounts: schoolProfile.studentCounts,
                }),
            });

            if (response.ok) {
                toast({
                    title: "Sucesso",
                    description: "Configurações atualizadas com sucesso.",
                });
            } else {
                throw new Error("Failed to save");
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            toast({
                title: "Erro",
                description: "Falha ao salvar configurações.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="w-full p-4 md:p-8 space-y-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-blue-950">Configurações</h2>
                    <p className="text-slate-500 mt-1">Gerencie as informações da sua escola</p>
                </div>

                {availableSchools.length > 1 && (
                    <div className="bg-white p-4 rounded-xl border shadow-sm space-y-2">
                        <Label>Selecionar Escola</Label>
                        <Select value={schoolName} onValueChange={handleSchoolChange}>
                            <SelectTrigger className="w-full md:w-[300px]">
                                <SelectValue placeholder="Selecione a escola" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableSchools.map((school) => (
                                    <SelectItem key={school} value={school}>
                                        {school}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <Tabs defaultValue="school" className="w-full space-y-6">

                    <TabsContent value="school" className="space-y-6">
                        <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Informações da Escola</CardTitle>
                                <CardDescription>Dados de contato e configurações da unidade escolar.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-4 p-4 border rounded-xl bg-blue-50/50">
                                    <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                        <User className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800">{schoolProfile.name}</h3>
                                        <p className="text-sm text-slate-500">{userEmail}</p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Contatos</h3>
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <Label>E-mail de Contato</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    type="email"
                                                    value={schoolProfile.contacts.email}
                                                    onChange={(e) => setSchoolProfile({ ...schoolProfile, contacts: { ...schoolProfile.contacts, email: e.target.value } })}
                                                    className="pl-9 bg-white"
                                                    placeholder="escola@exemplo.com"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>WhatsApp</Label>
                                            <Input
                                                type="tel"
                                                value={schoolProfile.contacts.whatsapp}
                                                onChange={(e) => setSchoolProfile({ ...schoolProfile, contacts: { ...schoolProfile.contacts, whatsapp: e.target.value } })}
                                                className="bg-white"
                                                placeholder="(00) 00000-0000"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Quantidade de Alunos por Turno</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Turno Manhã</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={schoolProfile.studentCounts.morning}
                                                onChange={(e) => setSchoolProfile({ ...schoolProfile, studentCounts: { ...schoolProfile.studentCounts, morning: parseInt(e.target.value) || 0 } })}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Turno Tarde</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={schoolProfile.studentCounts.afternoon}
                                                onChange={(e) => setSchoolProfile({ ...schoolProfile, studentCounts: { ...schoolProfile.studentCounts, afternoon: parseInt(e.target.value) || 0 } })}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Turno Noite</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={schoolProfile.studentCounts.night}
                                                onChange={(e) => setSchoolProfile({ ...schoolProfile, studentCounts: { ...schoolProfile.studentCounts, night: parseInt(e.target.value) || 0 } })}
                                                className="bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t bg-slate-50 px-6 py-4">
                                <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full sm:w-auto sm:ml-auto bg-blue-600 hover:bg-blue-700 text-white">
                                    {isSaving ? "Salvando..." : <><Save className="w-4 h-4 mr-2 inline-block" /> Salvar Alterações</>}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
