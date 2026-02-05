"use client"

import { useMemo, useState, useEffect, useRef, FC, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
// import { Filters } from "@/components/admin/filters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, ShoppingCart, HelpCircle, TrendingUp, TrendingDown, Activity, Calendar as CalendarIcon, AlertTriangle, BarChart, ShoppingBasket, Printer, RefreshCw, FileDown } from 'lucide-react';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
// import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
// import jsPDF from "jspdf";
// import "jspdf-autotable"; // Dynamic import in downloadPDF to fix SSR build error


const schools = [
  "ANEXO MARCOS FREIRE", "BARBAPAPA", "CARLOS AYRES", "DILMA", "FRANCELINA", "GERCINA ALVES",
  "JOÃO BENTO", "MARCOS FREIRE", "MARIA JOSÉ", "MARIA OLIVEIRA", "MUNDO DA CRIANÇA",
  "MÃE BELA", "OTACÍLIA", "SABINO", "ZÉLIA", "ZULEIDE",
];

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#6366f1', '#f43f5e', '#84cc16', '#14b8a6'];

const STATUS_COLORS = {
  pendente: '#fbbf24', atendido: '#10b981', atendido_parcialmente: '#3b82f6', recusado: '#ef4444',
} as const;

type Status = keyof typeof STATUS_COLORS;

// KpiCards with Clean Style (Shadcn based, no gradients)
const KpiCards: FC<{ submissions: any[] }> = ({ submissions }) => {
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

const StatusDistributionChart: FC<{ data: { name: string, value: number }[], isLoading: boolean }> = ({ data, isLoading }) => {
  return (
    <Card className="border-0 shadow-lg shadow-blue-900/5 bg-white/80 backdrop-blur-sm min-w-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-800">Status das Submissões</CardTitle>
        <CardDescription>Distribuição por status atual</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-slate-400">Carregando...</div>
        ) : data.length > 0 ? (
          <div className="h-64">
            <ChartContainer
              config={{
                pendente: { label: 'Pendente', color: STATUS_COLORS.pendente },
                atendido: { label: 'Atendido', color: STATUS_COLORS.atendido },
                atendido_parcialmente: { label: 'Parcial', color: STATUS_COLORS.atendido_parcialmente },
                recusado: { label: 'Recusado', color: STATUS_COLORS.recusado },
              }}
              className="h-full w-full"
            >
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as Status] || '#cbd5e1'} strokeWidth={0} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                <ChartLegend
                  content={({ payload }: { payload?: any[] }) => (
                    <div className="flex justify-center gap-4 mt-4 flex-wrap">
                      {payload?.map((entry: any, index: number) => (
                        <div key={`legend-${index}`} className="flex items-center gap-2 text-sm text-slate-600">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="capitalize">{entry.payload?.label || entry.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                />
              </PieChart>
            </ChartContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">Sem dados</div>
        )}
      </CardContent>
    </Card>
  );
};


const RecentActivity: FC<{ submissions: any[] }> = ({ submissions }) => {
  return (
    <Card className="border-0 shadow-lg shadow-blue-900/5 bg-white/80 backdrop-blur-sm h-full min-w-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" /> Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {submissions.slice(0, 4).map((r: any, i) => (
            <div key={r.id} className="flex items-start gap-4">
              <div className={cn(
                "w-2 h-2 mt-2 rounded-full ring-4 ring-opacity-20 flex-shrink-0",
                r.status === 'atendido' ? "bg-emerald-500 ring-emerald-500" :
                  r.status === 'atendido_parcialmente' ? "bg-blue-500 ring-blue-500" :
                    r.status === 'recusado' ? "bg-red-500 ring-red-500" : "bg-amber-400 ring-amber-400"
              )} />
              <div className="flex-1 space-y-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 leading-none truncate">{r.school}</p>
                <p className="text-xs text-slate-500 truncate">
                  {r.respondentName} • {new Date(typeof r.date === 'number' ? r.date : r.date?.toMillis?.() || r.date || 0).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
          {submissions.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>}
        </div>
      </CardContent>
    </Card>
  );
};

const SubmissionsTable: FC<{ submissions: any[] }> = ({ submissions }) => (
  <Card className="border-0 shadow-lg shadow-blue-900/5 bg-white/80 backdrop-blur-sm overflow-hidden">
    <CardHeader>
      <CardTitle className="text-lg font-semibold text-slate-800">Histórico Detalhado</CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="font-semibold text-slate-600">Escola</TableHead>
            <TableHead className="font-semibold text-slate-600">Data</TableHead>
            <TableHead className="font-semibold text-slate-600">Turno</TableHead>
            <TableHead className="font-semibold text-slate-600">Responsável</TableHead>
            <TableHead className="font-semibold text-slate-600">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhum registro encontrado</TableCell>
            </TableRow>
          ) : (
            submissions.slice(0, 10).map((s: any) => (
              <TableRow key={s.id} className="hover:bg-blue-50/30 border-slate-100 transition-colors">
                <TableCell className="font-medium text-slate-700">{s.school}</TableCell>
                <TableCell className="text-slate-500">{new Date(typeof s.date === 'number' ? s.date : s.date?.toMillis?.() || s.date || 0).toLocaleDateString()}</TableCell>
                <TableCell className="text-slate-500">{s.shift}</TableCell>
                <TableCell className="text-slate-500">{s.respondentName}</TableCell>
                <TableCell>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    s.status === 'atendido' ? "bg-emerald-100 text-emerald-700" :
                      s.status === 'atendido_parcialmente' ? "bg-blue-100 text-blue-700" :
                        s.status === 'recusado' ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                  )}>
                    {s.status || 'Pendente'}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

const getDateRange = (date: Date, filterType: 'day' | 'week' | 'month' | 'year' | 'custom', dateRange?: any): { start: number, end: number } => {
  const d = new Date(date);
  let start: Date, end: Date;

  if (filterType === 'custom' && dateRange?.from) {
    start = new Date(dateRange.from);
    start.setHours(0, 0, 0, 0);
    end = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
    end.setHours(23, 59, 59, 999);
    return { start: start.getTime(), end: end.getTime() };
  }

  if (filterType === 'day') {
    start = new Date(d);
    start.setHours(0, 0, 0, 0);
    end = new Date(d);
    end.setHours(23, 59, 59, 999);
  } else if (filterType === 'week') {
    start = new Date(d);
    start.setDate(d.getDate() - 3);
    start.setHours(0, 0, 0, 0);
    end = new Date(d);
    end.setDate(d.getDate() + 3);
    end.setHours(23, 59, 59, 999);
  } else if (filterType === 'month') {
    start = new Date(d.getFullYear(), d.getMonth(), 1);
    end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  } else { // year
    start = new Date(d.getFullYear(), 0, 1);
    end = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
  }
  return { start: start.getTime(), end: end.getTime() };
};

export default function AdminReports() {
  const searchParams = useSearchParams();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [dateRange, setDateRange] = useState<any>();
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('day');
  const [selectedSchool, setSelectedSchool] = useState<string>(searchParams.get('school') || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [helpNeededFilter, setHelpNeededFilter] = useState<'all' | 'yes' | 'no'>('all');

  const [summary, setSummary] = useState<{ bySchool: any[], byStatus: any[], missingItems: any[] }>({ bySchool: [], byStatus: [], missingItems: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Reuse existing raw submissions state logic if needed, but for now we focus on summary
  const [submissionsRaw, setSubmissionsRaw] = useState<any[]>([]);

  // Charts state
  const [timeSeries, setTimeSeries] = useState<Array<{ date: string; label: string; count: number;[k: string]: any }>>([]);
  const [seriesKeys, setSeriesKeys] = useState<string[]>([]);
  const [seriesColors, setSeriesColors] = useState<Record<string, string>>({});
  const [enabledSeries, setEnabledSeries] = useState<Record<string, boolean>>({});

  const statusTranslations = { pendente: 'Pendente', atendido: 'Atendido', atendido_parcialmente: 'Parcial', recusado: 'Recusado' };

  // Fetch logic
  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (date || dateRange) {
      const r = getDateRange(date || new Date(), filterType, dateRange);
      params.set('start', r.start.toString());
      params.set('end', r.end.toString());
    }
    if (selectedSchool !== 'all') params.set('school', selectedSchool);
    if (selectedStatus !== 'all') params.set('status', selectedStatus);
    if (helpNeededFilter !== 'all') params.set('helpNeeded', helpNeededFilter);

    try {
      const [sumRes, rawRes] = await Promise.all([
        fetch(`/api/reports/summary?${params.toString()}`),
        fetch(`/api/submissions?${params.toString()}`)
      ]);

      const sumData = await sumRes.json();
      const rawData = await rawRes.json();

      setSummary({
        bySchool: sumData.bySchool || [],
        byStatus: sumData.byStatus || [],
        missingItems: sumData.missingItems || []
      });
      setSubmissionsRaw(rawData.submissions || []);

      // Prepare Time Series (General Volume)
      const raws = rawData.submissions || [];
      const countsByBucket: Record<string, number> = {};

      raws.forEach((r: any) => {
        const ts = typeof r.date === 'number' ? new Date(r.date) : new Date(r.date?.toMillis?.() || r.date || Date.now());
        let key = '';

        if (filterType === 'year') {
          // Bucket by Month: YYYY-MM
          key = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}`;
        } else {
          // Bucket by Day: YYYY-MM-DD
          key = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}-${String(ts.getDate()).padStart(2, '0')}`;
        }

        countsByBucket[key] = (countsByBucket[key] || 0) + 1;
      });

      let series: any[] = [];
      const sortedKeys = Object.keys(countsByBucket).sort();

      // Fill gaps if needed? For now simple implementation
      if (sortedKeys.length > 0) {
        sortedKeys.forEach(key => {
          const parts = key.split('-');
          let label = '';
          if (parts.length === 2) { // YYYY-MM
            const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
            label = monthNames[parseInt(parts[1]) - 1];
          } else {
            label = `${parts[2]}/${parts[1]}`;
          }

          series.push({ date: key, label, count: countsByBucket[key], total: countsByBucket[key] });
        });
      }

      setTimeSeries(series);
      setSeriesKeys(['total']);
      setSeriesColors({ total: '#3b82f6' }); // Blue for total
      setEnabledSeries({ total: true });

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [date, dateRange, filterType, selectedSchool, selectedStatus, helpNeededFilter]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const downloadCSV = () => {
    // Comprehensive headers for decision-making
    const headers = [
      "Data",
      "Escola",
      "Turno",
      "Responsável",
      "Total de Alunos",
      "Status",
      "Tipo de Cardápio",
      "Descrição Cardápio Alternativo",
      "Suprimentos Recebidos",
      "Descrição dos Suprimentos",
      "Precisa de Ajuda",
      "Itens em Falta",
      "Pode Comprar Itens",
      "Itens Comprados",
      "Observações Gerais"
    ];

    // Helper function to escape CSV values
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Map all submissions to CSV rows with complete data
    const rows = submissionsRaw.map(submission => [
      escapeCSV(new Date(typeof submission.date === 'number' ? submission.date : submission.date?.toMillis?.() || 0).toLocaleString('pt-BR')),
      escapeCSV(submission.school || ''),
      escapeCSV(submission.shift || ''),
      escapeCSV(submission.respondentName || ''),
      escapeCSV(submission.presentStudents || ''),
      escapeCSV(submission.status || 'Pendente'),
      escapeCSV(
        submission.menuType === 'planned' ? 'Previsto' :
          submission.menuType === 'alternative' ? 'Alternativo' : 'Improvisado'
      ),
      escapeCSV(submission.alternativeMenuDescription || ''),
      escapeCSV(submission.suppliesReceived ? 'Sim' : 'Não'),
      escapeCSV(submission.suppliesDescription || ''),
      escapeCSV(submission.helpNeeded ? 'Sim' : 'Não'),
      escapeCSV(submission.missingItems || ''),
      escapeCSV(submission.canBuyMissingItems !== undefined ? (submission.canBuyMissingItems ? 'Sim' : 'Não') : ''),
      escapeCSV(submission.itemsPurchased || ''),
      escapeCSV(submission.observations || '')
    ]);

    // Add summary section at the top
    const summaryRows = [
      ['=== RESUMO EXECUTIVO ==='],
      ['Total de Registros', submissionsRaw.length],
      ['Pedidos de Ajuda', submissionsRaw.filter(s => s.helpNeeded).length],
      ['Compras Emergenciais', submissionsRaw.filter(s => s.itemsPurchased).length],
      [''],
      ['=== DADOS DETALHADOS ==='],
      []
    ];

    // Combine summary + headers + data rows
    const csvContent =
      '\uFEFF' + // UTF-8 BOM for Excel compatibility
      summaryRows.map(row => row.join(',')).join('\n') + '\n' +
      headers.join(',') + '\n' +
      rows.map(row => row.join(',')).join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    // Generate 8-digit batch code from timestamp (last 8 digits of timestamp)
    const batchCode = String(Date.now()).slice(-8);
    const year = new Date().getFullYear();
    const fileName = `relatório_merendaescolar_${year}_${batchCode}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    // Dynamic import to avoid SSR issues
    const jsPDF = (await import("jspdf")).default;
    await import("jspdf-autotable");

    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Helper function to add page if needed
    const checkAddPage = (requiredSpace: number) => {
      if (yPos + requiredSpace > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
        return true;
      }
      return false;
    };

    // HEADER - Beautiful gradient effect using rectangles
    doc.setFillColor(59, 130, 246); // Blue
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Smart Plate - Relatório de Gestão', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema Inteligente de Merenda Escolar', pageWidth / 2, 30, { align: 'center' });

    // Date range
    const dateStr = filterType === 'custom' && dateRange?.from
      ? `${new Date(dateRange.from).toLocaleDateString('pt-BR')} - ${dateRange.to ? new Date(dateRange.to).toLocaleDateString('pt-BR') : 'Atual'}`
      : `Filtro: ${filterType === 'day' ? 'Dia' : filterType === 'week' ? 'Semana' : filterType === 'month' ? 'Mês' : 'Ano'} (${date?.toLocaleDateString('pt-BR') || 'Hoje'})`;
    doc.text(dateStr, pageWidth / 2, 40, { align: 'center' });

    yPos = 60;

    // EXECUTIVE SUMMARY BOX
    checkAddPage(40);
    doc.setFillColor(241, 245, 249); // Light slate background
    doc.roundedRect(15, yPos, pageWidth - 30, 35, 3, 3, 'F');

    doc.setTextColor(51, 65, 85); // Slate text
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Executivo', 20, yPos + 8);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const totalRecords = submissionsRaw.length;
    const totalHelp = submissionsRaw.filter(s => s.helpNeeded).length;
    const totalPurchased = submissionsRaw.filter(s => s.itemsPurchased).length;

    doc.text(`📊 Total de Registros: ${totalRecords}`, 20, yPos + 18);
    doc.text(`🆘 Pedidos de Ajuda: ${totalHelp}`, 20, yPos + 26);
    doc.text(`🛒 Compras Emergenciais: ${totalPurchased}`, 20, yPos + 34);

    yPos += 45;

    // AUTO-GENERATED INSIGHTS
    checkAddPage(50);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246); // Blue
    doc.text('📈 Insights Automáticos', 15, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105); // Slate 600

    // Generate insights based on data
    const insights: string[] = [];

    if (totalHelp > totalRecords * 0.3) {
      insights.push(`⚠️  Alta demanda: ${((totalHelp / totalRecords) * 100).toFixed(0)}% das escolas solicitaram ajuda.`);
    } else if (totalHelp === 0) {
      insights.push(`✅ Excelente: Nenhuma solicitação de ajuda registrada no período.`);
    }

    if (totalPurchased > 0) {
      insights.push(`🛒 ${totalPurchased} compras emergenciais realizadas pelas escolas.`);
    }

    const topSchool = summary.bySchool[0];
    if (topSchool) {
      insights.push(`🏆 Escola mais ativa: ${topSchool.name} (${topSchool.count} registros).`);
    }

    const mostMissingItem = summary.missingItems[0];
    if (mostMissingItem) {
      insights.push(`📦 Item mais em falta: ${mostMissingItem.name} (${mostMissingItem.count}x reportado).`);
    }

    if (summary.byStatus.length > 0) {
      const pending = summary.byStatus.find(s => s.name === 'pendente');
      if (pending && pending.value > 0) {
        insights.push(`⏳ ${pending.value} submissões aguardando atendimento.`);
      }
    }

    insights.forEach((insight, idx) => {
      checkAddPage(8);
      doc.text(`  • ${insight}`, 15, yPos);
      yPos += 8;
    });

    yPos += 5;

    // STATUS DISTRIBUTION
    checkAddPage(45);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('📊 Distribuição por Status', 15, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const statusColors = {
      pendente: [251, 191, 36],
      atendido: [16, 185, 129],
      atendido_parcialmente: [59, 130, 246],
      recusado: [239, 68, 68]
    };

    summary.byStatus.forEach((status) => {
      checkAddPage(8);
      const color = statusColors[status.name as keyof typeof statusColors] || [148, 163, 184];
      doc.setFillColor(color[0], color[1], color[2]);
      doc.circle(20, yPos - 2, 2, 'F');
      doc.setTextColor(71, 85, 105);
      doc.text(`${status.name}: ${status.value} (${totalRecords > 0 ? ((status.value / totalRecords) * 100).toFixed(1) : 0}%)`, 26, yPos);
      yPos += 7;
    });

    yPos += 8;

    // TOP SCHOOLS TABLE
    checkAddPage(60);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('🏫 Top 10 Escolas por Registros', 15, yPos);
    yPos += 8;

    // Create table using autoTable
    (doc as any).autoTable({
      startY: yPos,
      head: [['#', 'Escola', 'Registros', 'Percentual']],
      body: summary.bySchool.slice(0, 10).map((school, idx) => [
        (idx + 1).toString(),
        school.name,
        school.count.toString(),
        `${totalRecords > 0 ? ((school.count / totalRecords) * 100).toFixed(1) : 0}%`
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: [71, 85, 105]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 15, right: 15 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // MISSING ITEMS TABLE
    if (summary.missingItems.length > 0) {
      checkAddPage(60);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(239, 68, 68); // Red for attention
      doc.text('⚠️  Itens em Falta', 15, yPos);
      yPos += 8;

      (doc as any).autoTable({
        startY: yPos,
        head: [['Item', 'Reportado', 'Prioridade']],
        body: summary.missingItems.slice(0, 10).map((item) => {
          const priority = item.count >= 10 ? 'Alta' : item.count >= 5 ? 'Média' : 'Baixa';
          return [
            item.name,
            `${item.count}x`,
            priority
          ];
        }),
        theme: 'striped',
        headStyles: {
          fillColor: [239, 68, 68],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          textColor: [71, 85, 105]
        },
        alternateRowStyles: {
          fillColor: [254, 242, 242]
        },
        columnStyles: {
          2: {
            cellWidth: 30,
            halign: 'center',
            fontStyle: 'bold'
          }
        },
        margin: { left: 15, right: 15 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // RECENT ACTIVITY
    if (submissionsRaw.length > 0) {
      checkAddPage(60);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text('📋 Atividades Recentes', 15, yPos);
      yPos += 8;

      (doc as any).autoTable({
        startY: yPos,
        head: [['Data', 'Escola', 'Turno', 'Responsável', 'Status']],
        body: submissionsRaw.slice(0, 10).map((s) => [
          new Date(typeof s.date === 'number' ? s.date : s.date?.toMillis?.() || 0).toLocaleDateString('pt-BR'),
          s.school.length > 25 ? s.school.substring(0, 22) + '...' : s.school,
          s.shift || '-',
          s.respondentName || '-',
          s.status || 'Pendente'
        ]),
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          textColor: [71, 85, 105]
        },
        margin: { left: 15, right: 15 },
        columnStyles: {
          0: { cellWidth: 25 },
          2: { cellWidth: 20 },
          4: { cellWidth: 30 }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // FOOTER
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Gerado em ${new Date().toLocaleString('pt-BR')} | Página ${i} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.text('Smart Plate © 2026', 15, pageHeight - 10);
    }

    // Save the PDF
    const fileName = `relatorio_smart_plate_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = () => {
    fetchSummary();
  };

  const totalSubmissions = summary.bySchool.reduce((acc, curr) => acc + curr.count, 0);

  // Helper for Status Chart
  const statusChartData = summary.byStatus.map(s => ({ name: s.name, value: s.value }));

  /*
  // Original Render Logic Commented Out for Debugging
  */

  return (
    <AdminLayout
      title="Relatórios"
      description="Em manutenção (Debug Build)"
    >
      <div className="p-8 text-center">
        <h3 className="text-xl font-bold text-slate-700">Reconstruindo...</h3>
        <p className="text-slate-500">Estamos identificando um erro no processo de build.</p>
      </div>
    </AdminLayout>
  );
}
