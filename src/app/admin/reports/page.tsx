"use client"

import { useMemo, useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";

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

        const res = await fetch(`/api/submissions?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Falha ao buscar');
        const json = await res.json();
        setSubmissions(json.submissions || []);
      } catch (error) {
        console.error('Erro ao carregar submissões para relatórios', error);
        setSubmissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [date, filterType, selectedSchool]);

  const dataPerSchool = useMemo(() => {
    const map: Record<string, number> = {};
    submissions.forEach((s) => {
      const name = s.school || 'Desconhecida';
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 12);
  }, [submissions]);

  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    submissions.forEach((s) => {
      const st = s.status || 'pendente';
      map[st] = (map[st] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [submissions]);

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
              <Button variant="outline">Exportar</Button>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          <div className="space-y-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Registros por Escola</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-48 flex items-center justify-center">Carregando...</div>
                ) : (
                  <ChartContainer config={{ count: { color: '#3b82f6' } }}>
                    <BarChart data={dataPerSchool} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status das Submissões</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-48 flex items-center justify-center">Carregando...</div>
                ) : (
                  <ChartContainer config={{ pendente: { color: STATUS_COLORS.pendente }, confirmado: { color: STATUS_COLORS.confirmado }, cancelado: { color: STATUS_COLORS.cancelado } }}>
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80} label>
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
