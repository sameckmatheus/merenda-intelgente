"use client"

import { useState } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
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

  const newButton = <Button variant="outline">Novo</Button>;

  return (
    <AdminLayout
      title="Escolas"
      description="Lista de escolas e contatos de exemplo"
      actions={newButton}
    >
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
    </AdminLayout>
  );
}
