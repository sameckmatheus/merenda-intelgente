import { NextRequest, NextResponse } from 'next/server';
import { initAdmin, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

// Initialize Admin SDK
initAdmin();

export async function GET(request: NextRequest) {
  try {
    if (!isFirebaseAdminInitialized()) {
      console.warn('Firebase Admin not initialized');
      return NextResponse.json({ bySchool: [], byStatus: [] });
    }

    const searchParams = request.nextUrl.searchParams;
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    const school = searchParams.get('school');
    const status = searchParams.get('status');
    const helpNeeded = searchParams.get('helpNeeded');

    const db = getFirestore();

    // ROBUST STRATEGY: Fetch latest 500 records and filter in memory.
    const query = db.collection('submissions')
      .orderBy('date', 'desc')
      .limit(500);

    const snapshot = await query.get();

    const bySchool: Record<string, number> = {};
    const byStatus: Record<string, number> = {
      pendente: 0,
      atendido: 0,
      atendido_parcialmente: 0,
      recusado: 0
    };

    // Prepare date range filter
    let startDate = 0;
    let endDate = Number.MAX_SAFE_INTEGER;

    if (startParam && endParam) {
      startDate = Number(startParam);
      endDate = Number(endParam);
    } else {
      startDate = Date.now() - (30 * 24 * 60 * 60 * 1000);
    }

    snapshot.docs.forEach(doc => {
      const data = doc.data();

      // ROBUST DATE PARSING
      let docDateMs = 0;
      if (data.date && typeof data.date.toMillis === 'function') {
        docDateMs = data.date.toMillis();
      } else if (data.date instanceof Date) {
        docDateMs = data.date.getTime();
      } else if (typeof data.date === 'number') {
        docDateMs = data.date;
      } else if (typeof data.date === 'string') {
        docDateMs = new Date(data.date).getTime();
      }

      // Filter by Date Range
      if (docDateMs < startDate || docDateMs > endDate) return;

      // Filter by School
      if (school && school !== 'all' && data.school !== school) return;

      // Filter by Status
      if (status && status !== 'all' && data.status !== status) return;

      // Filter by Help Needed
      if (helpNeeded === 'yes' && data.helpNeeded !== true) return;
      if (helpNeeded === 'no' && data.helpNeeded !== false) return;

      // Aggregations
      const sName = data.school || 'Sem Escola';
      bySchool[sName] = (bySchool[sName] || 0) + 1;

      const fStatus = data.status || 'pendente';
      if (typeof byStatus[fStatus] !== 'undefined') {
        byStatus[fStatus]++;
      } else {
        byStatus[fStatus] = (byStatus[fStatus] || 0) + 1;
      }
    });

    const bySchoolArray = Object.entries(bySchool)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const byStatusArray = Object.entries(byStatus)
      .map(([name, value]) => ({ name, value }));

    return NextResponse.json({
      bySchool: bySchoolArray,
      byStatus: byStatusArray
    });

  } catch (error: any) {
    console.error('CRITICAL ERROR serving report summary:', error);
    // Return empty success response to prevent UI crash
    return NextResponse.json({
      bySchool: [],
      byStatus: [],
      debug_error: String(error)
    }, { status: 200 });
  }
}
