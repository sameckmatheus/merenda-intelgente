
"use client";

import { useState, useEffect } from "react";
import { BarChart, LogOut, Utensils, Calendar as CalendarIcon, Building, LoaderCircle, FileX2, Trash2, Users, HelpCircle, ShoppingBasket, MessageSquare, PackageCheck, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Logo } from "@/components/logo";
import { useRouter } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, Timestamp, doc, deleteDoc, updateDoc } from "firebase/firestore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";


export interface Submission {
    id: string;
    school: string;
    menuType: 'planned' | 'alternative' | 'improvised';
    respondentName: string;
    date: Timestamp | number;
    totalStudents: number;
    presentStudents: number;
    alternativeMenuDescription?: string;
    helpNeeded?: boolean;
    canBuyMissingItems?: boolean;
    missingItems?: string;
    suppliesReceived?: boolean;
    suppliesDescription?: string;
    itemsPurchased?: string;
    observations?: string;
    shift: string;
    status?: 'pendente' | 'atendido' | 'atendido_parcialmente' | 'recusado';
    createdAt: Timestamp | number;
}

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
];


export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedSchool, setSelectedSchool] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month'>('day');
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
        setIsLoading(true);
        try {
            let startDate: Date | null = null;
            let endDate: Date | null = null;
            if (date) {
                if (filterType === 'day') {
                    startDate = new Date(date);
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date(date);
                    endDate.setHours(23, 59, 59, 999);
                } else if (filterType === 'week') {
                    startDate = startOfWeek(date, { locale: ptBR });
                    endDate = endOfWeek(date, { locale: ptBR });
                } else { // month
                    startDate = startOfMonth(date);
                    endDate = endOfMonth(date);
                }
            }

            const params = new URLSearchParams();
            if (startDate && endDate) {
                params.set('start', String(startDate.getTime()));
                params.set('end', String(endDate.getTime()));
            }
            if (selectedSchool) params.set('school', selectedSchool);
            if (selectedStatus && selectedStatus !== 'all') params.set('status', selectedStatus);

            const res = await fetch(`/api/submissions?${params.toString()}`, { cache: 'no-store' });
            if (!res.ok) throw new Error('Falha ao buscar');
            const json = await res.json();
            setSubmissions(json.submissions as Submission[]);
        } catch (error) {
            console.error("Error fetching submissions: ", error);
             toast({
              variant: "destructive",
              title: "Erro ao buscar dados",
              description: "Não foi possível carregar os registros. Verifique as regras de segurança do Firestore.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    fetchSubmissions();
  }, [date, selectedSchool, selectedStatus, toast, filterType]);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const handleDelete = async (submissionId: string) => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "submissions", submissionId));
      setSubmissions(submissions.filter(sub => sub.id !== submissionId));
      toast({
        title: "Registro Excluído",
        description: "O registro foi excluído com sucesso.",
      });
    } catch (error) {
      console.error("Error deleting submission: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao Excluir",
        description: "Não foi possível excluir o registro. Tente novamente.",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const getPeriodLabel = () => {
    if (!date) return "Selecione uma data";
    switch (filterType) {
        case 'day':
            return format(date, "PPP", { locale: ptBR });
        case 'week':
            const start = startOfWeek(date, { locale: ptBR });
            const end = endOfWeek(date, { locale: ptBR });
            return `Semana de ${format(start, 'd/MM')} a ${format(end, 'd/MM')}`;
        case 'month':
            return format(date, "MMMM 'de' yyyy", { locale: ptBR });
    }
  };

  const menuTypeTranslations: {[key: string]: string} = {
    planned: "Previsto",
    alternative: "Alternativo",
    improvised: "Improvisado"
  };

  const getMenuTypeStyle = (menuType: string) => {
    switch (menuType) {
      case 'planned': return 'bg-green-100 text-green-800 border-green-200';
      case 'alternative': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'improvised': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  const statusTranslations: { [key in NonNullable<Submission['status']>]: string } = {
    pendente: 'Pendente',
    atendido: 'Atendido',
    atendido_parcialmente: 'Atendido parcialmente',
    recusado: 'Recusado',
  };

  const handleChangeStatus = async (submissionId: string, newStatus: NonNullable<Submission['status']>) => {
    try {
      setUpdatingStatusId(submissionId);
      const res = await fetch(`/api/submissions/${submissionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Falha ao salvar');
      setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, status: newStatus } : s));
      toast({ title: 'Status atualizado', description: 'O status foi salvo com sucesso.' });
    } catch (error) {
      console.error('Erro ao atualizar status', error);
      toast({ variant: 'destructive', title: 'Erro ao atualizar status', description: 'Tente novamente.' });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const DetailItem = ({ icon, label, value, fullWidth = false }: { icon: React.ReactNode, label: string, value?: string | number | boolean | null, fullWidth?: boolean }) => {
    if (value === null || value === undefined || value === '' || value === false) return null;
    return (
      <div className={`flex flex-col gap-1 ${fullWidth ? 'col-span-2' : ''}`}>
        <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">{icon} {label}</h4>
        <p className="text-sm text-foreground bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-wrap">{typeof value === 'boolean' ? 'Sim' : value}</p>
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen w-full bg-slate-50">
        <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <Logo />
              <h1 className="font-headline text-xl font-bold tracking-tight text-foreground">MenuPlanner - Admin</h1>
            </div>
            <div className="flex items-center gap-2"><Button variant="destructive" size="sm" onClick={handleLogout}><LogOut /> Sair</Button></div>
          </div>
        </header>
        <main className="container mx-auto p-4 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                  <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">Dashboard de Acompanhamento</h2>
                  <p className="text-muted-foreground">Visualize os registros de merenda e gere relatórios.</p>
              </div>
              <div className="flex items-center gap-2">
                 <Button
                   variant="outline"
                   onClick={async () => {
                     let startDate: Date | null = null;
                     let endDate: Date | null = null;
                     if (date) {
                       if (filterType === 'day') {
                         startDate = new Date(date);
                         startDate.setHours(0, 0, 0, 0);
                         endDate = new Date(date);
                         endDate.setHours(23, 59, 59, 999);
                       } else if (filterType === 'week') {
                         startDate = startOfWeek(date, { locale: ptBR });
                         endDate = endOfWeek(date, { locale: ptBR });
                       } else {
                         startDate = startOfMonth(date);
                         endDate = endOfMonth(date);
                       }
                     }
                     const params = new URLSearchParams();
                     if (startDate && endDate) {
                       params.set('start', String(startDate.getTime()));
                       params.set('end', String(endDate.getTime()));
                     }
                     if (selectedSchool) params.set('school', selectedSchool);
                     const url = `/api/reports/general?${params.toString()}`;
                     // abrir em nova aba para download
                     window.open(url, '_blank');
                   }}
                 >
                   <FileDown />Relatório Geral
                 </Button>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{submissions.length}</div>
                <p className="text-xs text-muted-foreground">no período selecionado</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pedidos de Ajuda</CardTitle>
                <HelpCircle className="h-4 w-4 text-muted-foreground text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{submissions.filter(s => s.helpNeeded).length}</div>
                 <p className="text-xs text-muted-foreground">solicitações de itens em falta</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compras Realizadas</CardTitle>
                <ShoppingBasket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{submissions.filter(s => s.itemsPurchased).length}</div>
                <p className="text-xs text-muted-foreground">compras emergenciais registradas</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 flex flex-col sm:flex-row gap-2">
                <div className="flex items-center gap-2 rounded-md border bg-card p-1">
                    <Button variant={filterType === 'day' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilterType('day')}>Dia</Button>
                    <Button variant={filterType === 'week' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilterType('week')}>Semana</Button>
                    <Button variant={filterType === 'month' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilterType('month')}>Mês</Button>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full sm:w-[280px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            <span>{getPeriodLabel()}</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
                </Popover>
              </div>
               <div className="flex flex-col sm:flex-row gap-2">
                 <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                    <SelectTrigger className="w-full md:w-[280px]">
                      <div className="flex items-center gap-2"><Building className="h-4 w-4" /><SelectValue placeholder="Filtrar por escola" /></div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Escolas</SelectItem>
                      {schools.map((school) => (<SelectItem key={school} value={school}>{school}</SelectItem>))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <SelectValue placeholder="Filtrar por status" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      {Object.entries(statusTranslations).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64"><LoaderCircle className="animate-spin text-primary" size={48} /></div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-card text-muted-foreground/60">
              <FileX2 className="w-16 h-16 mb-4" />
              <h3 className="text-xl font-semibold">Nenhum dado registrado</h3>
              <p>Nenhum registro encontrado para os filtros selecionados.</p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Escola</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Turno</TableHead>
                          <TableHead>Responsável</TableHead>
                          <TableHead>Cardápio</TableHead>
                          <TableHead>Alunos</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.map((sub) => (
                          <TableRow 
                            key={sub.id} 
                            onClick={() => setSelectedSubmission(sub)} 
                            className={cn(
                              "cursor-pointer",
                              sub.helpNeeded && "bg-red-50 hover:bg-red-100"
                            )}
                          >
                            <TableCell className="font-medium">{sub.school}</TableCell>
                            <TableCell>{format((sub.date instanceof Timestamp ? sub.date.toDate() : new Date(sub.date)), "dd/MM/yy")}</TableCell>
                            <TableCell>{sub.shift}</TableCell>
                            <TableCell>{sub.respondentName}</TableCell>
                            <TableCell><div className={`px-2 py-1 text-xs rounded-full text-center border ${getMenuTypeStyle(sub.menuType)}`}>{menuTypeTranslations[sub.menuType]}</div></TableCell>
                            <TableCell>{sub.presentStudents}/{sub.totalStudents}</TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={(sub.status ?? 'pendente')}
                                onValueChange={(value) => handleChangeStatus(sub.id, value as NonNullable<Submission['status']>)}
                                disabled={updatingStatusId === sub.id}
                              >
                                <SelectTrigger className="w-[220px]">
                                  <SelectValue placeholder="Selecione o status">
                                    {statusTranslations[(sub.status ?? 'pendente') as NonNullable<Submission['status']>]}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pendente">Pendente</SelectItem>
                                  <SelectItem value="atendido">Atendido</SelectItem>
                                  <SelectItem value="atendido_parcialmente">Atendido parcialmente</SelectItem>
                                  <SelectItem value="recusado">Recusado</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right">
                                <AlertDialog onOpenChange={(open) => !open && setIsDeleting(false)}>
                                  <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" disabled={isDeleting}>
                                      <Trash2 className="text-destructive/70" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                      <AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente o registro.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(sub.id)} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                                        {isDeleting ? <LoaderCircle className="animate-spin" /> : "Excluir"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl">
          {selectedSubmission && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl"><Building /> {selectedSubmission.school}</DialogTitle>
                <DialogDescription>
                  Registro de {selectedSubmission.respondentName} para o turno da {selectedSubmission.shift} em {format((selectedSubmission.date instanceof Timestamp ? selectedSubmission.date.toDate() : new Date(selectedSubmission.date)), "PPP", { locale: ptBR })}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                <Card className="bg-slate-50/50">
                    <CardContent className="p-4 grid grid-cols-2 gap-4">
                         <DetailItem icon={<Users />} label="Alunos" value={`${selectedSubmission.presentStudents} presentes de ${selectedSubmission.totalStudents}`} />
                         <DetailItem icon={<Utensils />} label="Cardápio Servido" value={menuTypeTranslations[selectedSubmission.menuType]} />
                    </CardContent>
                </Card>
               
                <DetailItem icon={<MessageSquare />} label="Detalhe Cardápio Alternativo" value={selectedSubmission.alternativeMenuDescription} fullWidth/>
                
                <Separator />
                
                <div className="p-4 border rounded-lg bg-amber-50 border-amber-200 space-y-4">
                    <h3 className="font-bold text-amber-900 flex items-center gap-2"><HelpCircle /> Seção de Ajuda</h3>
                    <DetailItem icon={<HelpCircle className="text-amber-700"/>} label="Pedido de Ajuda" value={selectedSubmission.helpNeeded} />
                    <DetailItem icon={<MessageSquare />} label="Itens em Falta" value={selectedSubmission.missingItems} fullWidth />
                    <DetailItem icon={<ShoppingBasket />} label="Pode Comprar os Itens?" value={selectedSubmission.canBuyMissingItems} />
                    <DetailItem icon={<ShoppingBasket />} label="Itens Comprados" value={selectedSubmission.itemsPurchased} fullWidth />
                </div>
                
                <Separator />
                
                 <div className="p-4 border rounded-lg bg-slate-50 space-y-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2"><PackageCheck /> Seção de Suprimentos</h3>
                    <DetailItem icon={<PackageCheck />} label="Recebeu Suprimentos?" value={selectedSubmission.suppliesReceived} />
                    <DetailItem icon={<MessageSquare />} label="Suprimentos Recebidos" value={selectedSubmission.suppliesDescription} fullWidth />
                </div>

                <Separator />

                <DetailItem icon={<MessageSquare />} label="Observações Gerais" value={selectedSubmission.observations} fullWidth />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
