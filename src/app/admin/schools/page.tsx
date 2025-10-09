"use client"

import { useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const schools = [
  "ANEXO MARCOS FREIRE",
  "BARBAPAPA",
  "CARLOS AYRES",
  "DILMA",
  "FRANCELINA",
  "GERCINA ALVES",
  "JOÃO BENTO",
  "MARCOS FREIRE",
  "MARIA JOSÉ",
  "MARIA OLIVEIRA",
  "MUNDO DA CRIANÇA",
  "MÃE BELA",
  "OTACÍLIA",
  "SABINO",
  "ZÉLIA",
  "ZULEIDE",
];

export default function AdminSchools() {
  const [date] = useState<Date | undefined>(new Date());
  // sidebar filters are not interactive on this page but props are required
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
        statusTranslations={{ pendente: 'Pendente', confirmado: 'Confirmado', cancelado: 'Cancelado' }}
      />

      <div className="md:pl-72">
        <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-4">
            <div>
              <h2 className="font-headline text-xl font-bold tracking-tight text-foreground">Escolas</h2>
              <p className="text-muted-foreground">Lista de escolas e contatos de exemplo.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">Novo</Button>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Escolas cadastradas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Escola</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schools.map((s, idx) => (
                        <TableRow key={s}>
                          <TableCell className="font-medium">{s}</TableCell>
                          <TableCell>{`${s.toLowerCase().replace(/\s+/g, '.') }@exemplo.com`}</TableCell>
                          <TableCell>{`(99) 9${String(10000000 + idx).slice(1)}`}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
