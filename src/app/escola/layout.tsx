import { SchoolNav } from "@/components/school-nav";
import SchoolAuthGuard from "@/components/school-auth-guard";

export default function EscolaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SchoolAuthGuard>
            <SchoolNav />
            {children}
        </SchoolAuthGuard>
    );
}
