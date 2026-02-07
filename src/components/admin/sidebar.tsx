
import {
    LayoutDashboard,
    School,
    UtensilsCrossed,
    FileBarChart,
    Settings,
    Users,
    ShieldCheck,
} from "lucide-react";

export const menuItems = [
    {
        title: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
    },
    {
        title: "Escolas",
        href: "/admin/schools",
        icon: School,
    },
    {
        title: "Cardápios",
        href: "/admin/menus",
        icon: UtensilsCrossed,
    },
    {
        title: "Relatórios",
        href: "/admin/reports",
        icon: FileBarChart,
    },
    {
        title: "Usuários",
        href: "/admin/users",
        icon: Users,
    },
    {
        title: "Configurações",
        href: "/admin/settings",
        icon: Settings,
    },
    {
        title: "Audit Logs",
        href: "/admin/logs",
        icon: ShieldCheck,
    },
];
