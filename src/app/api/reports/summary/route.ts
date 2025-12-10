import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    const school = searchParams.get('school');
    const status = searchParams.get('status');
    const helpNeeded = searchParams.get('helpNeeded');

    const constraints: any[] = [];

    if (startParam && endParam) {
      const startDate = new Date(Number(startParam));
      const endDate = new Date(Number(endParam));
      constraints.push(where('date', '>=', Timestamp.fromDate(startDate)));
      constraints.push(where('date', '<=', Timestamp.fromDate(endDate)));
    } else {
      // Default to last 30 days if no date
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      constraints.push(where('date', '>=', Timestamp.fromDate(start)));
    }

    if (school) {
      constraints.push(where('school', '==', school));
    }

    if (status) {
      constraints.push(where('status', '==', status));
    }

    // Help Needed filtering is done in memory usually if field is boolean, or exact match if string 'yes'/'no' mapped to boolean
    // Assuming helpNeeded is boolean in db
    let filterHelp: boolean | null = null;
    if (helpNeeded === 'yes') filterHelp = true;
    if (helpNeeded === 'no') filterHelp = false;


    const q = query(collection(db, 'submissions'), ...constraints);
    const snapshot = await getDocs(q);

    const bySchool: Record<string, number> = {};
    const byStatus: Record<string, number> = {
      pendente: 0,
      confirmado: 0,
      cancelado: 0
    };

    snapshot.docs.forEach(doc => {
      const data = doc.data();

      // Memory filtering for helpNeeded if set
      if (filterHelp !== null && data.helpNeeded !== filterHelp) return;

      // By School
      const sName = data.school || 'Sem Escola';
      bySchool[sName] = (bySchool[sName] || 0) + 1;

      // By Status
      const fStatus = data.status || 'pendente';
      if (typeof byStatus[fStatus] !== 'undefined') {
        byStatus[fStatus]++;
      } else {
        byStatus[fStatus] = (byStatus[fStatus] || 0) + 1;
      }
    });

    const bySchoolArray = Object.entries(bySchool).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    const byStatusArray = Object.entries(byStatus).map(([name, value]) => ({ name, value }));

    return NextResponse.json({
      bySchool: bySchoolArray,
      byStatus: byStatusArray
    });

  } catch (error) {
    console.error('Error serving report summary', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
