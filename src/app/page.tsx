
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Send,
  LoaderCircle,
  ClipboardList,
  Building,
  User,
  Utensils,
  MessageSquare,
  Clock,
  PackageCheck,
  Calendar as CalendarIcon,
  ShoppingBasket,
  Users,
  UserCheck,
  HelpCircle,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ptBR } from 'date-fns/locale';
import { Combobox } from "@/components/ui/combobox";

const schools = [
  "ANEXO MARCOS FREIRE",
  "BARBAPAPA",
  "CARLOS AYRES",
  "DILMA",
  "FRANCELINA",
  "GERCINA ALVES",
  "JOÃO BENTO",
  "MARCOS FREIRE",
  "MARIA JOSÉ",
  "MARIA OLIVEIRA",
  "MUNDO DA CRIANÇA",
  "MÃE BELA",
  "OTACÍLIA",
  "SABINO",
  "ZÉLIA",
  "ZULEIDE",
].sort();

const shifts = ["Manhã", "Tarde", "Noite"];

const formSchema = z.object({
  school: z.string().min(1, "Selecione uma escola."),
  respondentName: z.string().min(1, "O nome é obrigatório."),
  shift: z.string().min(1, "Selecione um turno."),
  date: z.date({ required_error: "A data é obrigatória." }),
  totalStudents: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().positive().min(1, "Informe o total de alunos.")
  ),
  presentStudents: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().min(0, "Informe o número de alunos presentes.")
  ),
  menuType: z.enum(["planned", "alternative", "improvised"], {
    required_error: "Selecione o tipo de cardápio utilizado.",
  }),
  alternativeMenuDescription: z.string().optional(),
  helpNeeded: z.boolean().default(false),
  canBuyMissingItems: z.boolean().optional(),
  missingItems: z.string().optional(),
  suppliesReceived: z.boolean().default(false),
  suppliesDescription: z.string().optional(),
  itemsPurchased: z.string().optional(),
  observations: z.string().optional(),
}).refine(data => {
  if (data.helpNeeded && data.canBuyMissingItems === undefined) {
    return false;
  }
  return true;
}, {
  message: "Selecione se pode ou não comprar os itens.",
  path: ["canBuyMissingItems"],
});


export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [lastSubmissionId, setLastSubmissionId] = useState<string | null>(null);
  const [isSuccessAlertOpen, setIsSuccessAlertOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      school: "",
      respondentName: "",
      shift: "",
      date: undefined, // Initialize as undefined
      totalStudents: 0,
      presentStudents: 0,
      alternativeMenuDescription: "",
      helpNeeded: false,
      missingItems: "",
      suppliesReceived: false,
      suppliesDescription: "",
      itemsPurchased: "",
      observations: "",
    },
  });

  const { watch, setValue } = form;

  useEffect(() => {
    // Set the date only on the client side
    setValue('date', new Date());
  }, [setValue]);


  const menuTypeValue = watch("menuType");
  const suppliesReceivedValue = watch("suppliesReceived");
  const helpNeededValue = watch("helpNeeded");
  const canBuyMissingItemsValue = watch("canBuyMissingItems");

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const docRef = await addDoc(collection(db, "submissions"), {
        ...data,
        createdAt: Timestamp.now(),
        date: Timestamp.fromDate(data.date),
      });
      setLastSubmissionId(docRef.id);
      setIsSuccessAlertOpen(true);
      form.reset({
        ...form.getValues(),
        date: new Date(),
        totalStudents: 0,
        presentStudents: 0,
        menuType: undefined,
        alternativeMenuDescription: "",
        helpNeeded: false,
        canBuyMissingItems: undefined,
        missingItems: "",
        suppliesReceived: false,
        suppliesDescription: "",
        itemsPurchased: "",
        observations: "",
      });
    } catch (error) {
      console.error("Erro ao enviar o formulário:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Enviar",
        description: "Não foi possível registrar os dados. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleMenuTypeChange = (value: "planned" | "alternative" | "improvised") => {
    setValue("menuType", value, { shouldValidate: true });
  };

  const handleGenerateReceipt = () => {
    if (lastSubmissionId) {
      window.open(`/receipt/${lastSubmissionId}`, '_blank');
    }
    setIsSuccessAlertOpen(false);
  };


  return (
    <>
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-20">
        <header className="sticky top-0 z-10 bg-[#275fcf] border-b border-[#204ecf] shadow-lg shadow-blue-900/10 text-white">
          <div className="container mx-auto flex h-20 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                <Logo />
              </div>
              <div>
                <h1 className="font-headline text-2xl font-bold tracking-tight text-white">
                  Smart Plate
                </h1>
                <p className="text-blue-100 text-xs font-medium opacity-90">Gestão Inteligente de Merenda</p>
              </div>
            </div>
            <Link href="/admin" passHref>
              <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2 text-white hover:bg-white/10 hover:text-white border border-white/20 transition-all rounded-xl">
                <ClipboardList className="w-4 h-4" />
                <span>Dashboard</span>
              </Button>
            </Link>
          </div>
        </header>

        <main className="container mx-auto p-4 md:p-8 w-full">
          <div className="mb-8 text-center sm:text-left space-y-2">
            <h2 className="text-3xl font-bold text-blue-950">Registro Diário</h2>
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-yellow-400 border border-yellow-200 rounded-xl p-4 text-yellow-800 text-sm font-medium shadow-sm w-full mx-auto sm:mx-0">
              <div className="p-2 bg-yellow-100 rounded-lg shrink-0 text-yellow-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                Preencha os campos abaixo com as informações do dia.
                <span className="block sm:inline mt-1 sm:mt-0 sm:ml-1">
                  O prazo para realização do preenchimento do formulário é de até <span className="inline-flex items-center gap-1 font-bold bg-yellow-100/50 px-2 py-0.5 rounded text-yellow-700 border border-yellow-200/50"><Clock className="w-3.5 h-3.5" /> 40 minutos</span> após o início das aulas.
                </span>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">

              {/* Seção 1: Informações Básicas (Full Width) */}
              <section className="col-span-1 lg:col-span-12 space-y-4">
                <div className="flex items-center gap-2 text-blue-800 font-semibold mb-2 ml-1">
                  <Building className="w-5 h-5" />
                  <h3>Unidade Escolar & Data</h3>
                </div>
                <Card className="border-0 shadow-xl shadow-blue-900/5 overflow-hidden rounded-2xl bg-white">
                  <CardContent className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                    <FormField control={form.control} name="school" render={({ field }) => (
                      <FormItem className="space-y-2 lg:col-span-2">
                        <FormLabel className="text-slate-600 font-medium">Escola</FormLabel>
                        <FormControl>
                          <Combobox
                            options={schools.map(s => ({ value: s, label: s }))}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Selecione a escola..."
                            searchPlaceholder="Procurar escola..."
                            emptyMessage="Nenhuma escola encontrada."
                            className="h-12 border-slate-200 bg-slate-50/50 rounded-xl"
                            hideSearch={true}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem className="space-y-2 lg:col-span-1">
                        <FormLabel className="text-slate-600 font-medium">Data do Registro</FormLabel>
                        {isClient && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "h-12 w-full pl-3 text-left font-normal border-slate-200 bg-slate-50/50 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: ptBR })
                                  ) : (
                                    <span>Selecione a data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-xl shadow-xl border-blue-100" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                locale={ptBR}
                                className="p-3"
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="shift" render={({ field }) => (
                      <FormItem className="space-y-2 lg:col-span-1">
                        <FormLabel className="text-slate-600 font-medium">Turno</FormLabel>
                        <FormControl>
                          <Combobox
                            options={shifts.map(s => ({ value: s, label: s }))}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Selecione..."
                            className="h-12 border-slate-200 bg-slate-50/50 rounded-xl"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="respondentName" render={({ field }) => (
                      <FormItem className="space-y-2 lg:col-span-4">
                        <FormLabel className="text-slate-600 font-medium">Seu Nome</FormLabel>
                        <div className="relative">
                          <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                          <FormControl>
                            <Input className="pl-10 h-12 border-slate-200 bg-slate-50/50 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-all hover:bg-slate-50" placeholder="Quem está preenchendo?" {...field} />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )} />

                  </CardContent>
                </Card>
              </section>

              {/* Coluna Esquerda: Cardápio e Observações */}
              <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">

                {/* Seção 3: Cardápio */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-800 font-semibold mb-2 ml-1">
                    <Utensils className="w-5 h-5" />
                    <h3>Alimentação Escolar</h3>
                  </div>
                  <Card className="border-0 shadow-xl shadow-blue-900/5 overflow-hidden rounded-2xl bg-white h-full">
                    <CardContent className="p-6 md:p-8 space-y-6">
                      <FormField control={form.control} name="menuType" render={() => (
                        <FormItem className="space-y-4">
                          <FormLabel className="text-slate-600 font-medium block">Qual cardápio foi servido hoje?</FormLabel>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                              { value: 'planned', label: 'Cardápio Previsto', icon: <CalendarIcon className="w-4 h-4" /> },
                              { value: 'alternative', label: 'Cardápio Alternativo', icon: <Utensils className="w-4 h-4" /> },
                              { value: 'improvised', label: 'Cardápio Improvisado', icon: <HelpCircle className="w-4 h-4" /> }
                            ].map((type) => (
                              <Button
                                key={type.value}
                                type="button"
                                variant="outline"
                                onClick={() => handleMenuTypeChange(type.value as any)}
                                className={cn(
                                  "h-auto py-4 flex flex-col gap-2 rounded-xl border-2 transition-all hover:border-blue-300 hover:bg-blue-50/50",
                                  menuTypeValue === type.value
                                    ? "border-blue-600 bg-blue-50 text-blue-700 font-semibold shadow-inner"
                                    : "border-slate-100 bg-transparent text-slate-600"
                                )}
                              >
                                {type.icon}
                                {type.label}
                              </Button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />

                      {menuTypeValue === "alternative" && (
                        <FormField control={form.control} name="alternativeMenuDescription" render={({ field }) => (
                          <FormItem className="animate-in fade-in slide-in-from-top-4 duration-300">
                            <FormLabel className="text-slate-600 font-medium">Descreva o que foi servido</FormLabel>
                            <FormControl>
                              <Textarea className="min-h-[100px] border-slate-200 bg-slate-50/50 rounded-xl focus:ring-blue-500" placeholder="Ex: Arroz com cenoura..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}
                    </CardContent>
                  </Card>
                </section>

                {/* Seção 5: Observações */}
                <section className="space-y-4 flex-1">
                  <Card className="border-0 shadow-xl shadow-blue-900/5 rounded-2xl bg-white h-full">
                    <CardContent className="p-6 md:p-8">
                      <FormField control={form.control} name="observations" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-600 font-medium flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Observações Gerais</FormLabel>
                          <FormControl>
                            <Textarea className="min-h-[120px] border-slate-200 bg-slate-50/50 rounded-xl focus:ring-blue-500 resize-y" placeholder="Algo mais a relatar?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>
                </section>
              </div>


              {/* Coluna Direita: Sidebar */}
              <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">

                {/* Seção 2: Alunos */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-800 font-semibold mb-2 ml-1">
                    <Users className="w-5 h-5" />
                    <h3>Frequência</h3>
                  </div>
                  <Card className="border-0 shadow-xl shadow-blue-900/5 overflow-hidden rounded-2xl bg-white">
                    <CardContent className="p-6 space-y-6">
                      <FormField control={form.control} name="totalStudents" render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-slate-600 font-medium">Total <span className="block sm:inline mt-1 sm:mt-0 sm:ml-1"><span className="inline-flex items-center gap-1 font-bold bg-green-100/50 px-2 py-0.5 rounded text-green-700 border border-green-200/50">Matriculados</span></span></FormLabel>
                          <div className="relative">
                            <Users className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                            <FormControl>
                              <Input type="number" className="pl-10 h-12 border-slate-200 bg-slate-50/50 rounded-xl focus:ring-blue-500" placeholder="0" {...field} value={field.value || ''} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="presentStudents" render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-slate-600 font-medium">Presentes<span className="block sm:inline mt-1 sm:mt-0 sm:ml-1"><span className="inline-flex items-center gap-1 font-bold bg-blue-100/50 px-2 py-0.5 rounded text-blue-700 border border-blue-200/50">Hoje</span></span></FormLabel>
                          <div className="relative">
                            <UserCheck className="absolute left-3 top-3.5 h-5 w-5 text-emerald-500" />
                            <FormControl>
                              <Input type="number" className="pl-10 h-12 border-emerald-100 bg-emerald-50/30 rounded-xl focus:ring-emerald-500 focus:border-emerald-500" placeholder="0" {...field} value={field.value || ''} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>
                </section>

                {/* Seção 4: Suporte e Compras */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-800 font-semibold mb-2 ml-1">
                    <ShoppingBasket className="w-5 h-5" />
                    <h3>Suprimentos & Apoio</h3>
                  </div>
                  <div className="space-y-4">
                    {/* Card de Ajuda */}
                    <Card className={cn(
                      "border-0 shadow-xl shadow-blue-900/5 rounded-2xl transition-all duration-300",
                      helpNeededValue ? "ring-2 ring-amber-400 bg-amber-50/30" : "bg-white"
                    )}>
                      <CardContent className="p-4 space-y-4">
                        <FormField control={form.control} name="helpNeeded" render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-xl p-2">
                            <div className="space-y-1">
                              <FormLabel className="text-base font-semibold text-slate-700 flex items-center gap-2">
                                <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg"><HelpCircle className="w-4 h-4" /></div>
                                Falta de Itens?
                              </FormLabel>
                            </div>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="h-6 w-6 border-slate-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                              />
                            </FormControl>
                          </FormItem>
                        )} />

                        {helpNeededValue && (
                          <div className="space-y-4 pt-2 animate-in zoom-in-95 duration-200">
                            <FormField control={form.control} name="missingItems" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-600 text-sm">Quais itens?</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Liste aqui..." className="bg-white border-amber-200 focus:ring-amber-400 min-h-[80px]" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />

                            <FormField control={form.control} name="canBuyMissingItems" render={({ field }) => (
                              <FormItem className="space-y-2 p-3 bg-white rounded-xl border border-amber-100">
                                <FormLabel className="text-sm text-slate-700 font-medium">Escola pode comprar?</FormLabel>
                                <FormControl>
                                  <RadioGroup onValueChange={(value) => field.onChange(value === 'true')} defaultValue={field.value === undefined ? "" : String(field.value)} className="flex gap-4">
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="true" className="text-amber-600 border-slate-300" /></FormControl><FormLabel className="font-normal cursor-pointer">Sim</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="false" className="text-amber-600 border-slate-300" /></FormControl><FormLabel className="font-normal cursor-pointer">Não</FormLabel></FormItem>
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />

                            {canBuyMissingItemsValue === true && (
                              <FormField control={form.control} name="itemsPurchased" render={({ field }) => (
                                <FormItem className="animate-in fade-in slide-in-from-top-2">
                                  <FormLabel className="text-slate-600 text-sm">Detalhes da Compra</FormLabel>
                                  <FormControl><Textarea placeholder="O que foi comprado?" className="bg-white border-amber-200 min-h-[80px]" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Card de Recebimento */}
                    <Card className={cn(
                      "border-0 shadow-xl shadow-blue-900/5 rounded-2xl transition-all duration-300",
                      suppliesReceivedValue ? "ring-2 ring-blue-400 bg-blue-50/30" : "bg-white"
                    )}>
                      <CardContent className="p-4 space-y-4">
                        <FormField control={form.control} name="suppliesReceived" render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-xl p-2">
                            <div className="space-y-1">
                              <FormLabel className="text-base font-semibold text-slate-700 flex items-center gap-2">
                                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><PackageCheck className="w-4 h-4" /></div>
                                Recebimento?
                              </FormLabel>
                            </div>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="h-6 w-6 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                              />
                            </FormControl>
                          </FormItem>
                        )} />

                        {suppliesReceivedValue && (
                          <FormField control={form.control} name="suppliesDescription" render={({ field }) => (
                            <FormItem className="animate-in zoom-in-95 duration-200 pt-2">
                              <FormLabel className="text-slate-600 text-sm">Itens Recebidos</FormLabel>
                              <FormControl><Textarea className="bg-white border-blue-200 focus:ring-blue-400 min-h-[80px]" placeholder="Liste aqui..." {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </section>
              </div>

              {/* Botão de Envio */}
              <div className="col-span-1 lg:col-span-12 flex justify-center lg:justify-end pt-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading}
                  className="w-full  h-14 px-12 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-600/20 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? (<><LoaderCircle className="animate-spin mr-2" /> Enviando...</>) : (<><Send className="mr-2 w-5 h-5" /> Enviar Registro Diário</>)}
                </Button>
              </div>
            </form>
          </Form>
        </main>
      </div>

      <AlertDialog open={isSuccessAlertOpen} onOpenChange={setIsSuccessAlertOpen}>
        <AlertDialogContent className="rounded-2xl border-0 shadow-2xl max-h-[85vh] overflow-y-auto">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <AlertDialogTitle className="text-center text-xl font-bold text-slate-800">Registro Enviado!</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-500">
              As informações foram salvas com sucesso no sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-3">
            <AlertDialogCancel onClick={() => setIsSuccessAlertOpen(false)} className="rounded-xl border-slate-200 h-10 px-6 hover:bg-slate-50">Fechar</AlertDialogCancel>
            <Button onClick={handleGenerateReceipt} className="rounded-xl bg-blue-600 h-10 px-6 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
              <FileText className="w-4 h-4 mr-2" /> Gerar Comprovante
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
