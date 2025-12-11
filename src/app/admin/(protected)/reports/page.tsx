"use client"

import { useMemo, useState, useEffect, useRef, FC, useCallback } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Filters } from "@/components/admin/filters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, ShoppingCart, HelpCircle, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area } from "recharts";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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

// Cores vibrantes
const COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b',
  '#06b6d4', '#6366f1', '#f43f5e', '#84cc16', '#14b8a6'
];

const STATUS_COLORS = {
  pendente: '#fbbf24', // Amber 400
  confirmado: '#34d399', // Emerald 400
  cancelado: '#f87171', // Red 400
} as const;

type Status = keyof typeof STATUS_COLORS;

const KpiCard = ({ title, value, subtitle, icon: Icon, colorClass, trend }: { title: string, value: number, subtitle: string, icon: any, colorClass: string, trend?: 'up' | 'down' | 'neutral' }) => (
  <Card className="relative overflow-hidden border-0 shadow-lg shadow-blue-900/5 bg-white transition-all hover:-translate-y-1 hover:shadow-xl">
    <div className={cn("absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 rounded-full blur-3xl -mr-16 -mt-16", colorClass)}></div>
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
        </div>
        <div className={cn("p-3 rounded-xl", colorClass.replace('from-', 'bg-').split(' ')[0])}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        {trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
        {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
        <p className="text-xs font-medium text-slate-400">{subtitle}</p>
      </div>
    </CardContent>
  </Card>
);

const KpiCards: FC<{ submissions: any[] }> = ({ submissions }) => {
  const totalRecords = submissions.length;
  const totalHelp = submissions.filter(s => s.helpNeeded).length;
  const totalPurchased = submissions.filter(s => s.itemsPurchased).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <KpiCard
        title="Total de Registros"
        value={totalRecords}
        subtitle="No período selecionado"
        icon={FileText}
        colorClass="from-blue-600 to-indigo-600"
        trend="up"
      />
      <KpiCard
        title="Pedidos de Ajuda"
        value={totalHelp}
        subtitle="Solicitações de itens"
        icon={HelpCircle}
        colorClass="from-amber-500 to-orange-500"
        trend="neutral"
      />
      <KpiCard
        title="Compras Realizadas"
        value={totalPurchased}
        subtitle="Compras emergenciais"
        icon={ShoppingCart}
        colorClass="from-emerald-500 to-teal-500"
        trend="down"
      />
    </div>
  );
};

const StatusDistributionChart: FC<{ data: { name: string, value: number }[], isLoading: boolean }> = ({ data, isLoading }) => {
  const statusWithPercent = useMemo(() => {
    const total = data.reduce((s, v) => s + (v.value || 0), 0) || 1;
    return data.map(s => ({ ...s, percent: Math.round(((s.value || 0) / total) * 100) }));
  }, [data]);

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
                confirmado: { label: 'Confirmado', color: STATUS_COLORS.confirmado },
                cancelado: { label: 'Cancelado', color: STATUS_COLORS.cancelado },
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
                <ChartTooltip
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <ChartLegend
                  content={({ payload }) => (
                    <div className="flex justify-center gap-4 mt-4">
                      {payload?.map((entry: any, index) => (
                        <div key={`legend-${index}`} className="flex items-center gap-2 text-sm text-slate-600">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="capitalize">{entry.value}</span>
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
                r.status === 'confirmado' ? "bg-emerald-500 ring-emerald-500" :
                  r.status === 'cancelado' ? "bg-red-500 ring-red-500" : "bg-amber-400 ring-amber-400"
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
                    s.status === 'confirmado' ? "bg-emerald-100 text-emerald-700" :
                      s.status === 'cancelado' ? "bg-red-100 text-red-700" :
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

const getDateRange = (date: Date, filterType: 'day' | 'week' | 'month'): { start: number, end: number } => {
  const d = new Date(date);
  let start: Date, end: Date;

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
  } else { // month
    start = new Date(d.getFullYear(), d.getMonth(), 1);
    end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  }
  return { start: start.getTime(), end: end.getTime() };
};

export default function AdminReports() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month'>('day');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [helpNeededFilter, setHelpNeededFilter] = useState<'all' | 'yes' | 'no'>('all');

  const [bySchool, setBySchool] = useState<{ name: string; count: number }[]>([]);
  const [byStatus, setByStatus] = useState<{ name: string; value: number }[]>([]);
  const [submissionsRaw, setSubmissionsRaw] = useState<any[]>([]);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [metricType, setMetricType] = useState<'total' | 'confirmed'>('total');
  const [timeSeries, setTimeSeries] = useState<Array<{ date: string; label: string; count: number;[k: string]: any }>>([]);
  const [seriesKeys, setSeriesKeys] = useState<string[]>([]);
  const [seriesColors, setSeriesColors] = useState<Record<string, string>>({});
  const [enabledSeries, setEnabledSeries] = useState<Record<string, boolean>>({});

  const chartsRef = useRef<HTMLDivElement | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      let start: number | null = null;
      let end: number | null = null;

      if (date) {
        const range = getDateRange(date, filterType);
        start = range.start;
        end = range.end;
      }

      if (start !== null && end !== null) {
        params.set('start', String(start));
        params.set('end', String(end));
      }
      if (selectedSchool && selectedSchool !== 'all') params.set('school', selectedSchool);
      if (selectedStatusFilter && selectedStatusFilter !== 'all') params.set('status', selectedStatusFilter);
      if (helpNeededFilter && helpNeededFilter !== 'all') params.set('helpNeeded', helpNeededFilter);

      const [summaryRes, rawRes] = await Promise.all([
        fetch(`/api/reports/summary?${params.toString()}`, { cache: 'no-store' }),
        fetch(`/api/submissions?${params.toString()}`, { cache: 'no-store' })
      ]);

      if (!summaryRes.ok) throw new Error('Falha ao buscar resumo');
      if (!rawRes.ok) throw new Error('Falha ao buscar submissões brutas');

      const summaryJson = await summaryRes.json();
      const rawJson = await rawRes.json();

      setBySchool(summaryJson.bySchool || []);
      setByStatus(summaryJson.byStatus || []);

      const raws = rawJson.submissions || [];
      setSubmissionsRaw(raws);
      setSubmissions(raws);

      const countsByDayAndSchool: Record<string, Record<string, number>> = {};
      const totalBySchool: Record<string, number> = {};
      raws.forEach((r: any) => {
        const ts = typeof r.date === 'number' ? new Date(r.date) : new Date(r.date?.toMillis?.() || r.date || Date.now());
        const key = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}-${String(ts.getDate()).padStart(2, '0')}`;
        const school = r.school || 'Sem Escola';
        const isConfirmed = r.status === 'confirmado';

        if (metricType === 'confirmed' && !isConfirmed) return;

        countsByDayAndSchool[key] = countsByDayAndSchool[key] || {};
        countsByDayAndSchool[key][school] = (countsByDayAndSchool[key][school] || 0) + 1;
        totalBySchool[school] = (totalBySchool[school] || 0) + 1;
      });

      const seriesList = Object.entries(totalBySchool)
        .sort((a, b) => b[1] - a[1])
        .map(([name]) => name);
      const colorMap: Record<string, string> = {};
      seriesList.forEach((k, idx) => { colorMap[k] = COLORS[idx % COLORS.length]; });

      let series: Array<{ date: string; label: string; count: number;[k: string]: any }> = [];
      const today = new Date();
      const effectiveStart = start !== null ? start : new Date(today.setDate(today.getDate() - 6)).setHours(0, 0, 0, 0);
      const effectiveEnd = end !== null ? end : new Date().setHours(23, 59, 59, 999);

      for (let t = effectiveStart; t <= effectiveEnd; t += 24 * 60 * 60 * 1000) {
        const d = new Date(t);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const dayEntry = countsByDayAndSchool[key] || {};
        const totalForDay = Object.values(dayEntry).reduce((s, v) => s + (v || 0), 0);
        const row: any = {
          date: key,
          label: `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}`,
          count: totalForDay,
        };
        seriesList.forEach((sKey) => {
          row[sKey] = dayEntry[sKey] || 0;
        });
        series.push(row);
      }

      setTimeSeries(series);
      setSeriesKeys(seriesList);
      setSeriesColors(colorMap);
      setEnabledSeries((prev) => {
        const next: Record<string, boolean> = { ...prev };
        seriesList.forEach(k => { if (next[k] === undefined) next[k] = true; });
        Object.keys(next).forEach(k => { if (!seriesList.includes(k)) delete next[k]; });
        return next;
      });

    } catch (e) {
      console.error('Erro ao buscar dados dos relatórios', e);
      setSubmissions([]);
      setSubmissionsRaw([]);
      setBySchool([]);
      setByStatus([]);
    } finally {
      setIsLoading(false);
    }
  }, [date, filterType, selectedSchool, selectedStatusFilter, helpNeededFilter, metricType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statusData = useMemo(() => {
    const base = { pendente: 0, confirmado: 0, cancelado: 0 } as Record<string, number>;
    byStatus.forEach(s => { base[s.name] = s.value || 0; });
    return [
      { name: 'pendente', value: base.pendente },
      { name: 'confirmado', value: base.confirmado },
      { name: 'cancelado', value: base.cancelado },
    ];
  }, [byStatus]);

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (date) {
        const { start, end } = getDateRange(date, filterType);
        params.set('start', String(start));
        params.set('end', String(end));
      }
      if (selectedSchool && selectedSchool !== 'all') params.set('school', selectedSchool);
      if (selectedStatusFilter && selectedStatusFilter !== 'all') params.set('status', selectedStatusFilter);
      if (helpNeededFilter && helpNeededFilter !== 'all') params.set('helpNeeded', helpNeededFilter);

      const res = await fetch(`/api/reports/csv?${params.toString()}`);
      if (!res.ok) throw new Error('Erro ao gerar CSV');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'relatorio-menuplanner.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Erro ao exportar CSV', e);
      alert('Falha ao exportar CSV');
    }
  };

  const exportActions = (
    <div className="flex gap-2">
      <Button
        variant="default"
        size="sm"
        onClick={handleExportCSV}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-600/20 rounded-xl transition-all hover:scale-105 active:scale-95"
      >
        <FileText className="mr-2 h-4 w-4" /> Exportar CSV
      </Button>
    </div>
  );

  return (
    <AdminLayout
      title="Central de Relatórios"
      description="Análise detalhada do desempenho e registros da merenda escolar."
      actions={exportActions}
    >
      <div className="space-y-8" ref={chartsRef}>

        <Filters
          date={date}
          setDate={setDate}
          filterType={filterType}
          setFilterType={setFilterType}
          selectedSchool={selectedSchool}
          setSelectedSchool={setSelectedSchool}
          selectedStatus={selectedStatusFilter}
          setSelectedStatus={setSelectedStatusFilter}
          helpNeededFilter={helpNeededFilter}
          setHelpNeededFilter={setHelpNeededFilter}
          schools={schools}
          statusTranslations={{ pendente: 'Pendente', confirmado: 'Confirmado', cancelado: 'Cancelado' }}
        />

        <KpiCards submissions={submissionsRaw} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <Card className="col-span-1 xl:col-span-2 border-0 shadow-lg shadow-blue-900/5 bg-white/80 backdrop-blur-sm flex flex-col min-w-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold text-slate-800">Tendência de Registros</CardTitle>
                <CardDescription>Acompanhamento diário das submissões por escola</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="h-[500px]">
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-slate-400">Carregando dados...</div>
              ) : (
                <div className="h-full w-full">

                  <div className="h-full w-full">
                    <ChartContainer
                      config={Object.fromEntries(seriesKeys.map((k) => [k, { label: k, color: seriesColors[k] }]))}
                      className="h-full w-full"
                    >
                      <LineChart data={timeSeries} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
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
                          domain={[0, 'auto']}
                          allowDecimals={false}
                          tickCount={6} // Helps spread them out, but we want exact 10s? Recharts is tricky with exact steps.
                          // Let's force ticks to be multiples of 10
                          ticks={(() => {
                            const max = Math.max(...timeSeries.map(d => d.count), 1);
                            const top = Math.ceil(max / 10) * 10;
                            const ticks = [];
                            for (let i = 0; i <= top; i += 10) ticks.push(i);
                            return ticks;
                          })()}
                        />
                        <ChartTooltip
                          content={<ChartTooltipContent indicator="dot" />}
                          cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        {seriesKeys.filter(k => enabledSeries[k]).map((k) => (
                          <Line
                            key={k}
                            type="monotone"
                            dataKey={k}
                            stroke={seriesColors[k]}
                            strokeWidth={3}
                            dot={{ r: 4, fill: seriesColors[k], strokeWidth: 0 }}
                            activeDot={{ r: 6 }}
                          />
                        ))}
                        <ChartLegend content={<ChartLegendContent />} className="mt-4" />
                      </LineChart>
                    </ChartContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-8 min-w-0">
            <StatusDistributionChart data={statusData} isLoading={isLoading} />
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
