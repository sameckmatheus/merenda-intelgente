
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <div className="min-h-screen w-full bg-slate-50">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Logo />
            <h1 className="font-headline text-xl font-bold tracking-tight text-foreground">
              MenuPlanner
            </h1>
          </div>
          <Link href="/admin" passHref>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ClipboardList />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Registro Diário de Merenda</CardTitle>
            <CardDescription>
            Preencha os campos abaixo com as informações do dia. O prazo é até 40 minutos depois do início das aulas quando o preenchimento não for antecipado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="school" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Building /> Escola</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Selecione a escola" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>{schools.map((school) => (<SelectItem key={school} value={school}>{school}</SelectItem>))}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="respondentName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><User /> Nome do Responsável</FormLabel>
                        <FormControl><Input placeholder="Insira seu nome" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <FormField control={form.control} name="shift" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Clock /> Turno</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecione o turno" /></SelectTrigger></FormControl>
                          <SelectContent>{shifts.map((shift) => (<SelectItem key={shift} value={shift}>{shift}</SelectItem>))}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="flex items-center gap-2"><CalendarIcon /> Data do Registro</FormLabel>
                        {isClient && <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? (format(field.value, "PPP")) : (<span>Selecione a data</span>)}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="totalStudents" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><Users /> Total de Alunos no Turno</FormLabel>
                          <FormControl><Input type="number" placeholder="Ex: 150" {...field} value={field.value || ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="presentStudents" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><UserCheck /> Alunos Presentes Hoje</FormLabel>
                          <FormControl><Input type="number" placeholder="Ex: 135" {...field} value={field.value || ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>


                <FormField
                  control={form.control}
                  name="menuType"
                  render={() => (
                    <FormItem className="space-y-3">
                      <FormLabel className="flex items-center gap-2"><Utensils /> Qual cardápio será utilizado hoje?</FormLabel>
                      <div className="flex flex-col sm:flex-row gap-4">
                          <Button type="button" variant={menuTypeValue === 'planned' ? 'default' : 'outline'} onClick={() => handleMenuTypeChange('planned')} className="flex-1 justify-start">Cardápio Previsto</Button>
                          <Button type="button" variant={menuTypeValue === 'alternative' ? 'default' : 'outline'} onClick={() => handleMenuTypeChange('alternative')} className="flex-1 justify-start">Cardápio Alternativo</Button>
                          <Button type="button" variant={menuTypeValue === 'improvised' ? 'default' : 'outline'} onClick={() => handleMenuTypeChange('improvised')} className="flex-1 justify-start">Cardápio Improvisado</Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {menuTypeValue === "alternative" && (
                  <FormField
                    control={form.control}
                    name="alternativeMenuDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><MessageSquare /> Detalhe o Cardápio Alternativo</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Ex: Arroz com cenoura, feijão, salada de alface e suco de goiaba." rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                 <FormField
                  control={form.control}
                  name="helpNeeded"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-amber-50 border-amber-200">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center gap-2 text-amber-800"><HelpCircle /> Precisa de ajuda com itens em falta?</FormLabel>
                      </div>
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />

                {helpNeededValue && (
                  <div className="pl-4 border-l-2 border-amber-200 ml-4 space-y-6">
                    <FormField
                      control={form.control}
                      name="missingItems"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><MessageSquare /> Quais itens estão faltando?</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Ex: Arroz (5kg), Feijão (3kg), Óleo (2L)..." rows={3} {...field} />
                          </FormControl>
                           <FormDescription>Seja específico nos itens e quantitativos.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                        control={form.control}
                        name="canBuyMissingItems"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="flex items-center gap-2"><ShoppingBasket/> A escola pode comprar esses itens?</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={(value) => field.onChange(value === 'true')}
                                defaultValue={field.value === undefined ? "" : String(field.value)}
                                className="flex items-center gap-x-4"
                              >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="true" />
                                  </FormControl>
                                  <FormLabel className="font-normal">Sim</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="false" />
                                  </FormControl>
                                  <FormLabel className="font-normal">Não</FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>
                )}
                
                {canBuyMissingItemsValue === true && (
                  <FormField
                    control={form.control}
                    name="itemsPurchased"
                    render={({ field }) => (
                      <FormItem className="pl-4 border-l-2 border-primary/50 ml-4">
                        <FormLabel className="flex items-center gap-2"><ShoppingBasket /> Detalhe os itens que foram/serão comprados</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Descreva os itens comprados e os quantitativos. Ex: 2kg de tomate, 1kg de cebola." rows={3} {...field}/>
                        </FormControl>
                        <FormDescription>Use este campo para gerar uma "nota de compra" para controle.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                 <FormField
                  control={form.control}
                  name="suppliesReceived"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center gap-2"><PackageCheck /> Houve recebimento de suprimentos?</FormLabel>
                      </div>
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />

                {suppliesReceivedValue && (
                  <FormField
                    control={form.control}
                    name="suppliesDescription"
                    render={({ field }) => (
                      <FormItem className="pl-4 border-l-2 border-primary/50 ml-4">
                        <FormLabel className="flex items-center gap-2"><MessageSquare /> Detalhe os suprimentos recebidos</FormLabel>
                        <FormControl><Textarea placeholder="Ex: 5kg de arroz, 2L de óleo..." rows={3} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><MessageSquare /> Observações Gerais</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Adicione qualquer observação relevante aqui..." rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button type="submit" size="lg" disabled={isLoading}>
                    {isLoading ? (<LoaderCircle className="animate-spin" />) : ("Enviar Registro")}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
    
     <AlertDialog open={isSuccessAlertOpen} onOpenChange={setIsSuccessAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Formulário Enviado com Sucesso!</AlertDialogTitle>
            <AlertDialogDescription>
              O registro foi salvo. Você pode gerar uma nota de detalhamento para seu controle ou fechar esta janela.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsSuccessAlertOpen(false)}>Fechar</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerateReceipt} className="flex items-center gap-2">
              <FileText /> Gerar Nota
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
