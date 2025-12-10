"use client"

import { useMemo, useState, useEffect, useRef, FC, useCallback } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, ShoppingCart, HelpCircle } from 'lucide-react';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area } from "recharts";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

// Paleta de cores para séries por escola
const SCHOOL_COLORS = [
  '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#22c55e'
];

const STATUS_COLORS = {
  pendente: '#f59e0b',
  confirmado: '#10b981',
  cancelado: '#ef4444',
} as const;

const STATUS_TW = {
  pendente: 'bg-amber-400',
  confirmado: 'bg-emerald-500',
  cancelado: 'bg-red-500',
} as const;

type Status = keyof typeof STATUS_COLORS;

const KpiCards: FC<{ submissions: any[] }> = ({ submissions }) => {
  const totalRecords = submissions.length;
  const totalHelp = submissions.filter(s => s.helpNeeded).length;
  const totalPurchased = submissions.filter(s => s.itemsPurchased).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4 mb-6 items-stretch">
      <Card className="h-24 flex items-center">
        <CardContent className="px-4 py-3">
          <div className="text-sm text-muted-foreground flex items-center gap-2"><FileText className="h-4 w-4" /> Total de Registros</div>
          <div className="text-2xl font-bold">{totalRecords}</div>
          <div className="text-xs text-muted-foreground">no período selecionado</div>
        </CardContent>
      </Card>
      <Card className="h-24 flex items-center">
        <CardContent className="px-4 py-3">
          <div className="text-sm text-muted-foreground flex items-center gap-2"><HelpCircle className="h-4 w-4" /> Pedidos de Ajuda</div>
          <div className="text-2xl font-bold">{totalHelp}</div>
          <div className="text-xs text-muted-foreground">itens em falta</div>
        </CardContent>
      </Card>
      <Card className="h-24 flex items-center">
        <CardContent className="px-4 py-3">
          <div className="text-sm text-muted-foreground flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Compras Realizadas</div>
          <div className="text-2xl font-bold">{totalPurchased}</div>
          <div className="text-xs text-muted-foreground">compras registradas</div>
        </CardContent>
      </Card>
    </div>
  );
};

const StatusDistributionChart: FC<{ data: { name: string, value: number }[], isLoading: boolean }> = ({ data, isLoading }) => {
  const statusWithPercent = useMemo(() => {
    const total = data.reduce((s, v) => s + (v.value || 0), 0) || 1;
    return data.map(s => ({ ...s, percent: Math.round(((s.value || 0) / total) * 100) }));
  }, [data]);

  return (
    <Card className="h-40 md:h-56 lg:h-72">
      <CardHeader>
        <CardTitle>Status das Submissões</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-32 md:h-40 flex items-center justify-center">Carregando...</div>
        ) : data.length > 0 ? (
          <div className="h-28 md:h-40 lg:h-48 flex items-center gap-4">
            <div className="flex-1 h-full flex items-center justify-center">
              <ChartContainer className="h-full w-full" config={{ pendente: { color: STATUS_COLORS.pendente }, confirmado: { color: STATUS_COLORS.confirmado }, cancelado: { color: STATUS_COLORS.cancelado } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" innerRadius={34} outerRadius={56} label={{ fontSize: 10 }} />
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as Status]} />
                    ))}
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="w-40 md:w-44">
              <div className="text-xs text-muted-foreground mb-2">Legenda</div>
              <ul className="space-y-1 text-sm">
                {statusWithPercent.map(s => (
                  <li key={s.name} className="flex items-center gap-2" aria-label={`Status ${s.name}: ${s.value} (${s.percent}%)`} title={`${s.name}: ${s.value} (${s.percent}%)`}>
                    <span className={`w-3 h-3 rounded-sm shrink-0 ${STATUS_TW[s.name as Status]}`} />
                    <span className="font-medium">{s.name}</span>
                    <span className="text-muted-foreground ml-auto">{s.value} <span className="text-xs text-muted-foreground">({s.percent}%)</span></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="h-32 md:h-40 flex items-center justify-center text-muted-foreground">Sem dados para exibir.</div>
        )}
      </CardContent>
    </Card>
  );
};

const RecentActivity: FC<{ submissions: any[] }> = ({ submissions }) => {
  const recentActivity = submissions
    .slice()
    .sort((a, b) => {
      const ta = typeof a.date === 'number' ? a.date : a.date?.toMillis?.() || 0;
      const tb = typeof b.date === 'number' ? b.date : b.date?.toMillis?.() || 0;
      return tb - ta;
    })
    .slice(0, 3);

  return (
    <Card className="h-36 md:h-44 lg:h-56">
      <CardHeader>
        <CardTitle>Atividades Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {recentActivity.map((r: any) => (
            <li key={r.id} className="text-sm">
              <div className="font-medium">{r.school}</div>
              <div className="text-muted-foreground text-xs">{r.respondentName} — {new Date(typeof r.date === 'number' ? r.date : r.date?.toMillis?.() || r.date || 0).toLocaleString()}</div>
            </li>
          ))}
          {recentActivity.length === 0 && <li className="text-sm text-muted-foreground">Nenhuma atividade recente</li>}
        </ul>
      </CardContent>
    </Card>
  );
};

const SubmissionsTable: FC<{ submissions: any[] }> = ({ submissions }) => (
  <Card>
    <CardHeader>
      <CardTitle>Submissões Recentes</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th>Escola</th>
              <th>Data</th>
              <th>Turno</th>
              <th>Responsável</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {submissions.slice(0, 20).map((s: any) => (
              <tr key={s.id} className="border-t">
                <td className="py-2">{s.school}</td>
                <td>{new Date(typeof s.date === 'number' ? s.date : s.date?.toMillis?.() || s.date || 0).toLocaleDateString()}</td>
                <td>{s.shift}</td>
                <td>{s.respondentName}</td>
                <td className="capitalize">{s.status || 'pendente'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
  const [timeSeries, setTimeSeries] = useState<Array<{ date: string; label: string; count: number; [k: string]: any }>>([]);
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
      seriesList.forEach((k, idx) => { colorMap[k] = SCHOOL_COLORS[idx % SCHOOL_COLORS.length]; });

      let series: Array<{ date: string; label: string; count: number; [k: string]: any }> = [];
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

  const handleExportHighResPNG = async () => {
    if (!chartsRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const scale = 2;
      const canvas = await html2canvas(chartsRef.current as HTMLElement, { backgroundColor: '#ffffff', scale });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `relatorios-highres-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('Erro ao exportar PNG', e);
      alert('Falha ao exportar imagem. Instale html2canvas com npm i html2canvas');
    }
  };

  const handleExportPDF = async () => {
    if (!chartsRef.current) return;
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
      const canvas = await html2canvas(chartsRef.current as HTMLElement, { backgroundColor: '#ffffff', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF({ orientation: 'landscape' });
      const imgProps = doc.getImageProperties(imgData);
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      doc.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
      doc.save(`relatorios-${Date.now()}.pdf`);
    } catch (e) {
      console.error('Erro ao exportar PDF', e);
      alert('Falha ao exportar PDF. Instale html2canvas e jspdf com npm i html2canvas jspdf');
    }
  };

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
      a.download = 'relatorio-submissions.csv';
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
    <>
      <Button variant="secondary" size="sm" className="px-2 py-1 text-sm" onClick={handleExportHighResPNG} aria-label="Exportar PNG em alta resolução">PNG</Button>
      <Button variant="outline" size="sm" className="px-2 py-1 text-sm" onClick={handleExportPDF} aria-label="Exportar PDF">PDF</Button>
      <Button variant="default" size="sm" className="px-2 py-1 text-sm" onClick={handleExportCSV} aria-label="Exportar CSV"><Download className="mr-2 h-4 w-4" />CSV</Button>
    </>
  );

  return (
    <AdminLayout
      title="Relatórios"
      description="Gráficos de acompanhamento dos registros"
      actions={exportActions}
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
    >
      <div ref={chartsRef}>
        <KpiCards submissions={submissionsRaw} />

        {/* Main grid: left large chart, right widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Card className="h-64 md:h-80 lg:h-96">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>Registros no Período</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">Opções</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuLabel>Tipo do gráfico</DropdownMenuLabel>
                      <DropdownMenuRadioGroup value={chartType} onValueChange={(v)=>setChartType(v as any)}>
                        <DropdownMenuRadioItem value="line">Linha</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="bar">Barras</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="area">Área</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Métrica</DropdownMenuLabel>
                      <DropdownMenuRadioGroup value={metricType} onValueChange={(v)=>setMetricType(v as any)}>
                        <DropdownMenuRadioItem value="total">Total</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="confirmed">Confirmados</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Escolas</DropdownMenuLabel>
                      {seriesKeys.map((k)=> (
                        <DropdownMenuCheckboxItem key={k} checked={!!enabledSeries[k]} onCheckedChange={(c)=>setEnabledSeries(s=>({ ...s, [k]: !!c }))}>
                          {k}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-40 md:h-56 flex items-center justify-center">Carregando...</div>
                ) : (
                  <div className="h-48 md:h-60 lg:h-72">
                    <ChartContainer className="h-full w-full" config={Object.fromEntries(seriesKeys.map((k) => [k, { label: k, color: seriesColors[k] }]))}>
                      <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'line' ? (
                          <LineChart data={timeSeries} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" interval={Math.max(0, Math.floor(timeSeries.length / 6))} tick={{ fontSize: 11 }} height={28} />
                            <YAxis width={40} />
                            <ChartTooltip content={<ChartTooltipContent labelKey="label" />} labelFormatter={(_, p)=>{
                              const iso = p?.[0]?.payload?.date; if(!iso) return ''; return new Date(iso).toLocaleDateString();
                            }} />
                            <ChartLegend content={<ChartLegendContent />} />
                            {seriesKeys.filter(k=>enabledSeries[k]).map((k) => (
                              <Line key={k} type="monotone" dataKey={k} stroke={seriesColors[k]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            ))}
                          </LineChart>
                        ) : chartType === 'bar' ? (
                          <BarChart data={timeSeries} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" interval={Math.max(0, Math.floor(timeSeries.length / 6))} tick={{ fontSize: 11 }} height={28} />
                            <YAxis width={40} />
                            <ChartTooltip content={<ChartTooltipContent labelKey="label" />} labelFormatter={(_, p)=>{
                              const iso = p?.[0]?.payload?.date; if(!iso) return ''; return new Date(iso).toLocaleDateString();
                            }} />
                            <ChartLegend content={<ChartLegendContent />} />
                            {seriesKeys.filter(k=>enabledSeries[k]).map((k) => (
                              <Bar key={k} dataKey={k} fill={seriesColors[k]} radius={[4,4,0,0]} />
                            ))}
                          </BarChart>
                        ) : (
                          <AreaChart data={timeSeries} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" interval={Math.max(0, Math.floor(timeSeries.length / 6))} tick={{ fontSize: 11 }} height={28} />
                            <YAxis width={40} />
                            <ChartTooltip content={<ChartTooltipContent labelKey="label" />} labelFormatter={(_, p)=>{
                              const iso = p?.[0]?.payload?.date; if(!iso) return ''; return new Date(iso).toLocaleDateString();
                            }} />
                            <ChartLegend content={<ChartLegendContent />} />
                            {seriesKeys.filter(k=>enabledSeries[k]).map((k) => (
                              <Area key={k} type="monotone" dataKey={k} stroke={seriesColors[k]} fill={`url(#gradient-${k})`} fillOpacity={0.6} strokeWidth={2} />
                            ))}
                            <defs>
                              {seriesKeys.filter(k=>enabledSeries[k]).map((k) => (
                                <linearGradient key={`gradient-${k}`} id={`gradient-${k}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={seriesColors[k]} stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor={seriesColors[k]} stopOpacity={0.1}/>
                                </linearGradient>
                              ))}
                            </defs>
                          </AreaChart>
                        )}
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-6">
            <StatusDistributionChart data={statusData} isLoading={isLoading} />
            <RecentActivity submissions={submissionsRaw} />
          </div>
        </div>

        <div>
          <SubmissionsTable submissions={submissionsRaw} />
        </div>
      </div>
    </AdminLayout>
  );
}
