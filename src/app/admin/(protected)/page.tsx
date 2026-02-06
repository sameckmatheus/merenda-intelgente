"use client";

import { useEffect, useState } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

import { LogOut, LoaderCircle, FileX2, Trash2, Users, HelpCircle, ShoppingBasket, FileDown, Building, MessageSquare, PackageCheck, Utensils, CalendarIcon, GraduationCap, TrendingUp, TrendingDown, FileText, Mail, MessageCircle } from "lucide-react";

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

import { cn, getFullSchoolName } from "@/lib/utils";

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
  const [schoolDetails, setSchoolDetails] = useState<{ contacts?: { email: string, whatsapp: string } } | null>(null);
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('day');
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedSubmission?.school) {
      fetch(`/api/schools/settings?school=${encodeURIComponent(selectedSubmission.school)}`)
        .then(res => res.json())
        .then(data => setSchoolDetails(data.settings || null))
        .catch(err => console.error("Failed to fetch school settings", err));
    } else {
      setSchoolDetails(null);
    }
  }, [selectedSubmission]);


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
      const res = await fetch(`/api/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Falha ao salvar');
      setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, status: newStatus } : s));

      // Also update selectedSubmission if it's currently open
      if (selectedSubmission && selectedSubmission.id === submissionId) {
        setSelectedSubmission(prev => prev ? { ...prev, status: newStatus } : null);
      }

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

  const formatDate = (date: string | number) => {
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



  /* Removed internal KpiCard component to match Reports style directly in KpiCards */

  const KpiCards = ({ submissions }: { submissions: Submission[] }) => {
    const totalRecords = submissions.length;
    const totalHelp = submissions.filter(s => s.helpNeeded).length;
    const totalPurchased = submissions.filter(s => s.itemsPurchased).length;

    return (
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}</div>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos de Ajuda</CardTitle>
            <HelpCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHelp}</div>
            <p className="text-xs text-muted-foreground">Solicitações de itens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compras Realizadas</CardTitle>
            <ShoppingBasket className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPurchased}</div>
            <p className="text-xs text-muted-foreground">Compras emergenciais</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <>
      <AdminLayout
        title="Dashboard de Acompanhamento"
        description="Visualize os registros de merenda e gere relatórios"
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

          <KpiCards submissions={filteredSubmissions} />

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
                          <TableCell className="font-medium">{getFullSchoolName(sub.school)}</TableCell>
                          <TableCell>{new Date(sub.date).toLocaleDateString("pt-BR")}</TableCell>
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
          <DialogContent className="w-[95vw] max-w-4xl max-h-[85dvh] flex flex-col p-0 overflow-hidden bg-slate-50/95 backdrop-blur-xl gap-0 rounded-2xl outline-none border-none shadow-none ring-0">
            <div className="p-4 md:p-6 bg-white border-b border-slate-100 shadow-sm relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
              <DialogHeader className="relative z-10 text-left pr-6">
                <DialogTitle className="text-lg md:text-2xl font-bold flex items-center gap-2 text-slate-800 break-words leading-tight">
                  <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg text-blue-600 shrink-0">
                    <GraduationCap className="w-4 h-4 md:w-6 md:h-6" />
                  </div>
                  {getFullSchoolName(selectedSubmission.school)}
                </DialogTitle>
                <DialogDescription className="text-xs md:text-sm text-slate-500 text-left mt-1">
                  Registro de {selectedSubmission.respondentName} para o turno da {selectedSubmission.shift} em{' '}
                  {format(
                    new Date(selectedSubmission.date),
                    "PPP",
                    { locale: ptBR }
                  )}.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex-1 w-full bg-slate-50/50 overflow-y-auto">
              <div className="flex flex-col p-4 md:p-6 gap-6 w-full max-w-full">
                {/* Contact Actions */}
                {schoolDetails && schoolDetails.contacts && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 gap-2 h-10 md:h-12"
                      onClick={() => {
                        const msg = `Olá, referente ao registro de merenda do dia ${formatDate(selectedSubmission.date)} (${selectedSubmission.shift}) da escola ${selectedSubmission.school}. Status atual: ${statusTranslations[selectedSubmission.status || 'pendente']}.`;
                        const phone = schoolDetails.contacts?.whatsapp?.replace(/\D/g, '') || '';
                        if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      disabled={!schoolDetails.contacts.whatsapp}
                    >
                      <MessageCircle className="w-4 h-4 md:w-5 md:h-5" /> WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 gap-2 h-10 md:h-12"
                      onClick={() => {
                        const subject = `Registro Merenda - ${selectedSubmission.school} - ${formatDate(selectedSubmission.date)}`;
                        const body = `Olá,\n\nReferente ao registro do dia ${formatDate(selectedSubmission.date)} (${selectedSubmission.shift}).\nStatus atual: ${statusTranslations[selectedSubmission.status || 'pendente']}.\n\nAtenciosamente,\nEquipe Merenda Inteligente`;
                        window.open(`mailto:${schoolDetails.contacts?.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                      }}
                      disabled={!schoolDetails.contacts.email}
                    >
                      <Mail className="w-4 h-4 md:w-5 md:h-5" /> Email
                    </Button>
                  </div>
                )}

                <Card className="bg-white border-slate-100 shadow-sm">
                  <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <DetailItem
                      icon={<Users className="w-4 h-4 text-blue-500" />}
                      label="Alunos"
                      value={`${selectedSubmission.presentStudents || 0} presentes de ${selectedSubmission.totalStudents || 0}`}
                    />
                    <DetailItem
                      icon={<Utensils className="w-4 h-4 text-orange-500" />}
                      label="Cardápio Servido"
                      value={menuTypeTranslations[selectedSubmission.menuType]}
                    />
                  </CardContent>
                </Card>

                <DetailItem
                  icon={<MessageSquare className="w-4 h-4 text-violet-500" />}
                  label="Detalhe Cardápio Alternativo"
                  value={selectedSubmission.alternativeMenuDescription}
                  fullWidth
                />

                <Separator className="bg-slate-200" />

                <div className="p-4 md:p-6 border-2 border-red-500 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl space-y-4 shadow-sm">
                  <h3 className="font-bold text-red-900 flex items-center gap-2 text-sm md:text-base">
                    <div className="p-1.5 bg-red-500 rounded-lg">
                      <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    Ajuda Necessária
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem
                      icon={<HelpCircle className="w-4 h-4 text-red-600" />}
                      label="Pedido de Ajuda"
                      value={selectedSubmission.helpNeeded}
                    />
                    <DetailItem
                      icon={<ShoppingBasket className="w-4 h-4 text-orange-600" />}
                      label="Pode Comprar?"
                      value={selectedSubmission.canBuyMissingItems}
                    />
                  </div>
                  <DetailItem
                    icon={<MessageSquare className="w-4 h-4 text-red-600" />}
                    label="Itens em Falta"
                    value={selectedSubmission.missingItems}
                    fullWidth
                  />
                  <DetailItem
                    icon={<ShoppingBasket className="w-4 h-4 text-orange-600" />}
                    label="Itens Comprados"
                    value={selectedSubmission.itemsPurchased}
                    fullWidth
                  />
                </div>

                <Separator className="bg-slate-200" />

                <div className="p-4 md:p-6 border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl space-y-4 shadow-sm">
                  <h3 className="font-bold text-blue-900 flex items-center gap-2 text-sm md:text-base">
                    <div className="p-1.5 bg-blue-500 rounded-lg">
                      <PackageCheck className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    Suprimentos Recebidos
                  </h3>
                  <DetailItem
                    icon={<PackageCheck className="w-4 h-4 text-blue-600" />}
                    label="Recebeu Suprimentos?"
                    value={selectedSubmission.suppliesReceived}
                  />
                  <DetailItem
                    icon={<MessageSquare className="w-4 h-4 text-emerald-600" />}
                    label="Suprimentos Recebidos"
                    value={selectedSubmission.suppliesDescription}
                    fullWidth
                  />
                </div>

                <DetailItem
                  icon={<MessageSquare className="w-4 h-4 text-slate-500" />}
                  label="Observações Gerais"
                  value={selectedSubmission.observations}
                  fullWidth
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
