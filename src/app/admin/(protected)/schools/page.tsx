"use client"

import { useState, useMemo, useEffect } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users, Clock, Calendar, Search, Award, BarChart, Package, Check, AlertCircle, Plus, Minus, Filter, Save, X, Pencil, Trash2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { SCHOOLS_LIST } from "@/lib/constants";

const schoolsList = SCHOOLS_LIST;


type SchoolSummary = {
  name: string;
  count: number;
};



const SchoolCard = ({ name, count, index, onClick }: { name: string, count: number, index: number, onClick: () => void }) => {
  return (
    <Card
      className="cursor-pointer transition-all duration-300 transform hover:-translate-y-1 bg-white border-slate-200"
      onClick={onClick}
    >
      <CardContent className="p-6 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-2">
          <GraduationCap className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{name}</h3>
          <p className="text-sm text-slate-500 font-medium">{count} registros</p>
        </div>
        <Button variant="secondary" className="w-full mt-2 bg-blue-50 hover:bg-blue-100 text-blue-700">
          Ver Detalhes
        </Button>
      </CardContent>
    </Card>
  );
};

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minQuantity: number;
};

const INITIAL_INVENTORY: InventoryItem[] = [
  // Estocáveis
  { id: "1", name: "Arroz Branco", category: "Estocáveis", quantity: 50, unit: "kg", minQuantity: 20 },
  { id: "2", name: "Arroz Parboilizado", category: "Estocáveis", quantity: 30, unit: "kg", minQuantity: 15 },
  { id: "3", name: "Feijão Carioca", category: "Estocáveis", quantity: 40, unit: "kg", minQuantity: 20 },
  { id: "4", name: "Macarrão Espaguete", category: "Estocáveis", quantity: 35, unit: "kg", minQuantity: 10 },
  { id: "5", name: "Flocão de Milho (Cuscuz)", category: "Estocáveis", quantity: 60, unit: "kg", minQuantity: 25 },
  { id: "6", name: "Óleo de Soja", category: "Estocáveis", quantity: 20, unit: "L", minQuantity: 10 },
  { id: "7", name: "Sal Refinado", category: "Estocáveis", quantity: 15, unit: "kg", minQuantity: 5 },
  { id: "8", name: "Açúcar Cristal", category: "Estocáveis", quantity: 25, unit: "kg", minQuantity: 10 },
  { id: "9", name: "Bolacha Salgada (Cream Cracker)", category: "Estocáveis", quantity: 40, unit: "pct", minQuantity: 15 },
  { id: "10", name: "Leite em Pó", category: "Estocáveis", quantity: 30, unit: "kg", minQuantity: 10 },
  { id: "11", name: "Aveia / Neston", category: "Estocáveis", quantity: 15, unit: "kg", minQuantity: 5 },

  // Proteínas
  { id: "12", name: "Carne Moída", category: "Proteínas", quantity: 20, unit: "kg", minQuantity: 10 },
  { id: "13", name: "Peito de Frango", category: "Proteínas", quantity: 25, unit: "kg", minQuantity: 10 },
  { id: "14", name: "Frango em Cubos", category: "Proteínas", quantity: 25, unit: "kg", minQuantity: 10 },
  { id: "15", name: "Fígado Bovino", category: "Proteínas", quantity: 10, unit: "kg", minQuantity: 5 },
  { id: "16", name: "Ovos", category: "Proteínas", quantity: 15, unit: "bj", minQuantity: 5 },
  { id: "17", name: "Peixe (Filé)", category: "Proteínas", quantity: 15, unit: "kg", minQuantity: 5 },

  // Hortifruti
  { id: "18", name: "Cenoura", category: "Hortifruti", quantity: 15, unit: "kg", minQuantity: 5 },
  { id: "19", name: "Batata Inglesa", category: "Hortifruti", quantity: 20, unit: "kg", minQuantity: 8 },
  { id: "20", name: "Macaxeira", category: "Hortifruti", quantity: 20, unit: "kg", minQuantity: 8 },
  { id: "21", name: "Legumes Variados (Chuchu, Abóbora)", category: "Hortifruti", quantity: 15, unit: "kg", minQuantity: 5 },
  { id: "22", name: "Banana", category: "Hortifruti", quantity: 12, unit: "pz", minQuantity: 4 },

  // Outros
  { id: "23", name: "Vinagre", category: "Outros", quantity: 10, unit: "L", minQuantity: 2 },
  { id: "24", name: "Colorau / Temperos", category: "Outros", quantity: 5, unit: "kg", minQuantity: 1 },
];

const SchoolInventoryModal = ({ school, isOpen, onClose }: { school: string, isOpen: boolean, onClose: () => void }) => {
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [changedItems, setChangedItems] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState(["Todos", "Estocáveis", "Proteínas", "Hortifruti", "Outros"]);

  // States for Adding/Editing
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newItemData, setNewItemData] = useState<Partial<InventoryItem>>({ category: "Estocáveis", unit: "kg", quantity: 0, minQuantity: 0 });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<{ original: string, new: string } | null>(null);

  const saveGlobalCategories = async (newCategories: string[]) => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryCategories: newCategories })
      });
      setCategories(newCategories);
    } catch (e) {
      console.error("Failed to save global categories", e);
      alert("Erro ao salvar categorias globais.");
    }
  };

  const saveGlobalItems = async (newItems: InventoryItem[]) => {
    try {
      const definitions = newItems.map(({ id, name, category, unit, minQuantity }) => ({ id, name, category, unit, minQuantity }));

      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryItems: definitions })
      });
    } catch (e) {
      console.error("Failed to save global items", e);
      alert("Erro ao salvar itens globais.");
    }
  };

  useEffect(() => {
    if (isOpen && school) {
      const fetchData = async () => {
        try {
          const [schoolRes, globalRes] = await Promise.all([
            fetch(`/api/schools/settings?school=${encodeURIComponent(school)}`),
            fetch('/api/settings')
          ]);

          const schoolData = await schoolRes.json();
          const globalData = await globalRes.json();

          let globalItems: InventoryItem[] = [];
          let localQuantities: Record<string, number> = {};

          // Parse Global Items
          if (globalData.settings) {
            if (globalData.settings.inventoryCategories) {
              setCategories(globalData.settings.inventoryCategories);
            }
            if (globalData.settings.inventoryItems) {
              globalItems = globalData.settings.inventoryItems;
            }
          }

          // AUTO-SEED CHECK
          // If inventory is empty/small, trigger seed and reload
          if (globalItems.length < 5) {
            try {
              console.log("Detecting empty inventory, auto-seeding...");
              await fetch('/api/seed-inventory');
              // Reload global data
              const reloadRes = await fetch('/api/settings');
              const reloadData = await reloadRes.json();
              if (reloadData.settings?.inventoryItems) {
                globalItems = reloadData.settings.inventoryItems;
              }
              if (reloadData.settings?.inventoryCategories) {
                setCategories(reloadData.settings.inventoryCategories);
              }
            } catch (seedErr) {
              console.error("Auto-seed failed", seedErr);
            }
          }

          // Parse Local Quantities
          if (schoolData.settings && schoolData.settings.inventory) {
            const localInv = schoolData.settings.inventory as any[];
            localInv.forEach(i => {
              if (i.id) localQuantities[i.id] = i.quantity || 0;
            });
          }

          // Merge
          const merged = globalItems.map(item => ({
            ...item,
            quantity: localQuantities[item.id] || 0
          }));

          setItems(merged);

        } catch (err) {
          console.error("Failed to fetch data", err);
        }
      };

      fetchData();
    }
  }, [isOpen, school]);

  const handleQuantityChange = (id: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + delta);
        setChangedItems(prevSet => new Set(prevSet).add(id));
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const handleDeleteItem = async (id: string) => {
    const confirmDelete = confirm("Isso irá remover este item de TODAS as escolas. As quantidades locais permanecerão salvas mas o item não aparecerá mais. Continuar?");
    if (confirmDelete) {
      const newItems = items.filter(i => i.id !== id);
      setItems(newItems);
      // Remove from Global Definitions
      await saveGlobalItems(newItems);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSave = async () => {
    try {
      const res = await fetch('/api/schools/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: school,
          inventory: items.map(i => ({ id: i.id, quantity: i.quantity })) // Save only quantities/ids locally
        })
      });

      if (!res.ok) throw new Error("Failed to save");

      setChangedItems(new Set());
      onClose();
    } catch (e) {
      console.error("Error saving inventory", e);
      // Add toast here if available
      alert("Erro ao salvar estoque.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white rounded-2xl border-none outline-none shadow-xl">
        <DialogHeader className="p-6 border-b bg-white shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
                <Package className="w-5 h-5 text-blue-600" />
                Controle de Estoque - {school}
              </DialogTitle>
              <DialogDescription className="mt-1">
                Gerencie os itens disponíveis na despensa da escola.
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-2 text-xs" onClick={() => setIsManagingCategories(true)}>
                <Plus className="w-3 h-3" /> Categoria
              </Button>
              <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
                setNewItemData({ category: "Estocáveis", unit: "kg", quantity: 0, minQuantity: 0 });
                setIsAddingItem(true);
              }}>
                <Plus className="w-3 h-3" /> Item
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 border-b bg-white space-y-4 shrink-0">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar item..."
                className="pl-9 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full sm:w-auto">
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "rounded-full px-4 whitespace-nowrap",
                    selectedCategory === cat ? "bg-slate-800 text-white hover:bg-slate-900" : "text-slate-600 border-slate-200"
                  )}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-slate-50/50 overflow-y-auto">
          <div className="p-4 sm:px-6 sm:py-6 grid grid-cols-1 gap-3">
            {filteredItems.map(item => (
              <div key={item.id} className="bg-white p-3 sm:p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between group hover:border-blue-200 transition-colors gap-3">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0",
                    item.quantity <= item.minQuantity ? "bg-red-100 text-red-600" : "bg-blue-50 text-blue-600"
                  )}>
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700">{item.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Badge variant="outline" className="border-slate-200 text-slate-500 font-normal">{item.category}</Badge>
                      <span>Mínimo: {item.minQuantity} {item.unit}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
                  <div className={cn(
                    "text-sm font-medium mr-2",
                    item.quantity <= item.minQuantity ? "text-red-500 flex items-center gap-1" : "text-emerald-500 hidden"
                  )}>
                    <AlertCircle className="w-3 h-3" /> Baixo Estoque
                  </div>

                  <div className="flex items-center border rounded-lg bg-slate-50">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-l-lg hover:bg-slate-200 text-slate-500"
                      onClick={() => handleQuantityChange(item.id, -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <div className="w-16 text-center font-bold text-slate-700">
                      {item.quantity} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-r-lg hover:bg-slate-200 text-slate-500"
                      onClick={() => handleQuantityChange(item.id, 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>

                  <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-blue-600" onClick={() => {
                    setNewItemData(item);
                    setEditingItem(item);
                    setIsAddingItem(true);
                  }}>
                    <Pencil className="w-4 h-4" />
                  </Button>

                  <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-red-600" onClick={() => handleDeleteItem(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                Nenhum item encontrado.
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-white flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>

        {/* Add/Edit Item Dialog */}
        <Dialog open={isAddingItem} onOpenChange={(open) => {
          if (!open) {
            setIsAddingItem(false);
            setEditingItem(null);
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Editar Item' : 'Novo Item'}</DialogTitle>
              <DialogDescription>Preencha os dados do item de estoque.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nome</Label>
                <Input id="name" value={newItemData.name || ''} onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Categoria</Label>
                <Select value={newItemData.category} onValueChange={(val) => setNewItemData({ ...newItemData, category: val })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c !== 'Todos').map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit" className="text-right">Unidade</Label>
                <Input id="unit" value={newItemData.unit || ''} onChange={(e) => setNewItemData({ ...newItemData, unit: e.target.value })} className="col-span-3" placeholder="kg, L, un..." />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="min" className="text-right">Mínimo</Label>
                <Input id="min" type="number" value={newItemData.minQuantity || 0} onChange={(e) => setNewItemData({ ...newItemData, minQuantity: Number(e.target.value) })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="qty" className="text-right">Atual</Label>
                <Input id="qty" type="number" value={newItemData.quantity || 0} onChange={(e) => setNewItemData({ ...newItemData, quantity: Number(e.target.value) })} className="col-span-3" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingItem(false)}>Cancelar</Button>
              <Button onClick={() => {
                let updatedList;
                if (editingItem) {
                  updatedList = items.map(i => i.id === editingItem.id ? { ...i, ...newItemData } as InventoryItem : i);
                } else {
                  updatedList = [...items, { ...newItemData, id: Math.random().toString(36).substr(2, 9) } as InventoryItem];
                }
                setItems(updatedList);
                saveGlobalItems(updatedList); // Update Global Definitions
                setIsAddingItem(false);
                setEditingItem(null);
              }}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Manage Categories Dialog */}
        <Dialog open={isManagingCategories} onOpenChange={setIsManagingCategories}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Gerenciar Categorias</DialogTitle>
              <DialogDescription>Adicione, edite ou remova categorias de itens.</DialogDescription>
            </DialogHeader>

            <ScrollArea className="h-[250px] pr-4">
              <div className="space-y-2">
                {categories.filter(c => c !== 'Todos').map(cat => (
                  <div key={cat} className="flex items-center justify-between p-2 rounded-lg border bg-slate-50 group">
                    {editingCategory?.original === cat ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editingCategory.new}
                          onChange={(e) => setEditingCategory({ ...editingCategory, new: e.target.value })}
                          className="h-8"
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => {
                          if (editingCategory.new && !categories.includes(editingCategory.new)) {
                            const newCats = categories.map(c => c === cat ? editingCategory.new : c);
                            saveGlobalCategories(newCats);
                            // Update items with this category locally
                            setItems(prev => prev.map(i => i.category === cat ? { ...i, category: editingCategory.new } : i));
                            setEditingCategory(null);
                          }
                        }}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-600" onClick={() => setEditingCategory(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium text-slate-700">{cat}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => setEditingCategory({ original: cat, new: cat })}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {/* Prevent deleting if in use or default? For now allow all except basic? */}
                          {cat !== 'Outros' && (
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => {
                              // In real app check usage. Here just delete.
                              const newCats = categories.filter(c => c !== cat);
                              saveGlobalCategories(newCats);
                            }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="grid gap-4 py-4 border-t mt-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="catName" className="text-right">Nova</Label>
                <div className="col-span-3 flex gap-2">
                  <Input id="catName" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nome da categoria" />
                  <Button onClick={() => {
                    if (newCategoryName && !categories.includes(newCategoryName)) {
                      // Add before 'Outros' if exists, or append
                      const outrosIndex = categories.indexOf('Outros');
                      const newCats = [...categories];
                      if (outrosIndex !== -1) {
                        newCats.splice(outrosIndex, 0, newCategoryName);
                      } else {
                        newCats.push(newCategoryName);
                      }
                      saveGlobalCategories(newCats);
                      setNewCategoryName("");
                    }
                  }} size="icon" className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setIsManagingCategories(false)}>Fechar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};


const SubmissionDetailDialog = ({ submission, isOpen, onClose }: { submission: any | null, isOpen: boolean, onClose: () => void }) => {
  if (!submission) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white rounded-2xl">
        <DialogHeader className="p-6 border-b bg-white shrink-0">
          <div className="flex items-center justify-between mb-2">
            <Badge variant={submission.status === 'confirmado' ? 'default' : submission.status === 'cancelado' ? 'destructive' : 'secondary'} className="capitalize bg-opacity-90">
              {submission.status || 'Pendente'}
            </Badge>
            <span className="text-sm text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(typeof submission.date === 'number' ? submission.date : submission.date?.toMillis?.() || 0).toLocaleDateString()}
            </span>
          </div>
          <DialogTitle className="text-xl font-bold text-slate-800">Detalhes do Registro</DialogTitle>
          <DialogDescription>
            Enviado por <span className="font-semibold text-slate-700">{submission.respondentName}</span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" /> Frequência
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-xs text-slate-500 block mb-1">Turno</span>
                  <span className="text-sm font-medium capitalize text-slate-700">{submission.shift}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-xs text-slate-500 block mb-1">Total Alunos</span>
                  <span className="text-sm font-medium text-slate-700">{submission.studentsCount || '-'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" /> Alimentação
              </h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Tipo de Cardápio</span>
                  <Badge variant="outline" className="bg-white border-slate-200 text-slate-700 capitalize">
                    {submission.menuType === 'planned' ? 'Previsto' : submission.menuType === 'alternative' ? 'Alternativo' : 'Improvisado'}
                  </Badge>
                </div>
                {submission.menuType === 'alternative' && (
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Descrição do Cardápio</span>
                    <p className="text-sm text-slate-700 bg-white p-2 rounded border border-slate-100">
                      {submission.alternativeMenuDescription || 'Não informado'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-purple-500" /> Observações & Suprimentos
              </h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Suprimentos Recebidos?</span>
                  <span className={cn("text-sm font-medium", submission.suppliesReceived ? "text-emerald-600" : "text-slate-600")}>
                    {submission.suppliesReceived ? 'Sim' : 'Não'}
                  </span>
                  {submission.suppliesReceived && (
                    <p className="mt-1 text-sm text-slate-600 italic">"{submission.suppliesDescription}"</p>
                  )}
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Precisa de Ajuda/Itens?</span>
                  <span className={cn("text-sm font-medium", submission.helpNeeded ? "text-amber-600" : "text-slate-600")}>
                    {submission.helpNeeded ? 'Sim' : 'Não'}
                  </span>
                  {submission.helpNeeded && (
                    <div className="mt-2 space-y-2">
                      {submission.missingItems && <p className="text-sm text-slate-600"><span className="font-medium text-xs text-slate-500 uppercase">Falta:</span> {submission.missingItems}</p>}
                      {submission.canBuyMissingItems !== undefined && (
                        <p className="text-sm text-slate-600"><span className="font-medium text-xs text-slate-500 uppercase">Pode Comprar:</span> {submission.canBuyMissingItems ? 'Sim' : 'Não'}</p>
                      )}
                      {submission.itemsPurchased && <p className="text-sm text-slate-600"><span className="font-medium text-xs text-slate-500 uppercase">Comprou:</span> {submission.itemsPurchased}</p>}
                    </div>
                  )}
                </div>
                {submission.observations && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-xs text-slate-500 block mb-1">Observações Gerais</span>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{submission.observations}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-slate-50 flex justify-end">
          <Button onClick={onClose} variant="outline" className="w-full sm:w-auto">Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const SchoolDetailsModal = ({ school, isOpen, onClose }: { school: string | null, isOpen: boolean, onClose: () => void }) => {
  const [data, setData] = useState<any[]>([]);
  const [visibleData, setVisibleData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [isLoading, setIsLoading] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState<{ counts?: { morning: number, afternoon: number, night: number }, contacts?: { email: string, whatsapp: string } }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValues, setEditValues] = useState({ morning: 0, afternoon: 0, night: 0, email: '', whatsapp: '' });
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);

  useEffect(() => {
    if (school && isOpen) {
      setIsLoading(true);
      setPage(1);

      // Fetch all submissions
      const p1 = fetch(`/api/submissions?school=${encodeURIComponent(school)}`)
        .then(res => res.json())
        .then(json => {
          const allSubmissions = json.submissions || [];
          setData(allSubmissions);
          setVisibleData(allSubmissions.slice(0, PAGE_SIZE));
        })
        .catch(err => console.error(err));

      // Fetch school settings
      const p2 = fetch(`/api/schools/settings?school=${encodeURIComponent(school)}`)
        .then(res => res.json())
        .then(json => {
          const counts = json.settings?.counts || { morning: 0, afternoon: 0, night: 0 };
          const contacts = json.settings?.contacts || { email: '', whatsapp: '' };
          setSchoolSettings({ counts, contacts });
          setEditValues({ ...counts, ...contacts });
        })
        .catch(err => console.error(err));

      Promise.all([p1, p2]).finally(() => setIsLoading(false));
    } else {
      setData([]);
      setVisibleData([]);
      setIsEditing(false);
    }
  }, [school, isOpen]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    const newVisible = data.slice(0, nextPage * PAGE_SIZE);
    setVisibleData(newVisible);
    setPage(nextPage);
  };

  const handleSave = async () => {
    if (!school) return;
    setIsSaving(true);
    try {
      await fetch('/api/schools/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: school,
          counts: { morning: editValues.morning, afternoon: editValues.afternoon, night: editValues.night },
          contacts: { email: editValues.email, whatsapp: editValues.whatsapp }
        })
      });
      setSchoolSettings({ counts: { morning: editValues.morning, afternoon: editValues.afternoon, night: editValues.night }, contacts: { email: editValues.email, whatsapp: editValues.whatsapp } });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save settings", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValues({
      ...(schoolSettings.counts || { morning: 0, afternoon: 0, night: 0 }),
      ...(schoolSettings.contacts || { email: '', whatsapp: '' })
    });
    setIsEditing(false);
  };

  const stats = useMemo(() => {
    if (!data.length && !schoolSettings.counts) return null;

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
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85dvh] flex flex-col p-0 overflow-hidden bg-slate-50/95 backdrop-blur-xl gap-0 rounded-2xl outline-none border-none shadow-none ring-0">
        <div className="p-4 md:p-6 bg-white border-b border-slate-100 shadow-sm relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          <DialogHeader className="relative z-10 text-left pr-6">
            <DialogTitle className="text-lg md:text-2xl font-bold flex items-center gap-2 text-slate-800 break-words leading-tight">
              <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg text-blue-600 shrink-0">
                <GraduationCap className="w-4 h-4 md:w-6 md:h-6" />
              </div>
              {school}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-slate-500 text-left mt-1 line-clamp-1">
              Visão geral, estoque e histórico completo.
            </DialogDescription>
          </DialogHeader>

        </div>

        <div className="flex-1 w-full bg-slate-50/50 overflow-y-auto">
          <div className="flex flex-col p-4 md:p-6 pb-4 gap-4 md:gap-6 w-full max-w-full">
            {isLoading ? (
              <div className="h-48 flex items-center justify-center text-slate-400">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Carregando...</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 md:gap-6 w-full">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
                  <Card className="bg-white border-0 shadow-sm rounded-xl overflow-hidden">
                    <CardHeader className="py-2 px-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" /> Alunos Matriculados
                      </CardTitle>
                      {!isEditing ? (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => window.open(`/admin/reports?school=${encodeURIComponent(school || '')}`, '_self')} className="h-7 w-7 text-slate-400 hover:text-blue-600 rounded-lg">
                            <BarChart className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-7 w-7 text-slate-400 hover:text-blue-600 rounded-lg">
                            <div className="w-4 h-4 relative">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                            </div>
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving} className="h-7 text-xs">Cancelar</Button>
                          <Button variant="default" size="sm" onClick={handleSave} disabled={isSaving} className="h-7 text-xs bg-blue-600 hover:bg-blue-700">Salvar</Button>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="p-2 md:p-3">
                      <div className={cn("grid gap-3", isEditing ? "grid-cols-1" : "grid-cols-3")}>
                        {['Manhã', 'Tarde', 'Noite'].map(shiftLabel => {
                          const key = shiftLabel === 'Manhã' ? 'morning' : shiftLabel === 'Tarde' ? 'afternoon' : 'night';
                          // @ts-ignore
                          const val = editValues[key];
                          // @ts-ignore
                          const savedVal = schoolSettings.counts?.[key] || 0;
                          return (
                            <div key={key} className={cn("flex items-center", isEditing ? "justify-between h-8" : "flex-col justify-center bg-slate-50 rounded-lg p-2 border border-slate-100")}>
                              <span className={cn("text-slate-500", isEditing ? "text-sm ml-1" : "text-[10px] uppercase font-bold tracking-wider mb-1")}>{shiftLabel}</span>
                              {isEditing ? (
                                <Input
                                  type="number"
                                  className="w-20 h-8 text-right bg-slate-50"
                                  value={val}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                                />
                              ) : (
                                <span className="font-bold text-slate-800 text-lg md:text-xl">{savedVal}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex flex-col gap-3 md:gap-4">
                    <Card className="bg-white border-0 shadow-sm rounded-xl flex-1">
                      <CardHeader className="py-2 px-4 border-b border-slate-100 bg-slate-50/50 min-h-[40px] flex justify-center">
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          Contatos da Unidade
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2 md:p-3 space-y-1.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0 text-green-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <Input className="h-8 bg-slate-50 text-xs" value={editValues.email || ''} onChange={(e) => setEditValues(prev => ({ ...prev, email: e.target.value }))} placeholder="email@escola.com" />
                            ) : (
                              <div className="flex flex-col">
                                <span className="text-slate-400 font-bold text-[10px] uppercase">E-mail Institucional</span>
                                <span className="text-sm font-medium text-slate-700 truncate">{schoolSettings.contacts?.email || '-'}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0 text-green-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <Input className="h-8 bg-slate-50 text-xs" value={editValues.whatsapp || ''} onChange={(e) => setEditValues(prev => ({ ...prev, whatsapp: e.target.value }))} placeholder="(00) 00000-0000" />
                            ) : (
                              <div className="flex flex-col">
                                <span className="text-slate-400 font-bold text-[10px] uppercase">Telefone / WhatsApp</span>
                                <span className="text-sm font-medium text-slate-700">{schoolSettings.contacts?.whatsapp || '-'}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-0 shadow-lg shadow-blue-600/20 rounded-xl overflow-hidden relative cursor-pointer hover:scale-[1.02] transition-transform active:scale-[0.98] group" onClick={() => setIsInventoryOpen(true)}>
                      <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                      <CardContent className="p-3 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-md">
                            <Package className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm leading-tight">Estoque Escolar</h3>
                            <p className="text-blue-100 text-[10px] font-medium opacity-80 mt-0.5">Gerenciar itens e despensa</p>
                          </div>
                        </div>
                        <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-white group-hover:text-blue-600 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <SchoolInventoryModal
                  school={school || ''}
                  isOpen={isInventoryOpen}
                  onClose={() => setIsInventoryOpen(false)}
                />

                <SubmissionDetailDialog
                  submission={selectedSubmission}
                  isOpen={!!selectedSubmission}
                  onClose={() => setSelectedSubmission(null)}
                />

                {/* History Table */}
                <div className="flex flex-col w-full bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" /> Histórico
                    </h3>
                    <Badge variant="outline" className="bg-white">{data.length} registros</Badge>
                  </div>

                  <div className="overflow-x-auto w-full">
                    <Table className="w-full">
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="min-w-[100px] md:min-w-[120px] pl-4 py-2 text-xs md:text-sm h-9">Data</TableHead>
                          <TableHead className="min-w-[150px] md:min-w-[180px] py-2 text-xs md:text-sm h-9">Responsável</TableHead>
                          <TableHead className="min-w-[80px] md:min-w-[100px] py-2 text-xs md:text-sm h-9">Turno</TableHead>
                          <TableHead className="min-w-[60px] md:min-w-[80px] py-2 text-xs md:text-sm h-9">Alunos</TableHead>
                          <TableHead className="min-w-[100px] md:min-w-[120px] py-2 text-xs md:text-sm h-9">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleData.map((row) => (
                          <TableRow
                            key={row.id}
                            className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                            onClick={() => setSelectedSubmission(row)}
                          >
                            <TableCell className="pl-4 font-medium text-slate-700">
                              {new Date(typeof row.date === 'number' ? row.date : row.date?.toMillis?.() || 0).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-slate-600">
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-900 line-clamp-1">{row.respondentName}</span>
                                <span className="text-xs text-slate-400 truncate">{row.school}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600 capitalize">{row.shift}</TableCell>
                            <TableCell className="text-slate-600 font-medium">{row.studentsCount || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={row.status === 'confirmado' ? 'default' : row.status === 'cancelado' ? 'destructive' : 'secondary'} className="capitalize shadow-none">
                                {row.status || 'Pendente'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {!visibleData.length && (
                          <TableRow>
                            <TableCell colSpan={5} className="h-20 text-center text-slate-400 bg-slate-50/30">
                              <div className="flex flex-col items-center gap-2">
                                <Search className="w-8 h-8 text-slate-300" />
                                <p>Nenhum registro encontrado.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {visibleData.length < data.length && (
                    <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                      <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm h-9" onClick={handleLoadMore}>
                        Carregar mais registros ({data.length - visibleData.length} restantes)
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
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
