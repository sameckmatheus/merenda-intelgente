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

interface FiltersProps {
  date?: Date | undefined;
  setDate?: (date: Date | undefined) => void;
  filterType?: 'day' | 'week' | 'month';
  setFilterType?: (type: 'day' | 'week' | 'month') => void;
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
  const safeSetFilterType = setFilterType || (() => { });
  const safeSetSelectedSchool = setSelectedSchool || (() => { });
  const safeSetSelectedStatus = setSelectedStatus || (() => { });
  const safeSetHelpNeededFilter = setHelpNeededFilter || (() => { });
  const safeSchools = schools || [];
  const safeStatusTranslations = statusTranslations || {};
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
              <Button variant={filterType === 'day' ? 'secondary' : 'ghost'} size="sm" onClick={() => safeSetFilterType('day')}>Dia</Button>
              <Button variant={filterType === 'week' ? 'secondary' : 'ghost'} size="sm" onClick={() => safeSetFilterType('week')}>Semana</Button>
              <Button variant={filterType === 'month' ? 'secondary' : 'ghost'} size="sm" onClick={() => safeSetFilterType('month')}>Mês</Button>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>{getPeriodLabel()}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={safeSetDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Escola</label>
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
          <label className="text-sm font-medium">Status</label>
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
          <label className="text-sm font-medium">Pedido de Ajuda</label>
          <Select value={helpNeededFilter} onValueChange={(value: 'all' | 'yes' | 'no') => safeSetHelpNeededFilter(value)}>
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