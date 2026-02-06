"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar as CalendarIcon, Loader2, Send, AlertTriangle, Building2, Utensils, Users, Package, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cn, normalizeSchoolName, getFullSchoolName } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
    respondentName: z.string().min(3, "Nome é obrigatório"),
    school: z.string().min(1, "Escola é obrigatória"),
    date: z.date({ required_error: "Data é obrigatória" }),
    shift: z.enum(["manhã", "tarde", "noite"], { required_error: "Selecione um turno" }),
    menuType: z.enum(["planned", "alternative", "improvised"], { required_error: "Selecione o tipo de cardápio" }),
    alternativeMenuDescription: z.string().optional(),
    totalStudents: z.coerce.number().min(0, "Total de alunos é obrigatório"),
    presentStudents: z.coerce.number().min(0, "Alunos presentes é obrigatório"),
    observations: z.string().optional(),
    hasSupplyIssues: z.boolean().default(false),
    missingItems: z.string().optional(),
    canBuyMissingItems: z.enum(["sim", "nao"]).optional(),
    itemsPurchased: z.string().optional(),
    hasReceivedSupplies: z.boolean().default(false),
    suppliesDescription: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function FormularioPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [schoolName, setSchoolName] = useState<string>("");
    const [availableSchools, setAvailableSchools] = useState<string[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            respondentName: "",
            school: "",
            date: new Date(),
            shift: "manhã",
            menuType: "planned",
            alternativeMenuDescription: "",
            totalStudents: 0,
            presentStudents: 0,
            observations: "",
            hasSupplyIssues: false,
            missingItems: "",
            hasReceivedSupplies: false,
            suppliesDescription: "",
        },
    });

    const menuType = form.watch("menuType");
    const hasSupplyIssues = form.watch("hasSupplyIssues");
    const hasReceivedSupplies = form.watch("hasReceivedSupplies");
    const canBuyMissingItems = form.watch("canBuyMissingItems");
    const totalStudents = form.watch("totalStudents");
    const presentStudents = form.watch("presentStudents");

    const absentStudents = totalStudents - presentStudents;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push("/login");
                return;
            }

            try {
                // Get ID token for API authentication
                const idToken = await user.getIdToken();

                // Fetch user profile from API (bypassing client-side permission issues)
                const res = await fetch('/api/user/me', {
                    headers: {
                        'Authorization': `Bearer ${idToken}`
                    }
                });

                if (!res.ok) throw new Error('Failed to fetch user data');

                const userData = await res.json();

                if (userData.role !== "school") {
                    router.push("/login"); // Or access denied page
                    return;
                }

                const schools = userData.schools || [];
                if (schools.length === 0) {
                    toast({
                        variant: "destructive",
                        title: "Erro",
                        description: "Nenhuma escola associada ao usuário.",
                    });
                    // router.push("/login"); // Optional: let them see the empty state or redirect
                    return;
                }

                const school = schools[0];
                setSchoolName(school);
                setAvailableSchools(schools);

                // Set form default values
                form.setValue("school", school);
                form.setValue("respondentName", userData.name || user.displayName || user.email?.split('@')[0] || "");

            } catch (error) {
                console.error("Error fetching user data:", error);

                // Fallback Logic
                if (user.email) {
                    console.log("⚠️ API Failed, using fallback from email");
                    const email = user.email;
                    let schoolsList: string[] = [];

                    if (email === 'marcosfreiremunicipal@gmail.com') {
                        schoolsList = ['MARCOS FREIRE', 'ANEXO MARCOS FREIRE'];
                    } else {
                        const derivedSchool = normalizeSchoolName(email.split('@')[0]) || email.split('@')[0].toUpperCase();
                        schoolsList = [derivedSchool];
                    }

                    if (schoolsList.length > 0) {
                        const school = schoolsList[0];
                        setSchoolName(school);
                        setAvailableSchools(schoolsList);
                        form.setValue("school", school);
                        form.setValue("respondentName", user.displayName || email.split('@')[0]);
                        return;
                    }
                }

                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: "Não foi possível carregar os dados do usuário. Recarregue a página.",
                });
            } finally {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router, form, toast]);

    const onSubmit = async (values: FormValues) => {
        setIsSubmitting(true);

        try {
            const submissionData = {
                respondentName: values.respondentName,
                school: values.school,
                date: Timestamp.fromDate(values.date),
                shift: values.shift,
                menuType: values.menuType,
                totalStudents: values.totalStudents,
                presentStudents: values.presentStudents,
                helpNeeded: values.hasSupplyIssues,
                alternativeMenuDescription: values.menuType === "alternative" ? values.alternativeMenuDescription : undefined,
                menuAdaptationReason: values.menuType === "improvised" ? values.alternativeMenuDescription : undefined,
                suppliesReceived: values.hasReceivedSupplies,
                suppliesDescription: values.hasReceivedSupplies ? values.suppliesDescription : undefined,
                missingItems: values.hasSupplyIssues ? values.missingItems : undefined,
                canBuyMissingItems: values.hasSupplyIssues ? (values.canBuyMissingItems === "sim") : undefined,
                itemsPurchased: values.hasSupplyIssues && values.canBuyMissingItems === "sim" ? values.itemsPurchased : undefined,
                observations: values.observations,
                status: "pendente",
            };

            await addDoc(collection(db, "submissions"), submissionData);

            setShowSuccess(true);

            toast({
                title: "✓ Registro enviado com sucesso!",
                description: "O registro de merenda foi salvo no sistema.",
            });

            setTimeout(() => {
                form.reset();
                setShowSuccess(false);
                form.setValue("date", new Date());
            }, 3000);

        } catch (error) {
            console.error("Error submitting form:", error);
            toast({
                variant: "destructive",
                title: "Erro ao enviar registro",
                description: "Não foi possível enviar o formulário. Tente novamente.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-0">
                    <CardContent className="pt-6 text-center">
                        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Registro Enviado!</h2>
                        <p className="text-slate-600">Seu registro de merenda foi salvo com sucesso.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
            <div className="w-full">
                {/* Header */}
                <h1 className="text-3xl font-bold text-blue-950 mb-4">Registro Diário</h1>

                {/* Alert */}
                {/* Custom Alert */}
                <div className="mb-8 flex flex-col sm:flex-row items-center gap-3 bg-yellow-400 border border-yellow-200 rounded-xl p-4 text-yellow-900 text-sm font-medium shadow-sm w-full shadow-yellow-400/20">
                    <div className="p-2 bg-yellow-100 rounded-lg shrink-0 text-yellow-700">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        Preencha os campos abaixo com as informações do dia.
                        <span className="block sm:inline mt-1 sm:mt-0 sm:ml-1">
                            O prazo para realização do preenchimento do formulário é de até <span className="inline-flex items-center gap-1 font-bold bg-yellow-100/50 px-2 py-0.5 rounded text-yellow-800 border border-yellow-200/50"><Clock className="w-3.5 h-3.5" /> 40 minutos</span> após o início das aulas.
                        </span>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Unidade Escolar & Data */}
                        <Card className="border-0 shadow-xl shadow-blue-900/5 rounded-2xl bg-white">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Building2 className="w-5 h-5" />
                                    <h2 className="text-lg font-semibold text-blue-800">Unidade Escolar & Data</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <FormField
                                        control={form.control}
                                        name="school"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Escola</FormLabel>
                                                <FormControl>
                                                    {availableSchools.length > 1 ? (
                                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="bg-slate-50/50 h-12 rounded-xl border-slate-200">
                                                                    <SelectValue placeholder="Selecione a escola" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {availableSchools.map((school) => (
                                                                    <SelectItem key={school} value={school}>
                                                                        {getFullSchoolName(school)}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <Input value={schoolName ? getFullSchoolName(schoolName) : ''} disabled className="bg-slate-50/50 h-12 rounded-xl border-slate-200" />
                                                    )}
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Data do Registro</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                className={cn(
                                                                    "w-full justify-start text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                                {field.value ? format(field.value, "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione a data"}
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            locale={ptBR}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="shift"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Turno</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="manhã">Manhã</SelectItem>
                                                        <SelectItem value="tarde">Tarde</SelectItem>
                                                        <SelectItem value="noite">Noite</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="respondentName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Seu Nome</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Quem está preenchendo?" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Layout com 2 colunas */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Coluna Esquerda - 2/3 */}
                            <div className="lg:col-span-8 flex flex-col gap-6">
                                {/* Alimentação Escolar */}
                                <Card className="border-0 shadow-xl shadow-blue-900/5 rounded-2xl bg-white">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Utensils className="w-5 h-5" />
                                            <h2 className="text-lg font-semibold text-blue-800">Alimentação Escolar</h2>
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="menuType"
                                            render={({ field }) => (
                                                <FormItem className="space-y-3 mb-4">
                                                    <FormLabel>Qual cardápio foi servido hoje?</FormLabel>
                                                    <FormControl>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => field.onChange("planned")}
                                                                className={cn(
                                                                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
                                                                    field.value === "planned"
                                                                        ? "border-[#10B981] bg-[#10B981] text-white shadow-inner"
                                                                        : "border-slate-100 bg-transparent text-slate-600 hover:border-[#10B981] hover:bg-[#10B981]/10"
                                                                )}
                                                            >
                                                                <CalendarIcon className="w-6 h-6 mb-2" />
                                                                <span className="text-sm font-medium">Previsto</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => field.onChange("alternative")}
                                                                className={cn(
                                                                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
                                                                    field.value === "alternative"
                                                                        ? "border-[#F59E0B] bg-[#F59E0B] text-white shadow-inner"
                                                                        : "border-slate-100 bg-transparent text-slate-600 hover:border-[#F59E0B] hover:bg-[#F59E0B]/10"
                                                                )}
                                                            >
                                                                <Utensils className="w-6 h-6 mb-2" />
                                                                <span className="text-sm font-medium">Alternativo</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => field.onChange("improvised")}
                                                                className={cn(
                                                                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
                                                                    field.value === "improvised"
                                                                        ? "border-[#EF4444] bg-[#EF4444] text-white shadow-inner"
                                                                        : "border-slate-100 bg-transparent text-slate-600 hover:border-[#EF4444] hover:bg-[#EF4444]/10"
                                                                )}
                                                            >
                                                                <AlertCircle className="w-6 h-6 mb-2" />
                                                                <span className="text-sm font-medium">Improvisado</span>
                                                            </button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {(menuType === "alternative" || menuType === "improvised") && (
                                            <FormField
                                                control={form.control}
                                                name="alternativeMenuDescription"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Descreva o que foi servido</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Ex: Arroz com cenoura..."
                                                                className="resize-none"
                                                                rows={4}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Observações Gerais */}
                                <Card className="border-0 shadow-xl shadow-blue-900/5 rounded-2xl bg-white h-full">
                                    <CardContent className="pt-6 h-full flex flex-col">
                                        <FormField
                                            control={form.control}
                                            name="observations"
                                            render={({ field }) => (
                                                <FormItem className="h-full flex flex-col mb-0">
                                                    <FormLabel className="flex items-center gap-2">
                                                        <span>📝</span>
                                                        Observações Gerais
                                                    </FormLabel>
                                                    <FormControl className="flex-1">
                                                        <Textarea
                                                            placeholder="Algo mais a relatar?"
                                                            className="resize-none h-full bg-slate-50/50 min-h-[120px]"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Coluna Direita - 1/3 */}
                            <div className="lg:col-span-4 flex flex-col gap-6 h-full">
                                {/* Frequência */}
                                <Card className="border-0 shadow-xl shadow-blue-900/5 rounded-2xl bg-white">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Users className="w-5 h-5" />
                                            <h2 className="text-lg font-semibold text-blue-800">Frequência</h2>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-sm text-gray-600 mb-2">Total <span className="text-green-600 font-semibold">Matriculados</span></p>
                                                <FormField
                                                    control={form.control}
                                                    name="totalStudents"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <div className="flex items-center gap-2 bg-[#F9FAFB] p-3 rounded-lg">
                                                                    <Users className="w-4 h-4 text-gray-400" />
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        className="border-0 bg-transparent p-0 text-lg font-semibold focus-visible:ring-0"
                                                                        {...field}
                                                                    />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div>
                                                <p className="text-sm text-gray-600 mb-2">Presentes: <span className="text-blue-600 font-semibold">Hoje</span></p>
                                                <FormField
                                                    control={form.control}
                                                    name="presentStudents"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <div className="flex items-center gap-2 bg-[#F9FAFB] p-3 rounded-lg">
                                                                    <Users className="w-4 h-4 text-blue-400" />
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        className="border-0 bg-transparent p-0 text-lg font-semibold focus-visible:ring-0"
                                                                        {...field}
                                                                    />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Suprimentos & Apoio */}
                                <div className="flex flex-col gap-4 flex-1">
                                    <div className="flex items-center gap-2">
                                        <Package className="w-5 h-5" />
                                        <h2 className="text-lg font-semibold text-blue-800">Suprimentos & Apoio</h2>
                                    </div>

                                    {/* Falta de Itens */}
                                    <Card className={cn(
                                        "border-0 shadow-xl shadow-blue-900/5 rounded-2xl transition-all flex-1 flex flex-col",
                                        hasSupplyIssues ? "ring-2 ring-amber-400 bg-amber-50/30" : "bg-white"
                                    )}>
                                        <CardContent className={cn(
                                            "pt-4 h-full flex flex-col",
                                            !hasSupplyIssues && "justify-center"
                                        )}>
                                            <FormField
                                                control={form.control}
                                                name="hasSupplyIssues"
                                                render={({ field }) => (
                                                    <FormItem className={cn(
                                                        "flex items-center justify-between space-y-0",
                                                        hasSupplyIssues ? "mb-3" : "mb-0"
                                                    )}>
                                                        <FormLabel className="flex items-center gap-2 text-[#92400E] font-semibold cursor-pointer">
                                                            <AlertCircle className="w-5 h-5 text-[#F59E0B]" />
                                                            Falta de Itens?
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                                className="data-[state=checked]:bg-[#F59E0B] data-[state=checked]:border-[#F59E0B]"
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            {hasSupplyIssues && (
                                                <div className="space-y-3">
                                                    <FormField
                                                        control={form.control}
                                                        name="missingItems"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-sm text-gray-700">Quais itens?</FormLabel>
                                                                <FormControl>
                                                                    <Textarea
                                                                        placeholder="Liste aqui..."
                                                                        className="resize-none bg-[#F9FAFB]"
                                                                        rows={3}
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="canBuyMissingItems"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-sm text-gray-700">Escola pode comprar?</FormLabel>
                                                                <FormControl>
                                                                    <RadioGroup
                                                                        onValueChange={field.onChange}
                                                                        value={field.value}
                                                                        className="flex gap-4"
                                                                    >
                                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                                            <FormControl>
                                                                                <RadioGroupItem value="sim" />
                                                                            </FormControl>
                                                                            <FormLabel className="font-normal cursor-pointer">Sim</FormLabel>
                                                                        </FormItem>
                                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                                            <FormControl>
                                                                                <RadioGroupItem value="nao" />
                                                                            </FormControl>
                                                                            <FormLabel className="font-normal cursor-pointer">Não</FormLabel>
                                                                        </FormItem>
                                                                    </RadioGroup>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {canBuyMissingItems === "sim" && (
                                                        <FormField
                                                            control={form.control}
                                                            name="itemsPurchased"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-sm text-gray-700">Detalhes da Compra</FormLabel>
                                                                    <FormControl>
                                                                        <Textarea
                                                                            placeholder="O que foi comprado?"
                                                                            className="resize-none bg-[#F9FAFB]"
                                                                            rows={3}
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Recebimento */}
                                    <Card className={cn(
                                        "border-0 shadow-xl shadow-blue-900/5 rounded-2xl transition-all flex-1 flex flex-col",
                                        hasReceivedSupplies ? "ring-2 ring-blue-400 bg-blue-50/30" : "bg-white"
                                    )}>
                                        <CardContent className={cn(
                                            "pt-4 h-full flex flex-col",
                                            !hasReceivedSupplies && "justify-center"
                                        )}>
                                            <FormField
                                                control={form.control}
                                                name="hasReceivedSupplies"
                                                render={({ field }) => (
                                                    <FormItem className={cn(
                                                        "flex items-center justify-between space-y-0",
                                                        hasReceivedSupplies ? "mb-3" : "mb-0"
                                                    )}>
                                                        <FormLabel className="flex items-center gap-2 text-[#1E40AF] font-semibold cursor-pointer">
                                                            <Package className="w-5 h-5 text-[#3B82F6]" />
                                                            Recebimento?
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                                className="data-[state=checked]:bg-[#3B82F6] data-[state=checked]:border-[#3B82F6]"
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            {hasReceivedSupplies && (
                                                <FormField
                                                    control={form.control}
                                                    name="suppliesDescription"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-sm text-gray-700">Itens Recebidos</FormLabel>
                                                            <FormControl>
                                                                <Textarea
                                                                    placeholder="Liste aqui..."
                                                                    className="resize-none bg-[#F9FAFB]"
                                                                    rows={4}
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-600/20 rounded-xl transition-all hover:scale-[1.00] active:scale-[0.98]"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-5 w-5" />
                                    Enviar Registro Diário
                                </>
                            )}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
}
