"use client"

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Utensils, Calendar, ChefHat, Search, Plus, FileText, ChevronRight, Share2, Save, X, Trash2, Pencil } from 'lucide-react';
import { cn } from "@/lib/utils";

// Types
type MealItem = {
  type: string;
  description: string;
  nutrition: string;
};

type DailyMenu = {
  day: string;
  meals: MealItem[];
};

type Menu = {
  id: string;
  title: string;
  category: "Regular" | "Creche" | "EJA" | "Integral";
  startDate: string;
  endDate: string;
  status: "active" | "draft" | "archived";
  items: DailyMenu[];
};

const CATEGORIES = ["Regular", "Creche", "EJA", "Integral"] as const;
const WEEKDAYS = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira"];

const MEAL_TYPES_BY_CATEGORY: Record<string, string[]> = {
  Regular: ["Lanche (Manhã/Tarde)"],
  Creche: ["Desjejum", "Colação", "Almoço", "Lanche", "Jantar"],
  EJA: ["Jantar"],
  Integral: ["Desjejum", "Almoço", "Lanche"],
};

// Initial Data based on 2026 Images
const INITIAL_MENUS: Menu[] = [
  {
    id: "1",
    title: "Cardápio 2026 - Fundamental I e II + Integral",
    category: "Regular",
    startDate: "2026-02-01",
    endDate: "2026-12-15",
    status: "active",
    items: [
      {
        day: "Segunda-feira",
        meals: [{ type: "Lanche (Manhã/Tarde)", description: "Cuscuz + ovo ou carne moída. Nota: Fritar o ovo com óleo para lactose.", nutrition: "Kcal: 459, PTN: 17g" }]
      },
      {
        day: "Terça-feira",
        meals: [{ type: "Lanche (Manhã/Tarde)", description: "Tubérculo + fígado bovino acebolado.", nutrition: "Kcal: 477, PTN: 23g" }]
      },
      {
        day: "Quarta-feira",
        meals: [{ type: "Lanche (Manhã/Tarde)", description: "1ª Quiz: Pão com carne moída. 2ª Quiz: Bolo ou Pão com carne.", nutrition: "Kcal: 450, PTN: 16g" }]
      },
      {
        day: "Quinta-feira",
        meals: [{ type: "Lanche (Manhã/Tarde)", description: "Arroz com cenoura + macarrão + carne guisada em cubos.", nutrition: "Kcal: 475, PTN: 22g" }]
      },
      {
        day: "Sexta-feira",
        meals: [{ type: "Lanche (Manhã/Tarde)", description: "Canja + Bolacha salgada.", nutrition: "Kcal: 477, PTN: 29g" }]
      }
    ]
  },
  {
    id: "2",
    title: "Cardápio 2026 - Educação Infantil",
    category: "Integral",
    startDate: "2026-02-01",
    endDate: "2026-12-15",
    status: "active",
    items: [
      {
        day: "Segunda-feira",
        meals: [
          { type: "Desjejum", description: "Flapê de polpa de fruta.", nutrition: "" },
          { type: "Lanche", description: "Cuscuz com ovo mexido ou carne moída.", nutrition: "" }
        ]
      },
      {
        day: "Terça-feira",
        meals: [
          { type: "Desjejum", description: "Leite com chocolate.", nutrition: "" },
          { type: "Lanche", description: "Tubérculo + fígado bovino ao molho.", nutrition: "" }
        ]
      },
      {
        day: "Quarta-feira",
        meals: [
          { type: "Desjejum", description: "Vitamina de banana ou fruta.", nutrition: "" },
          { type: "Lanche", description: "Bolo ou Pão com carne moída + Vinagrete.", nutrition: "" }
        ]
      },
      {
        day: "Quinta-feira",
        meals: [
          { type: "Desjejum", description: "Flapê ou fruta com mel.", nutrition: "" },
          { type: "Lanche", description: "Arroz com cenoura + macarrão + carne guisada.", nutrition: "" }
        ]
      },
      {
        day: "Sexta-feira",
        meals: [
          { type: "Desjejum", description: "Leite com chocolate.", nutrition: "" },
          { type: "Lanche", description: "Canja + bolacha salgada.", nutrition: "" }
        ]
      }
    ]
  },
  {
    id: "3",
    title: "Cardápio 2026 - EJA (Jantar)",
    category: "EJA",
    startDate: "2026-02-01",
    endDate: "2026-12-15",
    status: "draft",
    items: [
      {
        day: "Segunda-feira",
        meals: [{ type: "Jantar", description: "Cuscuz com ovo mexido ou carne moída.", nutrition: "Kcal: 459" }]
      },
      {
        day: "Terça-feira",
        meals: [{ type: "Jantar", description: "Tubérculo com fígado acebolado.", nutrition: "Kcal: 477" }]
      },
      {
        day: "Quarta-feira",
        meals: [{ type: "Jantar", description: "Pão com carne moída + Vinagrete.", nutrition: "Kcal: 477" }]
      },
      {
        day: "Quinta-feira",
        meals: [{ type: "Jantar", description: "Canja + Bolacha salgada.", nutrition: "Kcal: 475" }]
      },
      {
        day: "Sexta-feira",
        meals: [{ type: "Jantar", description: "Arroz com cenoura + macarrão + carne guisada.", nutrition: "Kcal: 476" }]
      }
    ]
  },
  {
    id: "4",
    title: "Cardápio 2026 - Creche (3 a 5 anos)",
    category: "Creche",
    startDate: "2026-02-01",
    endDate: "2026-12-15",
    status: "active",
    items: [
      {
        day: "Segunda-feira",
        meals: [
          { type: "Desjejum", description: "Cuscuz com ovo mexido ou com leite", nutrition: "Kcal: 105" },
          { type: "Almoço", description: "Baião de dois + carne bovina + salada crua", nutrition: "Kcal: 268" },
          { type: "Jantar", description: "Risoto de frango ou arroz de forno de frango", nutrition: "Kcal: 273" },
        ]
      },
      {
        day: "Terça-feira",
        meals: [
          { type: "Desjejum", description: "Tubérculo com ovo ou creme de macaxeira com carne moída", nutrition: "Kcal: 100" },
          { type: "Almoço", description: "Feijão com legumes em cubinhos + carne bovina guisada", nutrition: "Kcal: 272" },
          { type: "Jantar", description: "Canja ou sopa com bolacha salgada", nutrition: "Kcal: 270" },
        ]
      },
      {
        day: "Quarta-feira",
        meals: [
          { type: "Desjejum", description: "Bolo + suco ou cuscuz com leite", nutrition: "Kcal: 230" },
          { type: "Almoço", description: "Pirão de peixe + arroz branco + legumes cozidos", nutrition: "Kcal: 270" },
          { type: "Jantar", description: "Pão com carne moída + vinagrete", nutrition: "Kcal: 268" },
        ]
      },
      {
        day: "Quinta-feira",
        meals: [
          { type: "Desjejum", description: "Pão com carne moída e fruta", nutrition: "Kcal: 245" },
          { type: "Almoço", description: "Arroz colorido + frango em cubos ao molho + salada", nutrition: "Kcal: 289" },
          { type: "Jantar", description: "Tubérculo com fígado acebolado", nutrition: "Kcal: 270" },
        ]
      },
      {
        day: "Sexta-feira",
        meals: [
          { type: "Desjejum", description: "Papa de aveia ou Amido", nutrition: "Kcal: 210" },
          { type: "Almoço", description: "Feijão + purê + arroz com cenoura + frango guisado", nutrition: "Kcal: 382" },
          { type: "Jantar", description: "Torta salgada de carne moída + Arroz com cenoura", nutrition: "Kcal: 323" },
        ]
      }
    ]
  }
];

const CATEGORY_COLORS = {
  Regular: "bg-blue-600 text-white shadow-md shadow-blue-600/20",
  Creche: "bg-pink-600 text-white shadow-md shadow-pink-600/20",
  EJA: "bg-purple-600 text-white shadow-md shadow-purple-600/20",
  Integral: "bg-emerald-600 text-white shadow-md shadow-emerald-600/20",
};

const STATUS_MAP = {
  active: { label: "Em Vigor", class: "bg-green-500", text: "bg-green-600 text-white border-green-700 shadow-md shadow-green-600/20" },
  draft: { label: "Rascunho", class: "bg-amber-400", text: "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20" },
  archived: { label: "Arquivado", class: "bg-slate-400", text: "bg-slate-600 text-white border-slate-700 shadow-md shadow-slate-600/20" },
};

const CARD_GRADIENTS = [
  "from-blue-500/5 to-indigo-500/5 hover:from-blue-500/10 hover:to-indigo-500/10 border-blue-100",
  "from-emerald-500/5 to-teal-500/5 hover:from-emerald-500/10 hover:to-teal-500/10 border-emerald-100",
  "from-purple-500/5 to-pink-500/5 hover:from-purple-500/10 hover:to-pink-500/10 border-purple-100",
];

// Components
// Components
const MenuCard = ({ menu, onClick, onEdit, onDelete }: { menu: Menu, onClick: () => void, onEdit: (e: React.MouseEvent) => void, onDelete: (e: React.MouseEvent) => void }) => {
  const status = STATUS_MAP[menu.status];

  return (
    <Card
      className="group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-slate-200 bg-white"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center mb-3">
          <Badge className={cn("font-bold px-3 py-1 border-0 rounded-xl", CATEGORY_COLORS[menu.category])}>
            {menu.category}
          </Badge>
          <div className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5", status.text)}>
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {status.label}
          </div>
        </div>
        <CardTitle className="text-xl font-bold text-slate-800 leading-tight">
          {menu.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-2 mt-2 text-slate-500 font-medium text-sm">
          <Calendar className="w-4 h-4 text-slate-400" />
          {new Date(menu.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - {new Date(menu.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-slate-600 font-medium">
          <div className="flex items-center gap-1.5">
            <Utensils className="w-4 h-4 text-slate-400" />
            <span>{menu.items.length > 0 ? `${menu.items.length} dias` : 'Sem itens'}</span>
          </div>
          {menu.category === 'Regular' && (
            <div className="flex items-center gap-1.5">
              <ChefHat className="w-4 h-4 text-slate-400" />
              <span>Padrão Seduc</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0 pb-4 flex justify-between gap-2 border-t px-6 py-4 bg-slate-50/50">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
          onClick={onEdit}
        >
          <Pencil className="w-3.5 h-3.5 mr-2" />
          Editar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 border border-transparent transition-colors"
          onClick={onDelete}
        >
          <Trash2 className="w-3.5 h-3.5 mr-2" />
          Excluir
        </Button>
      </CardFooter>
    </Card>
  )
}

const MenuDetailsSheet = ({ menu, isOpen, onClose }: { menu: Menu | null, isOpen: boolean, onClose: () => void }) => {
  if (!menu) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && onClose()}>
      {/* 
          ADJUSTMENTS: 
          - top-[5rem]: Positions modal below the 5rem/h-20 header.
          - h-[calc(100vh-5rem)]: Ensures it explicitly fills only the remaining height, preventing top cutoff.
          - z-[50]: Lower than header (z-[60]), so header stays accessible/visible if needed (visual hierarchy).
          - overflow-hidden: Prevents double scrollbars.
      */}
      <SheetContent className="top-[5rem] h-[calc(100vh-5rem)] z-[50] sm:max-w-xl w-full flex flex-col p-0 bg-[#eeeeee] border-l shadow-2xl data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right">
        <SheetHeader className="p-6 bg-white border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={cn("font-medium border-0", CATEGORY_COLORS[menu.category])}>
              {menu.category}
            </Badge>
            <Badge variant="outline" className="text-slate-500 bg-slate-50">
              {new Date(menu.startDate).getFullYear()}
            </Badge>
          </div>
          <SheetTitle className="text-2xl font-bold text-slate-800">{menu.title}</SheetTitle>
          <SheetDescription className="text-slate-500 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Vigência: {new Date(menu.startDate).toLocaleDateString()} até {new Date(menu.endDate).toLocaleDateString()}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {/* Added pb-20 to ensure bottom content isn't cut off by screen edges */}
          <div className="space-y-6 p-6 pb-20">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Composição Semanal</h3>
              <Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar PDF
              </Button>
            </div>

            {menu.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <Utensils className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-slate-500 font-medium">Este cardápio ainda não possui itens.</p>
                <Button variant="link" className="text-blue-600">Editar rascunho</Button>
              </div>
            ) : (
              <div className="space-y-6">
                {menu.items.map((item, idx) => (
                  <div key={idx} className="relative pl-6 border-l-2 border-blue-100 last:border-0 pb-6 last:pb-0">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-100 border-2 border-white ring-1 ring-blue-500/20"></div>
                    <div className="mb-3">
                      <h4 className="text-lg font-bold text-slate-800">{item.day}</h4>
                    </div>
                    <div className="space-y-3">
                      {item.meals.map((meal, mIdx) => (
                        <div key={mIdx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-0">
                              {meal.type}
                            </Badge>
                          </div>
                          <p className="text-slate-600 leading-relaxed text-sm">
                            {meal.description}
                          </p>
                          {meal.nutrition && (
                            <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-2 text-xs text-slate-400">
                              <FileText className="w-3 h-3" />
                              {meal.nutrition}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

const CreateMenuModal = ({ isOpen, onClose, onSave, menuToEdit }: { isOpen: boolean, onClose: () => void, onSave: (menu: Menu) => void, menuToEdit?: Menu | null }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Menu>>({
    title: "",
    category: "Regular",
    startDate: "",
    endDate: "",
    status: "draft",
    items: WEEKDAYS.map(day => ({ day, meals: [] }))
  });

  // Load menu data when editing
  useState(() => {
    if (menuToEdit) {
      setFormData(JSON.parse(JSON.stringify(menuToEdit)));
    } else {
      setFormData({
        title: "",
        category: "Regular",
        startDate: "",
        endDate: "",
        status: "draft",
        items: WEEKDAYS.map(day => ({ day, meals: [] }))
      });
    }
  });

  // Effect to update form when menuToEdit changes (for reopening modal)
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (menuToEdit) {
        setFormData(JSON.parse(JSON.stringify(menuToEdit)));
      } else {
        setFormData({
          title: "",
          category: "Regular",
          startDate: "",
          endDate: "",
          status: "draft",
          items: WEEKDAYS.map(day => ({ day, meals: [] }))
        });
      }
    }
  }, [isOpen, menuToEdit]);

  const handleBasicInfoChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMealChange = (dayIndex: number, mealType: string, field: 'description' | 'nutrition', value: string) => {
    const newItems = [...(formData.items || [])];
    const dayItem = newItems[dayIndex];
    if (!dayItem) return; // Guard clause

    const mealIndex = dayItem.meals.findIndex(m => m.type === mealType);

    if (mealIndex >= 0) {
      dayItem.meals[mealIndex] = { ...dayItem.meals[mealIndex], [field]: value };
    } else {
      const newMeal: any = { type: mealType, description: "", nutrition: "" };
      newMeal[field] = value;
      dayItem.meals.push(newMeal);
    }

    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const currentMealTypes = MEAL_TYPES_BY_CATEGORY[formData.category as string] || [];

  const handleSave = () => {
    if (formData.title && formData.startDate && formData.endDate) {
      onSave({
        ...formData,
        id: menuToEdit ? menuToEdit.id : Math.random().toString(36).substr(2, 9),
      } as Menu);
      onClose();
    }
  };

  const getMealValue = (dayIndex: number, mealType: string, field: 'description' | 'nutrition') => {
    const dayItem = formData.items?.[dayIndex];
    const meal = dayItem?.meals.find(m => m.type === mealType);
    return meal ? meal[field] : "";
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-xl font-bold">
            {step === 1 ? (menuToEdit ? "Editar Cardápio" : "Novo Cardápio") + " - Informações Básicas" : "Planejamento das Refeições"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? "Defina o título, categoria e período de vigência." : "Preencha o cardápio para cada dia da semana."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 ? (
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título do Cardápio</Label>
                <Input
                  id="title"
                  placeholder="Ex: Cardápio Abril 2026 - Fundamental"
                  value={formData.title}
                  onChange={(e) => handleBasicInfoChange("title", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => handleBasicInfoChange("category", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Status Inicial</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) => handleBasicInfoChange("status", val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="active">Em Vigor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start">Data Início</Label>
                  <Input
                    id="start"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleBasicInfoChange("startDate", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end">Data Fim</Label>
                  <Input
                    id="end"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleBasicInfoChange("endDate", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="Segunda-feira" className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto">
                {WEEKDAYS.map(day => (
                  <TabsTrigger key={day} value={day}>{day}</TabsTrigger>
                ))}
              </TabsList>
              {WEEKDAYS.map((day, dayIndex) => (
                <TabsContent key={day} value={day} className="space-y-4 mt-4">
                  <div className="space-y-6">
                    {currentMealTypes.map((mealType) => (
                      <div key={mealType} className="space-y-2 border p-4 rounded-lg bg-slate-50">
                        <Label className="text-base font-semibold text-blue-700">{mealType}</Label>
                        <div className="grid gap-2">
                          <Label className="text-xs text-slate-500">Descrição da Refeição</Label>
                          <Textarea
                            placeholder={`O que será servido no ${mealType}?`}
                            className="bg-white min-h-[60px]"
                            value={getMealValue(dayIndex, mealType, 'description')}
                            onChange={(e) => handleMealChange(dayIndex, mealType, 'description', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-xs text-slate-500">Informação Nutricional (Opcional)</Label>
                          <Input
                            placeholder="Ex: Kcal: 300, PTN: 10g..."
                            className="bg-white"
                            value={getMealValue(dayIndex, mealType, 'nutrition')}
                            onChange={(e) => handleMealChange(dayIndex, mealType, 'nutrition', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>

        <DialogFooter className="p-6 border-t bg-slate-50">
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)} className="mr-auto">
              Voltar
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          {step === 1 ? (
            <Button onClick={() => setStep(2)} disabled={!formData.title}>
              Próximo: Refeições
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              Salvar Cardápio
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function AdminMenus() {
  const [searchTerm, setSearchTerm] = useState("");
  const [menus, setMenus] = useState<Menu[]>(INITIAL_MENUS);

  // Independent state for Sheet to allow animations
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [menuToEdit, setMenuToEdit] = useState<Menu | null>(null);

  const filteredMenus = menus.filter(m =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveMenu = (savedMenu: Menu) => {
    if (menuToEdit) {
      // Update existing
      setMenus(menus.map(m => m.id === savedMenu.id ? savedMenu : m));
      setMenuToEdit(null);
    } else {
      // Create new
      setMenus([savedMenu, ...menus]);
    }
  };

  const handleDeleteMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir este cardápio?")) {
      setMenus(menus.filter(m => m.id !== id));
    }
  };

  const handleEditMenu = (menu: Menu, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuToEdit(menu);
    setIsCreateModalOpen(true);
  };

  const handleCreateNew = () => {
    setMenuToEdit(null);
    setIsCreateModalOpen(true);
  }

  const handleViewMenu = (menu: Menu) => {
    setSelectedMenu(menu);
    setIsSheetOpen(true);
  };

  return (
    <AdminLayout
      title="Gestão de Cardápios"
      description="Planejamento e distribuição da alimentação escolar."
    >
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar cardápios..."
              className="pl-9 bg-white border-slate-200 shadow-sm focus:ring-blue-500 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={handleCreateNew}
            className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Cardápio
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMenus.map((menu, index) => (
            <MenuCard
              key={menu.id}
              menu={menu}
              onClick={() => handleViewMenu(menu)}
              onEdit={(e) => handleEditMenu(menu, e)}
              onDelete={(e) => handleDeleteMenu(menu.id, e)}
            />
          ))}
        </div>

        {filteredMenus.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-slate-300" />
            </div>
            <h3 className="text-slate-800 font-medium mb-1">Nenhum cardápio encontrado</h3>
            <p className="text-slate-500 text-sm">Tente buscar por outro termo.</p>
          </div>
        )}
      </div>

      <MenuDetailsSheet
        menu={selectedMenu}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      />

      <CreateMenuModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveMenu}
        menuToEdit={menuToEdit}
      />
    </AdminLayout>
  );
}
