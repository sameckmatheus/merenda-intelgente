"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Utensils, Calendar, ChefHat, Search, FileText } from 'lucide-react';
import { cn } from "@/lib/utils";

// Types (same as admin)
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

// Initial Data (same as admin)
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
        status: "active",
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
    active: { label: "Em Vigor", text: "bg-green-600 text-white border-green-700" },
    draft: { label: "Rascunho", text: "bg-amber-500 text-white border-amber-600" },
    archived: { label: "Arquivado", text: "bg-slate-600 text-white border-slate-700" },
};

const MenuCard = ({ menu, onClick }: { menu: Menu, onClick: () => void }) => {
    const status = STATUS_MAP[menu.status];

    return (
        <Card
            className="group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-slate-200 bg-white"
            onClick={onClick}
        >
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <Badge className={cn("font-bold px-3 py-1 border-0 rounded-xl", CATEGORY_COLORS[menu.category])}>
                        {menu.category}
                    </Badge>
                    <div className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5", status.text)}>
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        {status.label}
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800 leading-tight">{menu.title}</h3>
                    <p className="flex items-center gap-2 mt-2 text-slate-500 font-medium text-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(menu.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - {new Date(menu.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </p>
                </div>
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
            </div>
        </Card>
    );
};

const MenuDetailsSheet = ({ menu, isOpen, onClose }: { menu: Menu | null, isOpen: boolean, onClose: () => void }) => {
    if (!menu) return null;

    return (
        <Sheet open={isOpen} onOpenChange={(o) => !o && onClose()}>
            <SheetContent className="top-[5rem] h-[calc(100vh-5rem)] z-[50] sm:max-w-xl w-full flex flex-col p-0 bg-[#eeeeee] border-l shadow-2xl">
                <SheetHeader className="p-6 bg-white border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge className={cn("font-medium border-0", CATEGORY_COLORS[menu.category])}>
                            {menu.category}
                        </Badge>
                        <Badge variant="outline" className="text-slate-500 bg-slate-50">
                            {new Date(menu.startDate).getFullYear()}
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Somente Leitura
                        </Badge>
                    </div>
                    <SheetTitle className="text-2xl font-bold text-slate-800">{menu.title}</SheetTitle>
                    <SheetDescription className="text-slate-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Vigência: {new Date(menu.startDate).toLocaleDateString()} até {new Date(menu.endDate).toLocaleDateString()}
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <div className="space-y-6 p-6 pb-20">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Composição Semanal</h3>

                        {menu.items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                <Utensils className="w-8 h-8 text-slate-300 mb-2" />
                                <p className="text-slate-500 font-medium">Este cardápio ainda não possui itens.</p>
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
    );
};

export default function SchoolMenuPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [menus] = useState<Menu[]>(INITIAL_MENUS.filter(m => m.status === 'active'));
    const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const filteredMenus = menus.filter(m =>
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleViewMenu = (menu: Menu) => {
        setSelectedMenu(menu);
        setIsSheetOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="w-full p-4 md:p-8 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-blue-950">Cardápios Ativos</h2>
                        <p className="text-slate-500 mt-1">Visualize os cardápios vigentes para consulta</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-4 py-2 w-fit">
                        <Utensils className="w-4 h-4 mr-2" />
                        Somente Leitura
                    </Badge>
                </div>

                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Buscar cardápios..."
                        className="pl-9 bg-white border-slate-200 shadow-sm focus:ring-blue-500 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredMenus.map((menu) => (
                        <MenuCard
                            key={menu.id}
                            menu={menu}
                            onClick={() => handleViewMenu(menu)}
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
            </main>

            <MenuDetailsSheet
                menu={selectedMenu}
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
            />
        </div>
    );
}
