
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Submission } from '@/app/admin/page';
import { Logo } from '@/components/logo';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Printer } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const DetailItem = ({ label, value }: { label: string; value?: string | number | boolean | null }) => {
  if (value === null || value === undefined || value === '' || value === false) return null;

  return (
    <div className="grid grid-cols-3 gap-2">
      <p className="font-semibold text-gray-600 col-span-1">{label}:</p>
      <p className="text-gray-800 col-span-2">{typeof value === 'boolean' ? 'Sim' : String(value)}</p>
    </div>
  );
};

export default function SubmissionReceipt() {
  const { id } = useParams();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof id !== 'string') return;

    const fetchSubmission = async () => {
      try {
        const docRef = doc(db, 'submissions', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setSubmission({ id: docSnap.id, ...docSnap.data() } as Submission);
        } else {
          setError('Nenhum registro encontrado com este ID.');
        }
      } catch (e) {
        console.error('Erro ao buscar registro:', e);
        setError('Falha ao carregar os dados do registro.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmission();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };
  
  const menuTypeTranslations: {[key: string]: string} = {
    planned: "Previsto",
    alternative: "Alternativo",
    improvised: "Improvisado"
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!submission) {
    return null;
  }

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-end mb-4 print:hidden">
          <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Imprimir / Salvar PDF</Button>
        </div>
        <div ref={printRef} className="bg-white p-8 sm:p-12 shadow-lg rounded-lg print:shadow-none print:p-0">
          <header className="flex items-center justify-between pb-8 border-b-2 border-gray-200">
            <div className="flex items-center gap-4">
              <Logo className="h-20 w-20" />
              <div>
                <h1 className="text-xl font-bold text-gray-800">Prefeitura de Itapissuma</h1>
                <h2 className="text-lg text-gray-600">Secretaria de Educação</h2>
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-2xl font-bold text-gray-800">Nota de Detalhamento</h3>
              <p className="text-sm text-gray-500">ID: {submission.id}</p>
            </div>
          </header>

          <section className="my-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <DetailItem label="Escola" value={submission.school} />
              <DetailItem label="Responsável" value={submission.respondentName} />
              <DetailItem label="Data do Registro" value={format(submission.date.toDate(), 'PPP', { locale: ptBR })} />
              <DetailItem label="Turno" value={submission.shift} />
            </div>
          </section>

          <Separator className="my-8" />
          
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Detalhes da Merenda</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <DetailItem label="Alunos Totais" value={submission.totalStudents} />
                <DetailItem label="Alunos Presentes" value={submission.presentStudents} />
                <DetailItem label="Cardápio Utilizado" value={menuTypeTranslations[submission.menuType]} />
             </div>
              <div className="mt-4">
                <DetailItem label="Descrição Cardápio Alternativo" value={submission.alternativeMenuDescription} />
              </div>
          </section>

          <Separator className="my-8" />

          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Controle de Itens e Suprimentos</h3>
            <div className="space-y-4">
                <DetailItem label="Pedido de Ajuda" value={submission.helpNeeded} />
                <DetailItem label="Itens em Falta" value={submission.missingItems} />
                <DetailItem label="Pode Comprar os Itens" value={submission.canBuyMissingItems} />
                <DetailItem label="Itens Comprados" value={submission.itemsPurchased} />
                <Separator />
                <DetailItem label="Recebeu Suprimentos" value={submission.suppliesReceived} />
                <DetailItem label="Suprimentos Recebidos" value={submission.suppliesDescription} />
            </div>
          </section>

          <Separator className="my-8" />

          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Observações Gerais</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{submission.observations || 'Nenhuma observação.'}</p>
          </section>
          
           <footer className="mt-12 pt-8 border-t-2 border-gray-200 text-center text-sm text-gray-500">
                <p>Documento gerado em {format(new Date(), "dd 'de' MMMM 'de' yyyy, 'às' HH:mm", { locale: ptBR })}</p>
                <p>MenuPlanner - Sistema de Gestão de Merenda Escolar</p>
           </footer>
        </div>
      </div>
       <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\:hidden {
            display: none;
          }
          .print\:shadow-none {
            box-shadow: none;
          }
           .print\:p-0 {
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}
