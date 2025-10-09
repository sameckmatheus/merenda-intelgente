"use client"

import { useMemo, useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
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

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <AdminSidebar
        date={date}
        setDate={noop}
        filterType={'day'}
        setFilterType={() => {}}
        selectedSchool={'all'}
        setSelectedSchool={() => {}}
        selectedStatus={'all'}
        setSelectedStatus={() => {}}
        helpNeededFilter={'all'}
        setHelpNeededFilter={() => {}}
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
              <Button variant="secondary" onClick={handleExportPNG}>Exportar</Button>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          <div className="space-y-6 grid grid-cols-1 lg:grid-cols-2 gap-6" ref={chartsRef}>
            <Card className="h-[28rem]">
              <CardHeader>
                <CardTitle>Registros por Escola</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-48 flex items-center justify-center">Carregando...</div>
                ) : (
                  <div className="h-64">
                    <ChartContainer className="h-full" config={{ count: { color: '#3b82f6' } }}>
                      <BarChart data={dataPerSchool} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                        <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} height={60} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" barSize={24} />
                      </BarChart>
                    </ChartContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="h-[28rem]">
              <CardHeader>
                <CardTitle>Status das Submissões</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-48 flex items-center justify-center">Carregando...</div>
                ) : (
                  <div className="h-64 flex items-center gap-6">
                    <div className="flex-1 h-full flex items-center justify-center">
                      <ChartContainer className="h-full w-full" config={{ pendente: { color: STATUS_COLORS.pendente }, confirmado: { color: STATUS_COLORS.confirmado }, cancelado: { color: STATUS_COLORS.cancelado } }}>
                        <PieChart>
                          <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} label />
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} />
                          ))}
                          <Tooltip />
                        </PieChart>
                      </ChartContainer>
                    </div>
                    <div className="w-44">
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
          </div>
        </main>
      </div>
    </div>
  );
}
