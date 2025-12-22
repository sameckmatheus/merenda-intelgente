"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { menuItems } from "@/components/admin/sidebar";
import { cn } from "@/lib/utils";

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
}: Omit<AdminLayoutProps, "date" | "setDate" | "filterType" | "setFilterType" | "selectedSchool" | "setSelectedSchool" | "selectedStatus" | "setSelectedStatus" | "helpNeededFilter" | "setHelpNeededFilter" | "schools" | "statusTranslations">) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="sticky top-0 z-50 w-full border-b border-blue-100 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto max-w-7xl px-4 h-20 flex items-center justify-between relative">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="px-4 py-3 border-b">
                  <SheetTitle className="text-left flex items-center gap-2">
                    <span className="font-bold text-blue-900">MenuPlanner</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="space-y-2 p-4">
                  {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-blue-50 hover:text-blue-900",
                          isActive ? "bg-blue-50 text-blue-900 font-medium" : "text-slate-600"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>

            <Link href="/admin" className="hidden lg:flex items-center gap-2">
              <span className="font-headline font-bold text-xl text-blue-950">MenuPlanner</span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all hover:bg-blue-50 hover:text-blue-900",
                    isActive ? "bg-blue-100/50 text-blue-900" : "text-slate-600"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            {actions}
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl p-4 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-blue-950">{title}</h2>
            {description && <p className="text-slate-500 mt-1">{description}</p>}
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
