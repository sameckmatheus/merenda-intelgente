"use client"

import { useMemo, useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, ShoppingCart, HelpCircle } from 'lucide-react';
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

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

const STATUS_COLORS = {
  pendente: '#f59e0b',
  confirmado: '#10b981',
  cancelado: '#ef4444',
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

  // time series data (daily counts)
  const [timeSeries, setTimeSeries] = useState<{ date: string; count: number }[]>([]);

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

        // build time series grouped by day
        const map: Record<string, number> = {};
        raws.forEach((r: any) => {
          const ts = typeof r.date === 'number' ? new Date(r.date) : new Date(r.date?.toMillis?.() || r.date || Date.now());
          const key = `${ts.getFullYear()}-${String(ts.getMonth()+1).padStart(2,'0')}-${String(ts.getDate()).padStart(2,'0')}`;
          map[key] = (map[key] || 0) + 1;
        });

        // build array for interval between start and end
        let series: { date: string; count: number }[] = [];
        if (start !== null && end !== null) {
          for (let t = start; t <= end; t += 24*60*60*1000) {
            const d = new Date(t);
            const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            series.push({ date: `${d.getDate()}/${String(d.getMonth()+1).padStart(2,'0')}`, count: map[key] || 0 });
          }
        } else {
          // default last 7 days
          const today = new Date();
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            series.push({ date: `${d.getDate()}/${String(d.getMonth()+1).padStart(2,'0')}`, count: map[key] || 0 });
          }
        }
        setTimeSeries(series);
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

  // recent activity (last 6)
  const recentActivity = submissionsRaw
    .slice()
    .sort((a, b) => {
      const ta = typeof a.date === 'number' ? a.date : a.date?.toMillis?.() || 0;
      const tb = typeof b.date === 'number' ? b.date : b.date?.toMillis?.() || 0;
      return tb - ta;
    })
    .slice(0, 6);


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
            <div>
              <h2 className="font-headline text-xl font-bold tracking-tight text-foreground">Relatórios</h2>
              <p className="text-muted-foreground">Gráficos de acompanhamento dos registros.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleExportHighResPNG}>PNG (alta)</Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>PDF</Button>
              <Button variant="default" size="sm" onClick={handleExportCSV}><Download className="mr-2 h-4 w-4" />CSV</Button>
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
              <Card className="h-[28rem]">
                <CardHeader>
                  <CardTitle>Registros no Período</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-56 flex items-center justify-center">Carregando...</div>
                  ) : (
                    <div className="h-56">
                      <ChartContainer className="h-full" config={{ series: { color: '#3b82f6' } }}>
                        <LineChart data={timeSeries} margin={{ top: 8, right: 10, left: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ChartContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 flex flex-col gap-6">
              <Card className="h-[20rem]">
                <CardHeader>
                  <CardTitle>Status das Submissões</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-40 flex items-center justify-center">Carregando...</div>
                  ) : (
                    <div className="h-40 flex items-center gap-6">
                      <div className="flex-1 h-full flex items-center justify-center">
                        <ChartContainer className="h-full w-full" config={{ pendente: { color: STATUS_COLORS.pendente }, confirmado: { color: STATUS_COLORS.confirmado }, cancelado: { color: STATUS_COLORS.cancelado } }}>
                          <PieChart>
                            <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={36} outerRadius={64} label />
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} />
                            ))}
                            <Tooltip />
                          </PieChart>
                        </ChartContainer>
                      </div>
                      <div className="w-36">
                        <ul className="space-y-2">
                          {statusData.map((s) => (
                            <li key={s.name} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`inline-block w-3 h-3 rounded-sm ${
                                  s.name === 'pendente' ? 'bg-amber-400' : s.name === 'confirmado' ? 'bg-emerald-500' : 'bg-red-500'
                                }`} />
                                <span className="text-sm capitalize">{s.name}</span>
                              </div>
                              <div className="text-sm font-medium">{s.value}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="h-[16rem]">
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
