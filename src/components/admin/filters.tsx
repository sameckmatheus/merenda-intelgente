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

import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="w-full bg-white shadow-sm border-none">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end">

          {/* Period Selection - Spans 4 columns */}
          <div className="lg:col-span-4 space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
              <CalendarIcon className="w-3 h-3" /> Período
            </label>
            <div className="flex flex-col gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-slate-50 border-slate-200 hover:bg-slate-100 transition-colors h-11 rounded-2xl", !date && !dateRange && "text-slate-500")}>
                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                    <span>{getPeriodLabel()}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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

              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <Button variant="ghost" size="sm" className={cn("flex-1 text-xs h-9 rounded-xl", filterType === 'day' && "bg-white text-blue-600 shadow-sm font-medium")} onClick={() => safeSetFilterType('day')}>Dia</Button>
                <Button variant="ghost" size="sm" className={cn("flex-1 text-xs h-9 rounded-xl", filterType === 'week' && "bg-white text-blue-600 shadow-sm font-medium")} onClick={() => safeSetFilterType('week')}>Semana</Button>
                <Button variant="ghost" size="sm" className={cn("flex-1 text-xs h-9 rounded-xl", filterType === 'month' && "bg-white text-blue-600 shadow-sm font-medium")} onClick={() => safeSetFilterType('month')}>Mês</Button>
              </div>
            </div>
          </div>

          {/* School Selection - Spans 3 columns */}
          <div className="lg:col-span-3 space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
              <Building className="w-3 h-3" /> Escola
            </label>
            <Combobox
              options={[
                { value: "all", label: "Todas as Escolas" },
                ...safeSchools.map(s => ({ value: s, label: s }))
              ]}
              value={selectedSchool}
              onChange={safeSetSelectedSchool}
              placeholder="Todas as Escolas"
              searchPlaceholder="Buscar escola..."
              modalTitle="Filtrar por Escola"
              className="h-11 bg-slate-50 border-slate-200"
            />
          </div>

          {/* Status Selection - Spans 3 columns */}
          <div className="lg:col-span-3 space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
              <MessageSquare className="w-3 h-3" /> Status
            </label>
            <Combobox
              options={[
                { value: "all", label: "Todos os Status" },
                ...Object.entries(safeStatusTranslations).map(([k, v]) => ({ value: k, label: v }))
              ]}
              value={selectedStatus}
              onChange={safeSetSelectedStatus}
              placeholder="Todos os Status"
              searchPlaceholder="Buscar status..."
              modalTitle="Filtrar por Status"
              className="h-11 bg-slate-50 border-slate-200"
            />
          </div>

          {/* Help Filter - Spans 2 columns */}
          <div className="lg:col-span-2 space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
              <HelpCircle className="w-3 h-3" /> Ajuda
            </label>
            <Select value={helpNeededFilter} onValueChange={(value: 'all' | 'yes' | 'no') => safeSetHelpNeededFilter(value)}>
              <SelectTrigger className="bg-slate-50 border-slate-200 h-11">
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="yes">Com Pedido</SelectItem>
                <SelectItem value="no">Sem Pedido</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}