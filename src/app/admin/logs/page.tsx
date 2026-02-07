
'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { LoaderCircle } from 'lucide-react';

interface Log {
    id: string;
    userId: string;
    userEmail: string | null;
    userName?: string; // We might need to fetch this or join in backend
    action: string;
    resource: string;
    details: any;
    createdAt: string;
}

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/logs');
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
            }
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><LoaderCircle className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold mb-6">Logs de Auditoria</h1>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data/Hora</TableHead>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Ação</TableHead>
                            <TableHead>Recurso</TableHead>
                            <TableHead>Detalhes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell>{format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{log.userName || 'Sem nome'}</span>
                                        <span className="text-xs text-muted-foreground">{log.userEmail}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{log.action}</TableCell>
                                <TableCell>{log.resource}</TableCell>
                                <TableCell className="max-w-md truncate" title={JSON.stringify(log.details, null, 2)}>
                                    {log.details ? JSON.stringify(log.details) : '-'}
                                </TableCell>
                            </TableRow>
                        ))}
                        {logs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">Nenhum registro encontrado.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
