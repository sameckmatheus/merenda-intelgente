"use client";

import { useEffect, useState } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Timestamp, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { LogOut, LoaderCircle, FileX2, Trash2, Users, HelpCircle, ShoppingBasket, FileDown, Building, MessageSquare, PackageCheck, Utensils, CalendarIcon, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";

import { AdminLayout } from "@/components/admin/admin-layout";
import { Filters } from "@/components/admin/filters";
import { SubmissionDetails } from "@/components/admin/submission-details";
import { Combobox } from "@/components/ui/combobox";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Filter, Submission, menuTypeTranslations, statusTranslations } from "@/lib/types";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

const MENU_TYPE_STYLES = {
  planned: "bg-emerald-50 text-emerald-700 border-emerald-200",
  alternative: "bg-amber-50 text-amber-700 border-amber-200",
  improvised: "bg-purple-50 text-purple-700 border-purple-200",
} as const;

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
  const [helpNeededFilter, setHelpNeededFilter] = useState<'all' | 'yes' | 'no'>('all');
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
      const res = await fetch(`/api/submissions/${submissionId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Falha ao excluir');
      }
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

  const getMenuTypeStyle = (type: Submission['menuType']) => {
    return MENU_TYPE_STYLES[type] || "bg-gray-50 text-gray-700 border-gray-200";
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

  const DetailItem = ({
    icon,
    label,
    value,
    fullWidth = false
  }: {
    icon: React.ReactNode,
    label: string,
    value?: string | number | boolean | null,
    fullWidth?: boolean
  }) => {
    if (value === null || value === undefined || value === '' || value === false) return null;
    return (
      <div className={`flex flex-col gap-1 ${fullWidth ? 'col-span-2' : ''}`}>
        <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">{icon} {label}</h4>
        <p className="text-sm text-foreground bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-wrap">{typeof value === 'boolean' ? 'Sim' : value}</p>
      </div>
    );
  };

  // Filtrar submissões com base no helpNeededFilter
  const filteredSubmissions = submissions.filter(sub => {
    if (helpNeededFilter === 'all') return true;
    return helpNeededFilter === 'yes' ? sub.helpNeeded : !sub.helpNeeded;
  });

  const formatDate = (date: Timestamp | number) => {
    if (date instanceof Timestamp) {
      return format(date.toDate(), "dd/MM/yy");
    }
    return format(new Date(date), "dd/MM/yy");
  };

  const handleExport = () => {
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
    if (selectedStatus && selectedStatus !== 'all') params.set('status', selectedStatus);
    if (helpNeededFilter && helpNeededFilter !== 'all') params.set('helpNeeded', helpNeededFilter);

    window.open(`/api/reports/csv?${params.toString()}`, '_blank');
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleLogout}
        variant="default"
        size="sm"
        className="bg-gradient-to-r from-red-600 to-red-600 hover:from-red-700 hover:to-magenta-700 text-white shadow-lg shadow-red-600/20 rounded-xl transition-all hover:scale-105 active:scale-95"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sair
      </Button>
    </div>
  );

  return (
    <>
      <AdminLayout
        title="Dashboard de Acompanhamento"
        description="Visualize os registros de merenda e gere relatórios"
        actions={headerActions}
      >
        <div className="space-y-8">
          <Filters
            date={date}
            setDate={setDate}
            filterType={filterType}
            setFilterType={setFilterType}
            selectedSchool={selectedSchool}
            setSelectedSchool={setSelectedSchool}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            helpNeededFilter={helpNeededFilter}
            setHelpNeededFilter={setHelpNeededFilter}
            schools={schools}
            statusTranslations={statusTranslations}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl shadow-xl shadow-blue-900/5 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total de Registros</CardTitle>
                <div className="p-3 rounded-xl bg-blue-600">
                  <Users className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{filteredSubmissions.length}</div>
                <p className="text-xs text-slate-500 font-medium mt-1">no período selecionado</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-xl shadow-blue-900/5 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Pedidos de Ajuda</CardTitle>
                <div className="p-3 rounded-xl bg-amber-500">
                  <HelpCircle className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{filteredSubmissions.filter(s => s.helpNeeded).length}</div>
                <p className="text-xs text-slate-500 font-medium mt-1">solicitações de itens em falta</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-xl shadow-blue-900/5 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Compras Realizadas</CardTitle>
                <div className="p-3 rounded-xl bg-emerald-600">
                  <ShoppingBasket className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{filteredSubmissions.filter(s => s.itemsPurchased).length}</div>
                <p className="text-xs text-slate-500 font-medium mt-1">compras emergenciais registradas</p>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoaderCircle className="animate-spin text-primary" size={48} />
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-card text-muted-foreground/60">
              <FileX2 className="w-16 h-16 mb-4" />
              <h3 className="text-xl font-semibold">Nenhum dado registrado</h3>
              <p>Nenhum registro encontrado para os filtros selecionados.</p>
            </div>
          ) : (
            <Card className="rounded-2xl shadow-xl shadow-blue-900/5 border-0 overflow-hidden bg-white/90 backdrop-blur-md">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold text-slate-600">Escola</TableHead>
                        <TableHead className="font-semibold text-slate-600">Data</TableHead>
                        <TableHead className="font-semibold text-slate-600">Turno</TableHead>
                        <TableHead className="font-semibold text-slate-600">Responsável</TableHead>
                        <TableHead className="font-semibold text-slate-600">Cardápio</TableHead>
                        <TableHead className="font-semibold text-slate-600">Alunos</TableHead>
                        <TableHead className="font-semibold text-slate-600">Status</TableHead>
                        <TableHead className="text-right font-semibold text-slate-600">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubmissions.map((sub) => (
                        <TableRow
                          key={sub.id}
                          onClick={() => setSelectedSubmission(sub)}
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-blue-50/50",
                            sub.helpNeeded && "bg-red-50 hover:bg-red-100/80"
                          )}
                        >
                          <TableCell className="font-medium">{sub.school}</TableCell>
                          <TableCell>{format(sub.date instanceof Timestamp ? sub.date.toDate() : new Date(sub.date), "dd/MM/yy")}</TableCell>
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
                                {Object.entries(statusTranslations).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
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
        </div>
      </AdminLayout>

      {selectedSubmission && (
        <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50/95 backdrop-blur-xl border-white/20 gap-0">
            <div className="p-6 bg-white border-b border-slate-100 shadow-sm relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
              <DialogHeader className="relative z-10 text-left">
                <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  {selectedSubmission.school}
                </DialogTitle>
                <DialogDescription className="text-slate-500 text-left">
                  Registro de {selectedSubmission.respondentName} para o turno da {selectedSubmission.shift} em{' '}
                  {format(
                    selectedSubmission.date instanceof Timestamp ? selectedSubmission.date.toDate() : new Date(typeof selectedSubmission.date === 'number' ? selectedSubmission.date : selectedSubmission.date),
                    "PPP",
                    { locale: ptBR }
                  )}.
                </DialogDescription>
              </DialogHeader>
            </div>

            <ScrollArea className="flex-1 w-full p-6">
              <div className="space-y-4">
                <Card className="bg-slate-50/50">
                  <CardContent className="p-4 grid grid-cols-2 gap-4">
                    <DetailItem
                      icon={<Users />}
                      label="Alunos"
                      value={`${selectedSubmission.presentStudents} presentes de ${selectedSubmission.totalStudents}`}
                    />
                    <DetailItem
                      icon={<Utensils />}
                      label="Cardápio Servido"
                      value={menuTypeTranslations[selectedSubmission.menuType]}
                    />
                  </CardContent>
                </Card>

                <DetailItem
                  icon={<MessageSquare />}
                  label="Detalhe Cardápio Alternativo"
                  value={selectedSubmission.alternativeMenuDescription}
                  fullWidth
                />

                <Separator />

                <div className="p-4 border rounded-lg bg-amber-50 border-amber-200 space-y-4">
                  <h3 className="font-bold text-amber-900 flex items-center gap-2">
                    <HelpCircle /> Seção de Ajuda
                  </h3>
                  <DetailItem
                    icon={<HelpCircle className="text-amber-700" />}
                    label="Pedido de Ajuda"
                    value={selectedSubmission.helpNeeded}
                  />
                  <DetailItem
                    icon={<MessageSquare />}
                    label="Itens em Falta"
                    value={selectedSubmission.missingItems}
                    fullWidth
                  />
                  <DetailItem
                    icon={<ShoppingBasket />}
                    label="Pode Comprar os Itens?"
                    value={selectedSubmission.canBuyMissingItems}
                  />
                  <DetailItem
                    icon={<ShoppingBasket />}
                    label="Itens Comprados"
                    value={selectedSubmission.itemsPurchased}
                    fullWidth
                  />
                </div>

                <Separator />

                <div className="p-4 border rounded-lg bg-slate-50 space-y-4">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <PackageCheck /> Seção de Suprimentos
                  </h3>
                  <DetailItem
                    icon={<PackageCheck />}
                    label="Recebeu Suprimentos?"
                    value={selectedSubmission.suppliesReceived}
                  />
                  <DetailItem
                    icon={<MessageSquare />}
                    label="Suprimentos Recebidos"
                    value={selectedSubmission.suppliesDescription}
                    fullWidth
                  />
                </div>

                <Separator />

                <DetailItem
                  icon={<MessageSquare />}
                  label="Observações Gerais"
                  value={selectedSubmission.observations}
                  fullWidth
                />
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
