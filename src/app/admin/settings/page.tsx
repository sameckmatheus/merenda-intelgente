"use client"

import { useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const schools = ["ANEXO MARCOS FREIRE"];

export default function AdminSettings() {
  const [date] = useState<Date | undefined>(new Date());
  const noop = () => {};

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <AdminSidebar
        date={date}
        setDate={noop}
        filterType={'day'}
        setFilterType={() => {}}
        selectedSchool={'all'}
        setSelectedSchool={() => {}}
        selectedStatus={'all'}
        setSelectedStatus={() => {}}
        helpNeededFilter={'all'}
        setHelpNeededFilter={() => {}}
        schools={schools}
        statusTranslations={{ pendente: 'Pendente' }}
      />

      <div className="md:pl-72">
        <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-4">
            <div>
              <h2 className="font-headline text-xl font-bold tracking-tight text-foreground">Configurações</h2>
              <p className="text-muted-foreground">Ajustes do sistema.</p>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
            </CardHeader>
            <CardContent>Em desenvolvimento.</CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
