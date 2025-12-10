"use client"

import { useState } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const schools = ["ANEXO MARCOS FREIRE"];

export default function AdminMenus() {
  const [date] = useState<Date | undefined>(new Date());
  const noop = () => {};

  const newButton = <Button variant="outline">Novo</Button>;

  return (
    <AdminLayout
      title="Cardápios"
      description="Página de cardápios (em construção)"
      actions={newButton}
    >
      <Card>
        <CardHeader>
          <CardTitle>Cardápios</CardTitle>
        </CardHeader>
        <CardContent>Em desenvolvimento.</CardContent>
      </Card>
    </AdminLayout>
  );
}
