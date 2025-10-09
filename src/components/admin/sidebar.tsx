"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ChefHat,
  Settings,
  Users,
  HelpCircle,
  Building,
  Calendar,
  MessageSquare,
  BarChart
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    title: "Cardápios",
    icon: ChefHat,
    href: "/admin/menus",
  },
  {
    title: "Escolas",
    icon: Building,
    href: "/admin/schools",
  },
  {
    title: "Usuários",
    icon: Users,
    href: "/admin/users",
  },
  {
    title: "Relatórios",
    icon: BarChart,
    href: "/admin/reports",
  },
  {
    title: "Configurações",
    icon: Settings,
    href: "/admin/settings",
  },
];

import { Filters } from "@/components/admin/filters";

interface AdminSidebarProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  filterType: 'day' | 'week' | 'month';
  setFilterType: (type: 'day' | 'week' | 'month') => void;
  selectedSchool: string;
  setSelectedSchool: (school: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  helpNeededFilter: 'all' | 'yes' | 'no';
  setHelpNeededFilter: (filter: 'all' | 'yes' | 'no') => void;
  schools: string[];
  statusTranslations: { [key: string]: string };
}

export function AdminSidebar(props: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex h-screen w-72 flex-col fixed left-0 top-0 border-r bg-card px-4 overflow-y-auto">
      <div className="h-16 flex items-center border-b w-full">
        <h2 className="font-semibold tracking-tight">MenuPlanner</h2>
      </div>
  <nav className="space-y-2 py-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                isActive ? "bg-accent" : "transparent"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
      <div className="mt-4">
        <Filters
          date={props.date}
          setDate={props.setDate}
          filterType={props.filterType}
          setFilterType={props.setFilterType}
          selectedSchool={props.selectedSchool}
          setSelectedSchool={props.setSelectedSchool}
          selectedStatus={props.selectedStatus}
          setSelectedStatus={props.setSelectedStatus}
          helpNeededFilter={props.helpNeededFilter}
          setHelpNeededFilter={props.setHelpNeededFilter}
          schools={props.schools}
          statusTranslations={props.statusTranslations}
        />
      </div>
      <div className="border-t py-4">
        <div className="text-xs text-muted-foreground">
          © 2025 MenuPlanner
        </div>
      </div>
    </aside>
  );
}