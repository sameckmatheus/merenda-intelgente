"use client"

import { useState } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const schools = ["ANEXO MARCOS FREIRE"];

export default function AdminSettings() {
  const [date] = useState<Date | undefined>(new Date());
  const noop = () => {};

  return (
    <AdminLayout
      title="Configurações"
      description="Ajustes do sistema"
    >
      <Card>
        <CardHeader>
          <CardTitle>Configurações</CardTitle>
        </CardHeader>
        <CardContent>Em desenvolvimento.</CardContent>
      </Card>
    </AdminLayout>
  );
}
