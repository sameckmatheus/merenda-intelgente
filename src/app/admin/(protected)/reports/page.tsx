"use client"

import { useMemo, useState, useEffect, useRef, FC, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Filters } from "@/components/admin/filters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, ShoppingCart, HelpCircle, TrendingUp, TrendingDown, Activity, Calendar as CalendarIcon, AlertTriangle, BarChart, ShoppingBasket, Printer, RefreshCw, FileDown } from 'lucide-react';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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
                  content={({ payload }) => (
                    <div className="flex justify-center gap-4 mt-4 flex-wrap">
                      {payload?.map((entry: any, index) => (
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
    const headers = ["Escola", "Registros"];
    const rows = summary.bySchool.map(item => [item.name, item.count]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_escolas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    // Placeholder for PDF generation - would integrate with a library like jsPDF
    alert("Funcionalidade de exportação em PDF será implementada em breve!");
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

  return (
    <AdminLayout
      title="Relatórios"
      description="Visão geral e indicadores de performance."
    >
      <div className="space-y-6">
        <div className="flex justify-end gap-3 mb-4">
          <Button onClick={handleRefresh} className="bg-emerald-500 hover:bg-emerald-600 text-white h-11 px-6 rounded-xl">
            <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
          </Button>
          <Button onClick={handlePrint} className="bg-purple-500 hover:bg-purple-600 text-white h-11 px-6 rounded-xl">
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
          <Button onClick={downloadPDF} className="bg-orange-500 hover:bg-orange-600 text-white h-11 px-6 rounded-xl">
            <FileDown className="mr-2 h-4 w-4" /> Exportar PDF
          </Button>
          <Button onClick={downloadCSV} className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-6 rounded-xl">
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        </div>

        <Filters
          date={date}
          setDate={setDate}
          dateRange={dateRange}
          setDateRange={setDateRange}
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

        {/* Use simplified KpiCards component */}
        <KpiCards submissions={submissionsRaw} />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Registros por Escola</CardTitle>
              <CardDescription>Escolas com maior número de registros.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <RechartsBarChart data={summary.bySchool.slice(0, 10)}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.slice(0, 10)} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Itens Mais Faltantes</CardTitle>
              <CardDescription>Top itens reportados como falta.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.missingItems.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center">
                    <div className="w-full flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none capitalize">{item.name}</p>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.min(100, (item.count / (totalSubmissions || 1)) * 100)}%` }}></div>
                      </div>
                    </div>
                    <div className="ml-4 font-bold text-slate-700">{item.count}</div>
                  </div>
                ))}
                {summary.missingItems.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-8">Nenhum item em falta reportado.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <Card className="col-span-1 xl:col-span-2 border-0 shadow-lg shadow-blue-900/5 bg-white/80 backdrop-blur-sm flex flex-col min-w-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold text-slate-800">Tendência de Registros (Volume Geral)</CardTitle>
                <CardDescription>
                  {filterType === 'year' ? "Acompanhamento mensal" : "Acompanhamento diário"} do volume total
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="h-[500px]">
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-slate-400">Carregando dados...</div>
              ) : (
                <div className="h-full w-full">
                  <ChartContainer
                    config={{ total: { label: "Total", color: "#3b82f6" } }}
                    className="h-full w-full"
                  >
                    <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <defs>
                        <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="label"
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                        dx={-10}
                        allowDecimals={false}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent indicator="dot" />}
                        cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#fillTotal)"
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-8 min-w-0">
            <StatusDistributionChart data={statusChartData} isLoading={isLoading} />
            <div className="flex-1 min-h-0">
              <RecentActivity submissions={submissionsRaw} />
            </div>
          </div>
        </div>

        <SubmissionsTable submissions={submissionsRaw} />
      </div>
    </AdminLayout>
  );
}
