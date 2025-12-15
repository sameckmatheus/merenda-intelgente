"use client"

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Mail, Phone, MapPin, User, Building2, Send, Edit, Save, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

type SchoolUser = {
  id: string;
  name: string;
  email: string;
  responsibleName: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
};

const UserCard = ({ user, onClick }: { user: SchoolUser, onClick: () => void }) => (
  <Card className="hover:shadow-lg transition-all cursor-pointer group border-slate-200" onClick={onClick}>
    <CardHeader className="flex flex-row items-center gap-4 pb-2">
      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
        <Building2 className="w-6 h-6" />
      </div>
      <div className="flex-1 overflow-hidden">
        <CardTitle className="text-base font-bold truncate" title={user.name}>{user.name}</CardTitle>
        <CardDescription className="truncate flex items-center gap-1">
          <User className="w-3 h-3" /> {user.responsibleName}
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
          <Badge
            variant="secondary"
            className={
              user.status === 'active'
                ? "bg-emerald-100 text-emerald-700 font-medium border border-emerald-200"
                : "bg-slate-100 text-slate-500 font-medium border border-slate-200"
            }
          >
            {user.status === 'active' ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </div>
    </CardContent>
    <CardFooter className="pt-2">
      <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50">
        Gerenciar Conta
      </Button>
    </CardFooter>
  </Card>
);

const UserDetailsModal = ({ user, isOpen, onClose, onUpdate }: { user: SchoolUser | null, isOpen: boolean, onClose: () => void, onUpdate: () => void }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const [isLoading, setIsLoading] = useState(false);

  // Edit Form State
  const [formData, setFormData] = useState<Partial<SchoolUser>>({});

  // Email Form State
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  useEffect(() => {
    if (user) {
      setFormData(user);
      setEmailSubject(`Atualização - ${user.name}`);
      setEmailMessage(`Prezados,\n\nGostaríamos de informar que...`);
    }
  }, [user]);

  const handleSaveDetails = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast({ title: "Sucesso", description: "Dados da escola atualizados." });
        onUpdate();
        onClose();
      } else {
        throw new Error("Failed");
      }
    } catch {
      toast({ title: "Erro", description: "Falha ao salvar dados.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: user.id,
          recipientEmail: user.email,
          subject: emailSubject,
          message: emailMessage
        })
      });

      if (res.ok) {
        toast({ title: "E-mail Enviado", description: `Notificação enviada para ${user.email}` });
        setActiveTab("details"); // Switch back
      } else {
        throw new Error("Failed");
      }
    } catch {
      toast({ title: "Erro", description: "Falha ao enviar e-mail.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            {user.name}
          </DialogTitle>
          <DialogDescription>Gerenciamento da conta escolar.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="details">Informações da Conta</TabsTrigger>
            <TabsTrigger value="email">Enviar Notificação</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Escola</Label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Input
                  value={formData.responsibleName || ''}
                  onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>E-mail de Contato</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  className="pl-9"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    className="pl-9"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status da Conta</Label>
                <div className="flex items-center justify-between rounded-lg border p-3 bg-white">
                  <span className="text-sm text-slate-500">
                    {formData.status === 'active' ? 'Acesso Liberado' : 'Acesso Bloqueado'}
                  </span>
                  <Switch
                    checked={formData.status === 'active'}
                    onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? 'active' : 'inactive' })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Endereço</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  className="pl-9"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-4 py-4">
            <div className="bg-blue-50 p-4 rounded-lg flex gap-3 text-sm text-blue-700">
              <Mail className="w-5 h-5 shrink-0" />
              <p>Esta mensagem será enviada para o e-mail cadastrado da escola. Use para informar sobre pendências ou atualizações.</p>
            </div>
            <div className="space-y-2">
              <Label>Assunto</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Assunto da mensagem..."
              />
            </div>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Digite sua mensagem aqui..."
                className="min-h-[150px]"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          {activeTab === 'details' ? (
            <Button onClick={handleSaveDetails} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Alterações
            </Button>
          ) : (
            <Button onClick={handleSendEmail} disabled={isLoading || !emailSubject || !emailMessage}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Enviar E-mail
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<SchoolUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<SchoolUser | null>(null);

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
      title="Usuários"
      description="Gerencie as contas das escolas e canais de comunicação."
    >
      <div className="space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar usuário ou escola..."
            className="pl-9 bg-white border-slate-200 shadow-sm focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-400">Carregando usuários...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map(user => (
              <UserCard
                key={user.id}
                user={user}
                onClick={() => setSelectedUser(user)}
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
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={fetchUsers}
        />
      </div>
    </AdminLayout>
  );
}
