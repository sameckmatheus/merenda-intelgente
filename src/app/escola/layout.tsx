
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Painel Escolar | Smart Plate',
    description: 'Gerenciamento de Merenda Escolar',
};

export default function SchoolLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
            {children}
        </div>
    );
}
