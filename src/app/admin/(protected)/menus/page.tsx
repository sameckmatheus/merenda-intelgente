"use client"

import { useState } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Utensils, Calendar, ChefHat, Search, Plus, Clock, FileText, ChevronRight, Share2 } from 'lucide-react';
import { cn } from "@/lib/utils";

// Mock Data
type MenuItem = {
  day: string;
  meals: {
    type: string;
    description: string;
    nutrition: string;
  }[];
};

type Menu = {
  id: string;
  title: string;
  category: "Regular" | "Creche" | "EJA" | "Integral";
  startDate: string;
  endDate: string;
  status: "active" | "draft" | "archived";
  items: MenuItem[];
};

const MOCK_MENUS: Menu[] = [
  {
    id: "1",
    title: "Cardápio Regular - Semana 2/Abril",
    category: "Regular",
    startDate: "2025-04-07",
    endDate: "2025-04-11",
    status: "active",
    items: [
      {
        day: "Segunda-feira",
        meals: [
          { type: "Lanche Manhã", description: "Leite com cacau e biscoito salgado", nutrition: "Carb: 30g, Prot: 8g" },
          { type: "Almoço", description: "Arroz, Feijão, Frango cozido com batata, Salada de Alface", nutrition: "Carb: 45g, Prot: 25g" },
        ]
      },
      {
        day: "Terça-feira",
        meals: [
          { type: "Lanche Manhã", description: "Iogurte com cereais", nutrition: "Carb: 25g, Prot: 6g" },
          { type: "Almoço", description: "Macarronada à bolonhesa, Fruta da época", nutrition: "Carb: 50g, Prot: 20g" },
        ]
      },
      {
        day: "Quarta-feira",
        meals: [
          { type: "Lanche Manhã", description: "Pão com manteiga e suco de caju", nutrition: "Carb: 35g, Prot: 5g" },
          { type: "Almoço", description: "Arroz de leite, Carne moída refogada, Legumes no vapor", nutrition: "Carb: 40g, Prot: 22g" },
        ]
      },
      {
        day: "Quinta-feira",
        meals: [
          { type: "Lanche Manhã", description: "Mingau de aveia com canela", nutrition: "Carb: 28g, Prot: 7g" },
          { type: "Almoço", description: "Feijoada simples (feijão preto, carnes magras), Arroz, Couve refogada, Laranja", nutrition: "Carb: 55g, Prot: 30g" },
        ]
      },
      {
        day: "Sexta-feira",
        meals: [
          { type: "Lanche Manhã", description: "Vitaminada de banana com aveia", nutrition: "Carb: 32g, Prot: 6g" },
          { type: "Almoço", description: "Peixe ao molho de coco, Pirão, Arroz, Salada de tomate", nutrition: "Carb: 40g, Prot: 28g" },
        ]
      }
    ]
  },
  {
    id: "2",
    title: "Cardápio Creche - Berçário",
    category: "Creche",
    startDate: "2025-04-07",
    endDate: "2025-04-11",
    status: "active",
    items: [
      { day: "Segunda-feira", meals: [{ type: "Colação", description: "Fruta amassadinha (Banana)", nutrition: "-" }] }
    ]
  },
  {
    id: "3",
    title: "Cardápio EJA - Noturno",
    category: "EJA",
    startDate: "2025-04-07",
    endDate: "2025-04-11",
    status: "draft",
    items: []
  },
  {
    id: "4",
    title: "Cardápio Março - Final",
    category: "Regular",
    startDate: "2025-03-31",
    endDate: "2025-04-04",
    status: "archived",
    items: []
  }
];

const CATEGORY_COLORS = {
  Regular: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  Creche: "bg-pink-100 text-pink-700 hover:bg-pink-200",
  EJA: "bg-purple-100 text-purple-700 hover:bg-purple-200",
  Integral: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
};

const STATUS_MAP = {
  active: { label: "Em Vigor", class: "bg-emerald-500", text: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  draft: { label: "Rascunho", class: "bg-amber-500", text: "text-amber-700 bg-amber-50 border-amber-200" },
  archived: { label: "Arquivado", class: "bg-slate-500", text: "text-slate-700 bg-slate-50 border-slate-200" },
};

const CARD_GRADIENTS = [
  "from-blue-500/5 to-indigo-500/5 hover:from-blue-500/10 hover:to-indigo-500/10 border-blue-100",
  "from-emerald-500/5 to-teal-500/5 hover:from-emerald-500/10 hover:to-teal-500/10 border-emerald-100",
  "from-purple-500/5 to-pink-500/5 hover:from-purple-500/10 hover:to-pink-500/10 border-purple-100",
];

const MenuCard = ({ menu, onClick, index }: { menu: Menu, onClick: () => void, index: number }) => {
  const status = STATUS_MAP[menu.status];
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-0 bg-gradient-to-br",
        gradient
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <Badge className={cn("font-medium border-0", CATEGORY_COLORS[menu.category])}>
            {menu.category}
          </Badge>
          <div className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5", status.text)}>
            <div className={cn("w-1.5 h-1.5 rounded-full", status.class)} />
            {status.label}
          </div>
        </div>
        <CardTitle className="text-lg font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
          {menu.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-2 mt-1">
          <Calendar className="w-3 h-3" />
          {new Date(menu.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - {new Date(menu.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-1">
            <Utensils className="w-4 h-4 text-slate-400" />
            <span>{menu.items.length > 0 ? `${menu.items.length} dias` : 'Sem itens'}</span>
          </div>
          {menu.category === 'Regular' && (
            <div className="flex items-center gap-1">
              <ChefHat className="w-4 h-4 text-slate-400" />
              <span>Padrão Seduc</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0 pb-4">
        <div className="w-full flex items-center justify-between text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Visualizar cardápio</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </CardFooter>
    </Card>
  )
}

const MenuDetailsSheet = ({ menu, isOpen, onClose }: { menu: Menu | null, isOpen: boolean, onClose: () => void }) => {
  if (!menu) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-xl w-full flex flex-col p-0 bg-slate-50/50 backdrop-blur-3xl">
        <SheetHeader className="p-6 bg-white border-b border-slate-100">
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

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
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

        <div className="p-4 bg-white border-t border-slate-100">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/10">
            Editar Cardápio
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function AdminMenus() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);

  const filteredMenus = MOCK_MENUS.filter(m =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const newAnalysisButton = (
    <Button
        variant="default"
        size="sm"
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-600/20 rounded-xl transition-all hover:scale-105 active:scale-95"
      >
      <Plus className="w-4 h-4 mr-2" /> Novo Cardápio
    </Button>
  );

  return (
    <AdminLayout
      title="Gestão de Cardápios"
      description="Planejamento e distribuição da alimentação escolar."
      actions={newAnalysisButton}
    >
      <div className="space-y-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar cardápios..."
            className="pl-9 bg-white border-slate-200 shadow-sm focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMenus.map((menu, index) => (
            <MenuCard
              key={menu.id}
              menu={menu}
              index={index}
              onClick={() => setSelectedMenu(menu)}
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
        isOpen={!!selectedMenu}
        onClose={() => setSelectedMenu(null)}
      />
    </AdminLayout>
  );
}
