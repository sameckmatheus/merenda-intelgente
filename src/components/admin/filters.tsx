"use client";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Building, Calendar as CalendarIcon, MessageSquare, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FiltersProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  filterType: 'day' | 'week' | 'month';
  setFilterType: (type: 'day' | 'week' | 'month') => void;
  selectedSchool: string;
  setSelectedSchool: (school: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  helpNeededFilter: 'all' | 'yes' | 'no';
  setHelpNeededFilter: (filter: 'all' | 'yes' | 'no') => void;
  schools: string[];
  statusTranslations: { [key: string]: string };
}

export function Filters({
  date,
  setDate,
  filterType,
  setFilterType,
  selectedSchool,
  setSelectedSchool,
  selectedStatus,
  setSelectedStatus,
  helpNeededFilter,
  setHelpNeededFilter,
  schools,
  statusTranslations,
}: FiltersProps) {
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

  return (
    <div className="space-y-4 bg-card rounded-lg border p-4">
      <h3 className="font-semibold">Filtros</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Período</label>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 rounded-md border bg-card p-1">
              <Button variant={filterType === 'day' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilterType('day')}>Dia</Button>
              <Button variant={filterType === 'week' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilterType('week')}>Semana</Button>
              <Button variant={filterType === 'month' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilterType('month')}>Mês</Button>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>{getPeriodLabel()}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Escola</label>
          <Select value={selectedSchool} onValueChange={setSelectedSchool}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <SelectValue placeholder="Filtrar por escola" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Escolas</SelectItem>
              {schools.map((school) => (
                <SelectItem key={school} value={school}>{school}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <SelectValue placeholder="Filtrar por status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              {Object.entries(statusTranslations).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Pedido de Ajuda</label>
          <Select value={helpNeededFilter} onValueChange={(value: 'all' | 'yes' | 'no') => setHelpNeededFilter(value)}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                <SelectValue placeholder="Filtrar pedidos de ajuda" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Registros</SelectItem>
              <SelectItem value="yes">Com Pedido de Ajuda</SelectItem>
              <SelectItem value="no">Sem Pedido de Ajuda</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}