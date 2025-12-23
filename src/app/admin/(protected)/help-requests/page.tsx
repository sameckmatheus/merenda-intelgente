"use client"

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HelpRequest } from "@/lib/types";
import { FileText, Clock, CheckCircle, XCircle, AlertTriangle, MessageSquare, Loader2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG = {
    open: { label: 'Aberto', color: 'bg-blue-100 text-blue-700', icon: Clock },
    in_progress: { label: 'Em Andamento', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
    resolved: { label: 'Resolvido', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    declined: { label: 'Recusado', color: 'bg-red-100 text-red-700', icon: XCircle },
    cancelled: { label: 'Cancelado', color: 'bg-slate-100 text-slate-600', icon: XCircle },
};

const RequestCard = ({ request, onClick }: { request: HelpRequest, onClick: () => void }) => {
    const config = STATUS_CONFIG[request.status] || STATUS_CONFIG.open;
    const Icon = config.icon;

    return (
        <Card className="hover:shadow-md transition-all cursor-pointer border-slate-200" onClick={onClick}>
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <Badge variant="outline" className="font-mono text-xs text-slate-500">
                        #{request.protocol}
                    </Badge>
                    <Badge className={config.color} variant="secondary">
                        <Icon className="w-3 h-3 mr-1" /> {config.label}
                    </Badge>
                </div>
                <CardTitle className="text-base font-bold text-slate-800 mt-2 line-clamp-1">
                    {request.schoolName}
                </CardTitle>
                <CardDescription className="text-xs">
                    {request.createdAt ? format(new Date(typeof request.createdAt === 'number' ? request.createdAt : (request.createdAt as any).toMillis?.() || request.createdAt), "PPP 'às' HH:mm", { locale: ptBR }) : '-'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-slate-600 line-clamp-2">{request.description}</p>

                {request.resolutionType && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-medium text-slate-500">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        Resolução: {request.resolutionType === 'local' ? 'Compra Local' : 'Central'}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const RequestDetailsModal = ({ request, isOpen, onClose, onUpdate }: { request: HelpRequest | null, isOpen: boolean, onClose: () => void, onUpdate: () => void }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<any>(request?.status || 'open');
    const [resolutionType, setResolutionType] = useState<any>(request?.resolutionType || 'local');
    const [notes, setNotes] = useState(request?.resolutionNotes || '');

    useEffect(() => {
        if (request) {
            setStatus(request.status);
            setResolutionType(request.resolutionType || 'local');
            setNotes(request.resolutionNotes || '');
        }
    }, [request]);

    const handleSave = async () => {
        if (!request) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/help-requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: request.id,
                    status,
                    resolutionType: status === 'resolved' ? resolutionType : undefined,
                    resolutionNotes: notes
                })
            });

            if (res.ok) {
                toast({ title: "Status Atualizado", description: "O pedido de ajuda foi atualizado." });
                onUpdate();
                onClose();
            } else {
                throw new Error("Failed");
            }
        } catch {
            toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    if (!request) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Pedido de Ajuda <Badge variant="secondary">#{request.protocol}</Badge>
                    </DialogTitle>
                    <DialogDescription>
                        Detalhes da solicitação de {request.schoolName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição do Problema</span>
                        <p className="text-sm text-slate-800 leading-relaxed">{request.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Atual</span>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="open">Aberto</SelectItem>
                                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                                    <SelectItem value="resolved">Resolvido</SelectItem>
                                    <SelectItem value="declined">Recusado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {status === 'resolved' && (
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo de Solução</span>
                                <Select value={resolutionType} onValueChange={setResolutionType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="local">Compra Local</SelectItem>
                                        <SelectItem value="central">Entrega/Ação Central</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notas de Resolução / Observações</span>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Descreva a solução adotada ou motivo da recusa..."
                            className="min-h-[100px]"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Fechar</Button>
                    <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Salvar Atualização
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function HelpRequestsPage() {
    const [requests, setRequests] = useState<HelpRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const fetchRequests = () => {
        setIsLoading(true);
        fetch(`/api/help-requests?status=${filterStatus}`)
            .then(res => res.json())
            .then(data => {
                if (data.helpRequests) setRequests(data.helpRequests);
            })
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchRequests();
    }, [filterStatus]);

    return (
        <AdminLayout
            title="Pedidos de Ajuda"
            description="Gerenciamento de solicitações e ocorrências das escolas."
        >
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-600">Filtrar por Status:</span>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-40 bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="open">Abertos</SelectItem>
                                <SelectItem value="in_progress">Em Andamento</SelectItem>
                                <SelectItem value="resolved">Resolvidos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-20 text-center text-slate-400">Carregando solicitações...</div>
                ) : requests.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {requests.map(req => (
                            <RequestCard key={req.id} request={req} onClick={() => setSelectedRequest(req)} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                        <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-600">Nenhum pedido de ajuda encontrado</h3>
                        <p className="text-slate-400">Nenhuma solicitação corresponde aos filtros selecionados.</p>
                    </div>
                )}

                <RequestDetailsModal
                    request={selectedRequest}
                    isOpen={!!selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    onUpdate={fetchRequests}
                />
            </div>
        </AdminLayout>
    );
}
