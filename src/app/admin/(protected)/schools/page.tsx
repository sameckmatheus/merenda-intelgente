"use client"

import { useState, useMemo, useEffect } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users, Clock, Calendar, Search, Award } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const schoolsList = [
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

type SchoolSummary = {
  name: string;
  count: number;
};

// Cores para os cards das escolas
const CARD_GRADIENTS = [
  "from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 border-blue-100",
  "from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border-purple-100",
  "from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border-emerald-100",
  "from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border-amber-100",
  "from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border-cyan-100",
];

const SchoolCard = ({ name, count, index, onClick }: { name: string, count: number, index: number, onClick: () => void }) => {
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl border-dashed",
        "bg-gradient-to-br",
        gradient
      )}
      onClick={onClick}
    >
      <CardContent className="p-6 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center mb-2">
          <GraduationCap className="w-8 h-8 text-slate-700" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{name}</h3>
          <p className="text-sm text-slate-500 font-medium">{count} registros</p>
        </div>
        <Button variant="secondary" className="w-full mt-2 bg-white/50 hover:bg-white text-slate-700">
          Ver Detalhes
        </Button>
      </CardContent>
    </Card>
  );
};

const SchoolDetailsModal = ({ school, isOpen, onClose }: { school: string | null, isOpen: boolean, onClose: () => void }) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState<{ counts?: { morning: number, afternoon: number, night: number } }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValues, setEditValues] = useState({ morning: 0, afternoon: 0, night: 0 });

  useEffect(() => {
    if (school && isOpen) {
      setIsLoading(true);

      // Fetch submissions
      const p1 = fetch(`/api/submissions?school=${encodeURIComponent(school)}&limit=100`)
        .then(res => res.json())
        .then(json => setData(json.submissions || []))
        .catch(err => console.error(err));

      // Fetch school settings
      const p2 = fetch(`/api/schools/settings?school=${encodeURIComponent(school)}`)
        .then(res => res.json())
        .then(json => {
          const counts = json.settings?.counts || { morning: 0, afternoon: 0, night: 0 };
          setSchoolSettings({ counts });
          setEditValues(counts);
        })
        .catch(err => console.error(err));

      Promise.all([p1, p2]).finally(() => setIsLoading(false));
    } else {
      setData([]);
      setIsEditing(false);
    }
  }, [school, isOpen]);

  const handleSave = async () => {
    if (!school) return;
    setIsSaving(true);
    try {
      await fetch('/api/schools/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: school,
          counts: editValues
        })
      });
      setSchoolSettings({ counts: editValues });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save settings", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValues(schoolSettings.counts || { morning: 0, afternoon: 0, night: 0 });
    setIsEditing(false);
  };

  const stats = useMemo(() => {
    if (!data.length && !schoolSettings.counts) return null;

    // Use manual counts if available, otherwise 0 (or fallback to calculated if desired, but user asked for manual entry)
    // Actually, usually "registered students" is separate from "daily attendance". The card says "Média de Alunos" (Average Students).
    // The user requested to "alter quantities of students". I will display the manual counts here as "Matriculados". 
    // And I will keep "Average" separate? Or replace it? 
    // The previous code calculated averages from submissions. The user request implies setting specific counts.
    // I will REPLACE the "Average" display with the "Configured/Enrolled" counts.

    // Top Users logic remains
    const userCounts: Record<string, number> = {};
    data.forEach(sub => {
      const user = sub.respondentName || 'Anônimo';
      userCounts[user] = (userCounts[user] || 0) + 1;
    });

    const topUsers = Object.entries(userCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return { topUsers };
  }, [data, schoolSettings]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden bg-slate-50/95 backdrop-blur-xl border-white/20 gap-0">
        <div className="p-6 bg-white border-b border-slate-100 shadow-sm relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          <DialogHeader className="relative z-10 text-left">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-slate-800">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <GraduationCap className="w-6 h-6" />
              </div>
              {school}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-left">
              Visão geral e histórico completo da escola.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-slate-400">Carregando dados da escola...</div>
          ) : (
            <div className="flex flex-col gap-6 flex-1 min-h-0">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                <Card className="bg-white/60 border-0 shadow-sm">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Alunos Matriculados
                    </CardTitle>
                    {!isEditing ? (
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        Editar
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving} className="h-8 text-slate-500">
                          Cancelar
                        </Button>
                        <Button variant="default" size="sm" onClick={handleSave} disabled={isSaving} className="h-8 bg-blue-600 hover:bg-blue-700">
                          {isSaving ? 'Salvando...' : 'Salvar'}
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 pt-2">
                      {['Manhã', 'Tarde', 'Noite'].map(shiftLabel => {
                        const key = shiftLabel === 'Manhã' ? 'morning' : shiftLabel === 'Tarde' ? 'afternoon' : 'night';
                        // @ts-ignore
                        const val = editValues[key];
                        // @ts-ignore
                        const savedVal = schoolSettings.counts?.[key] || 0;

                        return (
                          <div key={key} className="flex justify-between items-center h-9">
                            <span className="text-sm font-medium text-slate-700 capitalize">{shiftLabel}</span>
                            {isEditing ? (
                              <Input
                                type="number"
                                className="w-24 h-8 text-right bg-white"
                                value={val}
                                onChange={(e) => setEditValues(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                              />
                            ) : (
                              <Badge variant="secondary" className="font-bold">{savedVal} alunos</Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/60 border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" /> Top Colaboradores
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats?.topUsers.map((u, i) => (
                        <div key={u.name} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                              i === 0 ? "bg-amber-100 text-amber-700" :
                                i === 1 ? "bg-slate-100 text-slate-700" : "bg-orange-50 text-orange-700"
                            )}>
                              {i + 1}
                            </div>
                            <span className="text-sm font-medium text-slate-700">{u.name}</span>
                          </div>
                          <span className="text-xs text-slate-400">{u.count} envios</span>
                        </div>
                      ))}
                      {(!stats?.topUsers.length) && <p className="text-xs text-muted-foreground">Sem colaboradores registrados.</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* History Table */}
              <div className="flex flex-col flex-1 min-h-0">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 shrink-0">
                  <Clock className="w-4 h-4 text-slate-400" /> Histórico Recente
                </h3>
                {/* Scrollable container for table */}
                <div className="rounded-xl border border-slate-100 bg-white shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                    <Table>
                      <TableHeader className="bg-slate-50 sticky top-0 z-10">
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Responsável</TableHead>
                          <TableHead>Turno</TableHead>
                          <TableHead>Alunos</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.map((row) => (
                          <TableRow key={row.id} className="hover:bg-slate-50">
                            <TableCell className="text-slate-600">
                              {new Date(typeof row.date === 'number' ? row.date : row.date?.toMillis?.() || 0).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium text-slate-800">{row.respondentName}</TableCell>
                            <TableCell className="text-slate-500 capitalize">{row.shift}</TableCell>
                            <TableCell className="text-slate-500">{row.studentsCount || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={row.status === 'confirmado' ? 'default' : row.status === 'cancelado' ? 'destructive' : 'secondary'} className="capitalize bg-opacity-90">
                                {row.status || 'Pendente'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {!data.length && (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhum registro encontrado para esta escola.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const normalizeString = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

export default function AdminSchools() {
  const [searchTerm, setSearchTerm] = useState("");
  const [schoolSummaries, setSchoolSummaries] = useState<SchoolSummary[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);

  useEffect(() => {
    // Fetch summary to populate card counts
    fetch('/api/reports/summary?start=0&end=9999999999999')
      .then(res => res.json())
      .then(data => {
        if (data.bySchool) {
          setSchoolSummaries(data.bySchool);
        }
      })
      .catch(err => console.error("Failed to fetch summaries", err));
  }, []);

  const getCount = (name: string) => {
    const target = normalizeString(name);
    return schoolSummaries.find(s => normalizeString(s.name) === target)?.count || 0;
  };

  const filteredSchools = schoolsList.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <AdminLayout
      title="Rede Municipal de Ensino"
      description="Gerenciamento e monitoramento individual das unidades escolares."
    >
      <div className="space-y-8">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar escola..."
            className="pl-9 bg-white border-slate-200 shadow-sm focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredSchools.map((school, index) => (
            <SchoolCard
              key={school}
              name={school}
              count={getCount(school)}
              index={index}
              onClick={() => setSelectedSchool(school)}
            />
          ))}
        </div>

        {filteredSchools.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            Nenhuma escola encontrada com "{searchTerm}".
          </div>
        )}

        <SchoolDetailsModal
          school={selectedSchool}
          isOpen={!!selectedSchool}
          onClose={() => setSelectedSchool(null)}
        />
      </div>
    </AdminLayout>
  );
}
