"use client"

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User, Settings, Save, Bell, Shield, Mail, LogOut } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

// Types
type SystemSettings = {
  schoolYear: string;
  maintenanceMode: boolean;
  deliveryDeadlineDays: number;
  notificationsEnabled: boolean;
};

type UserProfile = {
  name: string;
  email: string;
  role: string;
};

export default function AdminSettings() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "Administrador",
    email: "admin@merendainteligente.gov.br",
    role: "Super Admin"
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    schoolYear: new Date().getFullYear().toString(),
    maintenanceMode: false,
    deliveryDeadlineDays: 2,
    notificationsEnabled: true
  });

  // Fetch Settings on Mount
  useEffect(() => {
    setIsLoading(true);
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings && Object.keys(data.settings).length > 0) {
          setSystemSettings(prev => ({ ...prev, ...data.settings }));
        }
      })
      .catch(err => {
        console.error("Failed to load settings", err);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as configurações.",
          variant: "destructive"
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSystemSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemSettings)
      });

      if (res.ok) {
        toast({
          title: "Sucesso",
          description: "Configurações do sistema atualizadas.",
        });
      } else {
        throw new Error("Failed to save");
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileSave = () => {
    // Mock save for profile
    toast({
      title: "Perfil atualizado",
      description: "Suas informações foram salvas localmente.",
    });
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <AdminLayout
      title="Configurações"
      description="Gerencie as preferências do sistema e sua conta."
    >
      <Tabs defaultValue="system" className="w-full space-y-6">
        <TabsList className="bg-white border text-slate-600">
          <TabsTrigger value="system" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
            <Settings className="w-4 h-4 mr-2" /> Sistema
          </TabsTrigger>
          <TabsTrigger value="general" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
            <User className="w-4 h-4 mr-2" /> Perfil
          </TabsTrigger>
        </TabsList>

        {/* SYSTEM SETTINGS */}
        <TabsContent value="system" className="space-y-6">
          <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Preferências Globais</CardTitle>
              <CardDescription>Defina os parâmetros de funcionamento da plataforma.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

              {/* School Year Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Ano Letivo & Prazos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="schoolYear">Ano Letivo Vigente</Label>
                    <Input
                      id="schoolYear"
                      value={systemSettings.schoolYear}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, schoolYear: e.target.value }))}
                      className="bg-white"
                    />
                    <p className="text-[0.8rem] text-slate-500">Define o ano base para todos os relatórios e cadastros.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Prazo de Resposta (Dias)</Label>
                    <Input
                      id="deadline"
                      type="number"
                      value={systemSettings.deliveryDeadlineDays}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, deliveryDeadlineDays: parseInt(e.target.value) || 0 }))}
                      className="bg-white"
                    />
                    <p className="text-[0.8rem] text-slate-500">Tempo limite para as escolas confirmarem o recebimento.</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* System Control Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Controle do Sistema</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4 bg-white">
                    <div className="space-y-0.5">
                      <Label className="text-base">Modo de Manutenção</Label>
                      <p className="text-sm text-slate-500">
                        Impede o acesso das escolas ao sistema temporariamente.
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4 bg-white">
                    <div className="space-y-0.5">
                      <Label className="text-base">Notificações por E-mail</Label>
                      <p className="text-sm text-slate-500">
                        Envia alertas automáticos para as escolas pendentes.
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.notificationsEnabled}
                      onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, notificationsEnabled: checked }))}
                    />
                  </div>
                </div>
              </div>

            </CardContent>
            <CardFooter className="border-t bg-slate-50 px-6 py-4">
              <Button onClick={handleSystemSave} disabled={isSaving || isLoading} className="ml-auto bg-blue-600 hover:bg-blue-700 text-white">
                {isSaving ? "Salvando..." : <><Save className="w-4 h-4 mr-2" /> Salvar Alterações</>}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* GENERAL / PROFILE SETTINGS */}
        <TabsContent value="general" className="space-y-6">
          <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Informações do Administrador</CardTitle>
              <CardDescription>Gerencie seus dados de acesso e perfil.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4 p-4 border rounded-xl bg-blue-50/50">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{userProfile.name}</h3>
                  <p className="text-sm text-slate-500">{userProfile.role}</p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input
                    value={userProfile.name}
                    onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail Corporativo</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={userProfile.email}
                      onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                      className="pl-9 bg-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Button variant="outline" className="w-full justify-start text-slate-500 font-normal">
                    <Shield className="w-4 h-4 mr-2" />
                    Alterar senha de acesso
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-slate-50 px-6 py-4 flex justify-between">
              <Button onClick={handleLogout} variant="destructive" className="bg-red-600 hover:bg-red-700">
                <LogOut className="w-4 h-4 mr-2" />
                Sair do Sistema
              </Button>
              <Button onClick={handleProfileSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                Salvar Perfil
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
