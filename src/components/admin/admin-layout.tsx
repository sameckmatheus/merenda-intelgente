"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { menuItems } from "@/components/admin/sidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  // Props para filtros (opcional)
  date?: Date | undefined;
  setDate?: (date: Date | undefined) => void;
  filterType?: 'day' | 'week' | 'month';
  setFilterType?: (type: 'day' | 'week' | 'month') => void;
  selectedSchool?: string;
  setSelectedSchool?: (school: string) => void;
  selectedStatus?: string;
  setSelectedStatus?: (status: string) => void;
  helpNeededFilter?: 'all' | 'yes' | 'no';
  setHelpNeededFilter?: (filter: 'all' | 'yes' | 'no') => void;
  schools?: string[];
  statusTranslations?: { [key: string]: string };
}

export function AdminLayout({
  children,
  title,
  description,
  actions,
  date,
  setDate,
  filterType,
  setFilterType,
  selectedSchool,
  setSelectedSchool,
  selectedStatus,
  setSelectedStatus,
  helpNeededFilter,
  setHelpNeededFilter,
  schools = [],
  statusTranslations = {}
}: AdminLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <AdminSidebar
        date={date}
        setDate={setDate}
        filterType={filterType}
        setFilterType={setFilterType}
        selectedSchool={selectedSchool}
        setSelectedSchool={setSelectedSchool}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        helpNeededFilter={helpNeededFilter}
        setHelpNeededFilter={setHelpNeededFilter}
        schools={schools}
        statusTranslations={statusTranslations}
      />

      <div className="md:pl-72">
        <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetHeader className="px-4 py-3 border-b">
                    <SheetTitle>MenuPlanner</SheetTitle>
                  </SheetHeader>
                  <nav className="space-y-2 p-4">
                    {menuItems.map((item: { title: string; icon: any; href: string }) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`${isActive ? 'bg-accent' : 'transparent'} flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent`}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.title}
                        </Link>
                      );
                    })}
                  </nav>
                  {(date || filterType || selectedSchool || selectedStatus || helpNeededFilter) && (
                    <div className="px-4 pb-4">
                      <AdminSidebar
                        date={date}
                        setDate={setDate}
                        filterType={filterType}
                        setFilterType={setFilterType}
                        selectedSchool={selectedSchool}
                        setSelectedSchool={setSelectedSchool}
                        selectedStatus={selectedStatus}
                        setSelectedStatus={setSelectedStatus}
                        helpNeededFilter={helpNeededFilter}
                        setHelpNeededFilter={setHelpNeededFilter}
                        schools={schools}
                        statusTranslations={statusTranslations}
                      />
                    </div>
                  )}
                </SheetContent>
              </Sheet>
              <div>
                <h2 className="font-headline text-xl font-bold tracking-tight text-foreground">{title}</h2>
                {description && <p className="text-muted-foreground">{description}</p>}
              </div>
            </div>
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </header>

        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
