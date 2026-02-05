"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X, LayoutDashboard, FileText, Utensils, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const schoolMenuItems = [
    { title: "Painel", href: "/escola", icon: LayoutDashboard },
    { title: "Formulário", href: "/escola/formulario", icon: FileText },
    { title: "Cardápio", href: "/escola/cardapio", icon: Utensils },
    { title: "Configurações", href: "/escola/configuracoes", icon: Settings },
];

export function SchoolNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            router.push('/login');
        }
    };

    return (
        <header className="sticky top-0 z-[60] w-full border-b border-[#204ecf] bg-[#275fcf]">
            <div className="w-full px-4 md:px-8 h-20 flex items-center relative">

                <div className="flex items-center shrink-0">
                    <Link href="/escola" className="flex items-center gap-4">
                        <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                            <Logo />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-headline font-bold text-xl text-white leading-tight">Smart Plate</span>
                            <span className="text-blue-100 text-[10px] font-medium opacity-90">Gestão Inteligente de Merenda</span>
                        </div>
                    </Link>
                </div>

                <div className="flex items-center gap-4 ml-auto">
                    <nav className="hidden lg:flex items-center gap-1">
                        {schoolMenuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all hover:bg-blue-700",
                                        isActive ? "bg-blue-700 text-white" : "text-white/90"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Mobile Menu */}
                    <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden rounded-full bg-white text-[#275fcf] hover:bg-blue-50 shadow-sm shrink-0 relative z-[61] transition-all duration-300 transform"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            aria-label={isSidebarOpen ? "Fechar menu" : "Abrir menu"}
                        >
                            <div className={cn("transition-transform duration-300", isSidebarOpen ? "rotate-90 scale-100" : "rotate-0 scale-100")}>
                                {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </div>
                        </Button>

                        <SheetContent side="left" className="w-72 p-0 top-[5rem] h-[calc(100vh-5rem)] border-r z-[55] data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
                            <SheetHeader className="px-4 py-3 border-b hidden">
                                <SheetTitle className="text-left flex items-center gap-2">
                                    <span className="font-bold text-blue-900">Smart Plate</span>
                                </SheetTitle>
                            </SheetHeader>
                            <nav className="space-y-2 p-4 mt-6">
                                {schoolMenuItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsSidebarOpen(false)}
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

                                {/* Logout button in mobile menu */}
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-red-50 hover:text-red-900 text-red-600 w-full"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sair
                                </button>
                            </nav>
                        </SheetContent>
                    </Sheet>

                    {/* Desktop Logout Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="hidden lg:flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white border-none"
                    >
                        <LogOut className="h-4 w-4" />
                        Sair
                    </Button>
                </div>
            </div>
        </header>
    );
}
