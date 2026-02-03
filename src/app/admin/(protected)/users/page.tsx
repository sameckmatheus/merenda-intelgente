"use client"

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Mail, Phone, User as UserIcon, Building2, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { User } from "@/lib/types";
import { SCHOOLS_LIST } from "@/lib/constants";

// Helper to fetch schools for dropdown
const useSchools = () => {
  const [schools, setSchools] = useState<{ id: string, name: string }[]>([]);
  useEffect(() => {
    // Use the centralized constant list
    setSchools(SCHOOLS_LIST.map(name => ({ id: name, name })));
  }, []);
  return schools;
};

const UserCard = ({ user, onClick }: { user: User, onClick: () => void }) => (
  <Card className="hover:shadow-lg transition-all cursor-pointer group border-slate-200" onClick={onClick}>
    <CardHeader className="flex flex-row items-center gap-4 pb-2">
      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
        <UserIcon className="w-6 h-6" />
      </div>
      <div className="flex-1 overflow-hidden">
        <CardTitle className="text-base font-bold truncate" title={user.name}>{user.name}</CardTitle>
        <CardDescription className="truncate flex items-center gap-1">
          <Building2 className="w-3 h-3" /> {user.schoolId || 'Sem Escola'}
        </CardDescription>
      </div>
    </CardHeader>
    <CardContent className="py-2">
      <div className="space-y-2 text-sm text-slate-500">
        <div className="flex items-center gap-2 truncate">
          <Mail className="w-4 h-4 text-slate-400" />
          <span className="truncate">{user.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">{user.role === 'school_responsible' ? 'Responsável' : user.role}</Badge>
        </div>
      </div>
    </CardContent>
  </Card>
);

const UserDetailsModal = ({ user, isOpen, onClose, onUpdate, schools }: { user: User | null, isOpen: boolean, onClose: () => void, onUpdate: () => void, schools: { id: string, name: string }[] }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!user;

  const [formData, setFormData] = useState<Partial<User>>({
    role: 'school_responsible',
    status: 'active'
  });

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData(user);
      } else {
        setFormData({ role: 'school_responsible', status: 'active' });
      }
    }
  }, [user, isOpen]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast({ title: "Sucesso", description: "Usuário salvo com sucesso." });
        onUpdate();
        onClose();
      } else {
        throw new Error("Failed");
      }
    } catch {
      toast({ title: "Erro", description: "Falha ao salvar usuário.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id })
      });

      if (res.ok) {
        toast({ title: "Sucesso", description: "Usuário removido." });
        onUpdate();
        onClose();
      } else {
        throw new Error("Failed");
      }
    } catch {
      toast({ title: "Erro", description: "Falha ao excluir usuário.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-blue-600" />
            {isEditing ? `Editar: ${user.name}` : "Novo Usuário"}
          </DialogTitle>
          <DialogDescription>Gerenciamento de usuário do sistema.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Select value={formData.role} onValueChange={(v: any) => setFormData({ ...formData, role: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="school_responsible">Resp. Escola</SelectItem>
                  <SelectItem value="nutritionist">Nutricionista</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>E-mail (Login)</Label>
            <Input
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>

          {formData.role === 'school_responsible' && (
            <div className="space-y-2">
              <Label>Vincular Escola</Label>
              <Select value={formData.schoolId} onValueChange={(v) => setFormData({ ...formData, schoolId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a escola..." />
                </SelectTrigger>
                <SelectContent>
                  {schools.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="flex gap-2">
            {isEditing && (
              <Button variant="destructive" onClick={handleDelete} disabled={isLoading} className="bg-red-50 text-red-600 hover:bg-red-100 border-none shadow-none">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading} className="text-white bg-red-600 hover:bg-red-700 hover:text-white border-0">Cancelar</Button>
            <Button onClick={handleSave} disabled={isLoading} className="text-white bg-blue-600 hover:bg-blue-700">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const schools = useSchools();

  const handleOpenModal = (user: User | null) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const fetchUsers = () => {
    setIsLoading(true);
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (data.users) setUsers(data.users);
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout
      title="Gestão de Usuários"
      description="Controle de acesso e responsáveis por unidade."
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar usuário..."
              className="pl-9 bg-white border-slate-200 shadow-sm focus:ring-blue-500 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => handleOpenModal(null)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-400">Carregando usuários...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map(user => (
              <UserCard
                key={user.id}
                user={user}
                onClick={() => handleOpenModal(user)}
              />
            ))}
          </div>
        )}

        {!isLoading && filteredUsers.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            Nenhum usuário encontrado.
          </div>
        )}

        <UserDetailsModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUpdate={fetchUsers}
          schools={schools}
        />
      </div>
    </AdminLayout>
  );
}
