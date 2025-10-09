import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { getFirestore, Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
// Use dynamic require for optional dependency to avoid TS errors when types are not installed
let PDFDocument: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  PDFDocument = require('pdfkit');
} catch (e) {
  PDFDocument = undefined;
}

initAdmin();

async function requireAuth() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);
  if (!sessionCookie) return null;
  try {
    const decoded = await getAuth().verifySessionCookie(sessionCookie.value, true);
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const authed = await requireAuth();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const school = searchParams.get('school');

    const db = getFirestore();
    let q = db.collection('submissions') as FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;
    if (start && end) {
      q = q
        .where('date', '>=', AdminTimestamp.fromMillis(Number(start)))
        .where('date', '<=', AdminTimestamp.fromMillis(Number(end)));
    }
    if (school && school !== 'all') {
      q = q.where('school', '==', school);
    }
    const snapshot = await q.get();
    const submissions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (!PDFDocument) {
      return NextResponse.json({ error: 'PDF generation not available' }, { status: 500 });
    }

    const doc = new PDFDocument({ margin: 40 });
    const chunks: Uint8Array[] = [];
    const stream = doc as unknown as NodeJS.ReadableStream;
    doc.fontSize(18).text('Relatório Geral - MenuPlanner', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#666').text(new Date().toLocaleString('pt-BR'), { align: 'center' });
    doc.moveDown();

    // Sumário de Aquisição (agregado simples por itens)
    const aggregateItems: Record<string, number> = {};
    submissions.forEach((s: any) => {
      if (s.missingItems) {
        // estratégia simples: contar linhas/itens separados por vírgula
        const parts = String(s.missingItems).split(/[,\n]/).map((p) => p.trim()).filter(Boolean);
        parts.forEach((p) => {
          aggregateItems[p] = (aggregateItems[p] || 0) + 1;
        });
      }
    });

    doc.fontSize(14).fillColor('#000').text('Resumo para Aquisição de Materiais', { underline: true });
    doc.moveDown(0.5);
    const aggEntries = Object.entries(aggregateItems);
    if (aggEntries.length === 0) {
      doc.fontSize(11).text('Nenhum item agregado no período.');
    } else {
      aggEntries.sort((a, b) => b[1] - a[1]).forEach(([item, count]) => {
        doc.fontSize(11).text(`- ${item}: ${count}`);
      });
    }
    doc.moveDown();

    // Seção por Escola / Registro
    doc.fontSize(14).text('Distribuição por Escola (Registros)', { underline: true });
    doc.moveDown(0.5);
    submissions.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

    submissions.forEach((s: any, idx: number) => {
      if (idx > 0) doc.moveDown(0.5);
      const dateStr = s.date?.toDate?.() ? s.date.toDate().toLocaleDateString('pt-BR') : new Date(s.date?.toMillis?.() || s.date || 0).toLocaleDateString('pt-BR');
      doc.fontSize(12).fillColor('#111').text(`${s.school} — ${dateStr} — ${s.shift || ''}`);
      doc.fontSize(10).fillColor('#333').text(`Responsável: ${s.respondentName || '-'}`);
      doc.fontSize(10).text(`Cardápio: ${s.menuType || '-'}`);
      doc.fontSize(10).text(`Alunos: ${s.presentStudents || 0}/${s.totalStudents || 0}`);
      doc.fontSize(10).text(`Status: ${s.status || 'pendente'}`);
      if (s.helpNeeded) doc.fontSize(10).text(`Pedido de Ajuda: Sim`);
      if (s.missingItems) doc.fontSize(10).text(`Itens em Falta: ${s.missingItems}`);
      if (s.canBuyMissingItems !== undefined) doc.fontSize(10).text(`Pode Comprar Itens: ${s.canBuyMissingItems ? 'Sim' : 'Não'}`);
      if (s.itemsPurchased) doc.fontSize(10).text(`Itens Comprados: ${s.itemsPurchased}`);
      if (s.suppliesReceived !== undefined) doc.fontSize(10).text(`Recebeu Suprimentos: ${s.suppliesReceived ? 'Sim' : 'Não'}`);
      if (s.suppliesDescription) doc.fontSize(10).text(`Suprimentos Recebidos: ${s.suppliesDescription}`);
      if (s.alternativeMenuDescription) doc.fontSize(10).text(`Detalhe Cardápio Alternativo: ${s.alternativeMenuDescription}`);
      if (s.observations) doc.fontSize(10).text(`Observações: ${s.observations}`);
      doc.moveDown(0.25);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#eee').stroke();
    });

    doc.end();
    const pdfBuffer: Buffer = await new Promise<Buffer>((resolve, reject) => {
      (stream as any).on('data', (chunk: Buffer) => chunks.push(chunk));
      (stream as any).on('end', () => resolve(Buffer.concat(chunks)));
      (stream as any).on('error', (err: any) => reject(err));
    });

    const body = new Uint8Array(pdfBuffer as any);
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="relatorio-geral.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    console.error('GET /api/reports/general error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


