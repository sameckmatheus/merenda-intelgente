"use client";

import { Building, MessageSquare, Users, Utensils } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Submission, menuTypeTranslations } from "@/lib/types";

interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

const DetailItem = ({ icon, label, value }: DetailItemProps) => (
  <div className="flex flex-col gap-1">
    <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">{icon} {label}</h4>
    <p className="text-sm text-foreground bg-slate-50 p-3 rounded-lg border">
      {value}
    </p>
  </div>
);

interface Props {
  submission: Submission | null;
  onClose: () => void;
}

export function SubmissionDetails({ submission, onClose }: Props) {
  if (!submission) return null;

  return (
    <Dialog open={!!submission} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building /> {submission.school}
          </DialogTitle>
          <DialogDescription>
            Registro de {submission.respondentName} para o turno da {submission.shift} em {format(new Date(submission.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <DetailItem
            icon={<Users />}
            label="Alunos"
            value={`${submission.presentStudents} presentes de ${submission.totalStudents}`}
          />
          <DetailItem
            icon={<Utensils />}
            label="Cardápio Servido"
            value={menuTypeTranslations[submission.menuType]}
          />
          {submission.description && (
            <DetailItem
              icon={<MessageSquare />}
              label="Observações"
              value={submission.description}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}