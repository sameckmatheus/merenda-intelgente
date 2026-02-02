"use client";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Building, Calendar as CalendarIcon, MessageSquare, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

import { DateRange } from "react-day-picker";

interface FiltersProps {
  date?: Date | undefined;
  setDate?: (date: Date | undefined) => void;
  dateRange?: DateRange | undefined;
  setDateRange?: (range: DateRange | undefined) => void;
  filterType?: 'day' | 'week' | 'month' | 'year' | 'custom';
  setFilterType?: (type: 'day' | 'week' | 'month' | 'year' | 'custom') => void;
  selectedSchool?: string;
  setSelectedSchool?: (school: string) => void;
  selectedStatus?: string;
  setSelectedStatus?: (status: string) => void;
  helpNeededFilter?: 'all' | 'yes' | 'no';
  setHelpNeededFilter?: (filter: 'all' | 'yes' | 'no') => void;
  schools?: string[];
  statusTranslations?: { [key: string]: string };
}

export function Filters({
  date,
  setDate,
  dateRange,
  setDateRange,
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
  // Safe handlers
  const safeSetDate = setDate || (() => { });
  const safeSetDateRange = setDateRange || (() => { });
  const safeSetFilterType = setFilterType || (() => { });
  const safeSetSelectedSchool = setSelectedSchool || (() => { });
  const safeSetSelectedStatus = setSelectedStatus || (() => { });
  const safeSetHelpNeededFilter = setHelpNeededFilter || (() => { });
  const safeSchools = schools || [];
  const safeStatusTranslations = statusTranslations || {};
  const getPeriodLabel = () => {
    if (filterType === 'custom') {
      if (dateRange?.from) {
        if (dateRange.to) {
          return `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`;
        }
        return format(dateRange.from, 'dd/MM/yyyy');
      }
      return "Selecione o período";
    }

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
      case 'year':
        return format(date, "yyyy", { locale: ptBR });
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-blue-100 shadow-lg shadow-blue-900/5 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Período</label>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg overflow-x-auto">
              <Button variant={filterType === 'day' ? 'secondary' : 'ghost'} size="sm" className={cn("flex-1 rounded-md text-xs px-2", filterType === 'day' && "shadow-sm text-blue-600 font-semibold bg-white")} onClick={() => safeSetFilterType('day')}>Dia</Button>
              <Button variant={filterType === 'week' ? 'secondary' : 'ghost'} size="sm" className={cn("flex-1 rounded-md text-xs px-2", filterType === 'week' && "shadow-sm text-blue-600 font-semibold bg-white")} onClick={() => safeSetFilterType('week')}>Semana</Button>
              <Button variant={filterType === 'month' ? 'secondary' : 'ghost'} size="sm" className={cn("flex-1 rounded-md text-xs px-2", filterType === 'month' && "shadow-sm text-blue-600 font-semibold bg-white")} onClick={() => safeSetFilterType('month')}>Mês</Button>
              <Button variant={filterType === 'year' ? 'secondary' : 'ghost'} size="sm" className={cn("flex-1 rounded-md text-xs px-2", filterType === 'year' && "shadow-sm text-blue-600 font-semibold bg-white")} onClick={() => safeSetFilterType('year')}>Ano</Button>
              <Button variant={filterType === 'custom' ? 'secondary' : 'ghost'} size="sm" className={cn("flex-1 rounded-md text-xs px-2", filterType === 'custom' && "shadow-sm text-blue-600 font-semibold bg-white")} onClick={() => safeSetFilterType('custom')}>Período</Button>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-white border-slate-200", !date && !dateRange && "text-slate-500")}>
                  <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                  <span>{getPeriodLabel()}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                {filterType === 'custom' ? (
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={safeSetDateRange}
                    initialFocus
                  />
                ) : (
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={safeSetDate}
                    initialFocus
                  />
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Escola</label>
          <Combobox
            options={[
              { value: "all", label: "Todas as Escolas" },
              ...safeSchools.map(s => ({ value: s, label: s }))
            ]}
            value={selectedSchool}
            onChange={safeSetSelectedSchool}
            placeholder="Selecione a escola..."
            searchPlaceholder="Procurar escola..."
            modalTitle="Selecione a Escola"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Status</label>
          <Combobox
            options={[
              { value: "all", label: "Todos os Status" },
              ...Object.entries(safeStatusTranslations).map(([k, v]) => ({ value: k, label: v }))
            ]}
            value={selectedStatus}
            onChange={safeSetSelectedStatus}
            placeholder="Selecione o status..."
            searchPlaceholder="Procurar status..."
            modalTitle="Selecione o Status"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Pedido de Ajuda</label>
          <Select value={helpNeededFilter} onValueChange={(value: 'all' | 'yes' | 'no') => safeSetHelpNeededFilter(value)}>
            <SelectTrigger className="bg-white border-slate-200">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-amber-500" />
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