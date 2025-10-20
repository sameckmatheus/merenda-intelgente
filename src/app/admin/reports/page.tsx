"use client"

import { useMemo, useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, ShoppingCart, HelpCircle, Menu } from 'lucide-react';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, AreaChart, Area } from "recharts";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { menuItems } from "@/components/admin/sidebar";

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

export default function AdminReports() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month'>('day');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [helpNeededFilter, setHelpNeededFilter] = useState<'all' | 'yes' | 'no'>('all');
  const noop = () => {};
  const chartsRef = useRef<HTMLDivElement | null>(null);

  const handleExportPNG = async () => {
    if (!chartsRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(chartsRef.current as HTMLElement, { backgroundColor: '#ffffff' });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `relatorios-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('Erro ao exportar PNG', e);
      alert('Falha ao exportar imagem. Instale html2canvas com npm i html2canvas');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let start: number | null = null;
        let end: number | null = null;
        if (date) {
          const d = new Date(date);
          if (filterType === 'day') {
            d.setHours(0, 0, 0, 0);
            start = d.getTime();
            const e = new Date(date);
            e.setHours(23, 59, 59, 999);
            end = e.getTime();
          } else if (filterType === 'week') {
            // approximate week: 7 days window
            const s = new Date(date);
            s.setDate(s.getDate() - 3);
            s.setHours(0,0,0,0);
            const e = new Date(date);
            e.setDate(e.getDate() + 3);
            e.setHours(23,59,59,999);
            start = s.getTime();
            end = e.getTime();
          } else if (filterType === 'month') {
            const s = new Date(date.getFullYear(), date.getMonth(), 1);
            const e = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
            start = s.getTime();
            end = e.getTime();
          }
        }

        const params = new URLSearchParams();
        if (start !== null && end !== null) {
          params.set('start', String(start));
          params.set('end', String(end));
        }
        if (selectedSchool && selectedSchool !== 'all') params.set('school', selectedSchool);
        if (selectedStatusFilter && selectedStatusFilter !== 'all') params.set('status', selectedStatusFilter);
        if (helpNeededFilter && helpNeededFilter !== 'all') params.set('helpNeeded', helpNeededFilter);

  const res = await fetch(`/api/reports/summary?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Falha ao buscar');
        const json = await res.json();
        // json.bySchool and json.byStatus
  setSubmissions([]);
  setBySchool(json.bySchool || []);
  setByStatus(json.byStatus || []);
      } catch (error) {
        console.error('Erro ao carregar submissões para relatórios', error);
        setSubmissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [date, filterType, selectedSchool]);

  const [bySchool, setBySchool] = useState<{ name: string; count: number }[]>([]);
  const [byStatus, setByStatus] = useState<{ name: string; value: number }[]>([]);

  const dataPerSchool = bySchool;
  const statusData = byStatus;

  // Raw submissions for time series and recent activity
  const [submissionsRaw, setSubmissionsRaw] = useState<any[]>([]);
  // chart type toggle
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');

  // time series data por escola
  const [timeSeries, setTimeSeries] = useState<Array<{ date: string; label: string; count: number; [k: string]: any }>>([]);
  const [seriesKeys, setSeriesKeys] = useState<string[]>([]);
  const [seriesColors, setSeriesColors] = useState<Record<string, string>>({});

  useEffect(() => {
    // fetch raw submissions in addition to summary for time series and KPIs
    const fetchRaw = async () => {
      try {
        const params = new URLSearchParams();
        let start: number | null = null;
        let end: number | null = null;
        if (date) {
          const d = new Date(date);
          if (filterType === 'day') {
            d.setHours(0,0,0,0);
            start = d.getTime();
            const e = new Date(date);
            e.setHours(23,59,59,999);
            end = e.getTime();
          } else if (filterType === 'week') {
            const s = new Date(date);
            s.setDate(s.getDate() - 3);
            s.setHours(0,0,0,0);
            const e = new Date(date);
            e.setDate(e.getDate() + 3);
            e.setHours(23,59,59,999);
            start = s.getTime();
            end = e.getTime();
          } else {
            const s = new Date(date.getFullYear(), date.getMonth(), 1);
            const e = new Date(date.getFullYear(), date.getMonth()+1, 0, 23,59,59,999);
            start = s.getTime();
            end = e.getTime();
          }
        }
        if (start !== null && end !== null) {
          params.set('start', String(start));
          params.set('end', String(end));
        }
        if (selectedSchool && selectedSchool !== 'all') params.set('school', selectedSchool);
        if (selectedStatusFilter && selectedStatusFilter !== 'all') params.set('status', selectedStatusFilter);
        if (helpNeededFilter && helpNeededFilter !== 'all') params.set('helpNeeded', helpNeededFilter);

  const res = await fetch(`/api/submissions?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Falha ao buscar submissões brutas');
        const json = await res.json();
        const raws = json.submissions || [];
        setSubmissionsRaw(raws);

        // Agrupar por dia e escola
        const countsByDayAndSchool: Record<string, Record<string, number>> = {};
        const totalBySchool: Record<string, number> = {};
        raws.forEach((r: any) => {
          const ts = typeof r.date === 'number' ? new Date(r.date) : new Date(r.date?.toMillis?.() || r.date || Date.now());
          const key = `${ts.getFullYear()}-${String(ts.getMonth()+1).padStart(2,'0')}-${String(ts.getDate()).padStart(2,'0')}`;
          const school = r.school || 'Sem Escola';
          countsByDayAndSchool[key] = countsByDayAndSchool[key] || {};
          countsByDayAndSchool[key][school] = (countsByDayAndSchool[key][school] || 0) + 1;
          totalBySchool[school] = (totalBySchool[school] || 0) + 1;
        });

        // Selecionar top N escolas do período e agrupar o resto em "Outras"
        const TOP_N = 5;
        const sortedSchools = Object.entries(totalBySchool).sort((a,b) => b[1]-a[1]).map(([name]) => name);
        const topSchools = sortedSchools.slice(0, TOP_N);
        const hasOthers = sortedSchools.length > TOP_N;
        const seriesList = hasOthers ? [...topSchools, 'Outras'] : [...topSchools];
        const colorMap: Record<string, string> = {};
        seriesList.forEach((k, idx) => { colorMap[k] = SCHOOL_COLORS[idx % SCHOOL_COLORS.length]; });

        // build array for interval between start and end, preenchendo cada série
        let series: Array<{ date: string; label: string; count: number; [k: string]: any }> = [];
        if (start !== null && end !== null) {
          for (let t = start; t <= end; t += 24*60*60*1000) {
            const d = new Date(t);
            const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            const dayEntry = countsByDayAndSchool[key] || {};
            const totalForDay = Object.values(dayEntry).reduce((s, v) => s + (v || 0), 0);
            const row: any = {
              date: key,
              label: `${d.getDate()}/${String(d.getMonth()+1).padStart(2,'0')}`,
              count: totalForDay,
            };
            seriesList.forEach((sKey) => {
              if (sKey === 'Outras') {
                const others = Object.entries(dayEntry)
                  .filter(([school]) => !topSchools.includes(school))
                  .reduce((acc, [, v]) => acc + (v || 0), 0);
                row['Outras'] = others;
              } else {
                row[sKey] = dayEntry[sKey] || 0;
              }
            });
            series.push(row);
          }
        } else {
          // default last 7 days
          const today = new Date();
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            const dayEntry = countsByDayAndSchool[key] || {};
            const totalForDay = Object.values(dayEntry).reduce((s, v) => s + (v || 0), 0);
            const row: any = {
              date: key,
              label: `${d.getDate()}/${String(d.getMonth()+1).padStart(2,'0')}`,
              count: totalForDay,
            };
            seriesList.forEach((sKey) => {
              if (sKey === 'Outras') {
                const others = Object.entries(dayEntry)
                  .filter(([school]) => !topSchools.includes(school))
                  .reduce((acc, [, v]) => acc + (v || 0), 0);
                row['Outras'] = others;
              } else {
                row[sKey] = dayEntry[sKey] || 0;
              }
            });
            series.push(row);
          }
        }
        setTimeSeries(series);
        setSeriesKeys(seriesList);
        setSeriesColors(colorMap);
      } catch (e) {
        console.error('Erro ao buscar raw submissions', e);
      }
    };
    fetchRaw();
  }, [date, filterType, selectedSchool]);

  // recompute percentages for pie legend
  const statusWithPercent = useMemo(() => {
    const total = statusData.reduce((s, v) => s + (v.value || 0), 0) || 1;
    return statusData.map(s => ({ ...s, percent: Math.round(((s.value || 0) / total) * 100) }));
  }, [statusData]);

  // Export improvements: high-res PNG and PDF
  const handleExportHighResPNG = async () => {
    if (!chartsRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const scale = 2; // higher resolution
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
        // same logic to compute start/end
        const d = new Date(date);
        if (filterType === 'day') {
          d.setHours(0,0,0,0);
          const start = d.getTime();
          const e = new Date(date);
          e.setHours(23,59,59,999);
          const end = e.getTime();
          params.set('start', String(start)); params.set('end', String(end));
        } else if (filterType === 'week') {
          const s = new Date(date); s.setDate(s.getDate()-3); s.setHours(0,0,0,0);
          const e = new Date(date); e.setDate(e.getDate()+3); e.setHours(23,59,59,999);
          params.set('start', String(s.getTime())); params.set('end', String(e.getTime()));
        } else {
          const s = new Date(date.getFullYear(), date.getMonth(), 1);
          const e = new Date(date.getFullYear(), date.getMonth()+1, 0, 23,59,59,999);
          params.set('start', String(s.getTime())); params.set('end', String(e.getTime()));
        }
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

  // pagination for recent submissions
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(submissionsRaw.length / pageSize));
  const pagedSubmissions = submissionsRaw.slice((page-1)*pageSize, page*pageSize);

  const totalRecords = submissionsRaw.length;
  const totalHelp = submissionsRaw.filter(s => s.helpNeeded).length;
  const totalPurchased = submissionsRaw.filter(s => s.itemsPurchased).length;

  // recent activity (last 3)
  const recentActivity = submissionsRaw
    .slice()
    .sort((a, b) => {
      const ta = typeof a.date === 'number' ? a.date : a.date?.toMillis?.() || 0;
      const tb = typeof b.date === 'number' ? b.date : b.date?.toMillis?.() || 0;
      return tb - ta;
    })
    .slice(0, 3);


  return (
    <div className="min-h-screen w-full bg-slate-50">
      <AdminSidebar
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

      <div className="md:pl-72">
        <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetHeader className="px-4 py-3 border-b">
                    <SheetTitle>MenuPlanner</SheetTitle>
                  </SheetHeader>
                  <nav className="space-y-2 p-4">
                    {menuItems.map((item: { title: string; icon: any; href: string }) => {
                      const pathname = usePathname();
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`${isActive ? 'bg-accent' : 'transparent'} flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent`}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.title}
                        </Link>
                      );
                    })}
                  </nav>
                  <div className="px-4 pb-4">
                    <AdminSidebar
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
                  </div>
                </SheetContent>
              </Sheet>
              <h2 className="font-headline text-xl font-bold tracking-tight text-foreground">Relatórios</h2>
              <p className="text-muted-foreground">Gráficos de acompanhamento dos registros.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" className="px-2 py-1 text-sm" onClick={handleExportHighResPNG} aria-label="Exportar PNG em alta resolução">PNG</Button>
              <Button variant="outline" size="sm" className="px-2 py-1 text-sm" onClick={handleExportPDF} aria-label="Exportar PDF">PDF</Button>
              <Button variant="default" size="sm" className="px-2 py-1 text-sm" onClick={handleExportCSV} aria-label="Exportar CSV"><Download className="mr-2 h-4 w-4" />CSV</Button>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          {/* KPI cards row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4 mb-6 items-stretch">
            <Card className="h-24 flex items-center">
              <CardContent className="px-4 py-3">
                <div className="text-sm text-muted-foreground flex items-center gap-2"><FileText className="h-4 w-4"/> Total de Registros</div>
                <div className="text-2xl font-bold">{totalRecords}</div>
                <div className="text-xs text-muted-foreground">no período selecionado</div>
              </CardContent>
            </Card>
            <Card className="h-24 flex items-center">
              <CardContent className="px-4 py-3">
                <div className="text-sm text-muted-foreground flex items-center gap-2"><HelpCircle className="h-4 w-4"/> Pedidos de Ajuda</div>
                <div className="text-2xl font-bold">{totalHelp}</div>
                <div className="text-xs text-muted-foreground">itens em falta</div>
              </CardContent>
            </Card>
            <Card className="h-24 flex items-center">
              <CardContent className="px-4 py-3">
                <div className="text-sm text-muted-foreground flex items-center gap-2"><ShoppingCart className="h-4 w-4"/> Compras Realizadas</div>
                <div className="text-2xl font-bold">{totalPurchased}</div>
                <div className="text-xs text-muted-foreground">compras registradas</div>
              </CardContent>
            </Card>
          </div>

          {/* Main grid: left large chart, right widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <Card className="h-64 md:h-80 lg:h-96">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>Registros no Período</CardTitle>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant={chartType==='line'?'default':'outline'} onClick={()=>setChartType('line')}>Linha</Button>
                      <Button size="sm" variant={chartType==='bar'?'default':'outline'} onClick={()=>setChartType('bar')}>Barra</Button>
                      <Button size="sm" variant={chartType==='area'?'default':'outline'} onClick={()=>setChartType('area')}>Área</Button>
                    </div>
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
                              {seriesKeys.map((k) => (
                                <Line key={k} type="monotone" dataKey={k} stroke={seriesColors[k]} strokeWidth={2} dot={{ r: 2 }} />
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
                              {seriesKeys.map((k) => (
                                <Bar key={k} dataKey={k} stackId="a" fill={seriesColors[k]} radius={[4,4,0,0]} />
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
                              {seriesKeys.map((k) => (
                                <Area key={k} type="monotone" dataKey={k} stroke={seriesColors[k]} fill={seriesColors[k]} fillOpacity={0.3} />
                              ))}
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
              <Card className="h-40 md:h-56 lg:h-72">
                <CardHeader>
                  <CardTitle>Status das Submissões</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-32 md:h-40 flex items-center justify-center">Carregando...</div>
                  ) : (
                    <div className="h-28 md:h-40 lg:h-48 flex items-center gap-4">
                      <div className="flex-1 h-full flex items-center justify-center">
                        <ChartContainer className="h-full w-full" config={{ pendente: { color: STATUS_COLORS.pendente }, confirmado: { color: STATUS_COLORS.confirmado }, cancelado: { color: STATUS_COLORS.cancelado } }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={34} outerRadius={56} label={{ fontSize: 10 }} />
                              {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} />
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
                              <span className={`w-3 h-3 rounded-sm shrink-0 ${STATUS_TW[s.name as keyof typeof STATUS_TW]}`} />
                              <span className="font-medium">{s.name}</span>
                              <span className="text-muted-foreground ml-auto">{s.value} <span className="text-xs text-muted-foreground">({s.percent}%)</span></span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

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
            </div>
          </div>

          {/* Recent submissions table */}
          <div>
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
                      {submissionsRaw.slice(0, 20).map((s: any) => (
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
          </div>
        </main>
      </div>
    </div>
  );
}
