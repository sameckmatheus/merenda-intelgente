import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { getFirestore } from 'firebase-admin/firestore';

initAdmin();

async function requireAuth() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get?.(AUTH_COOKIE_NAME) || cookieStore.get(AUTH_COOKIE_NAME as any);
    if (!sessionCookie) return null;

    if (!isFirebaseAdminInitialized() && process.env.NODE_ENV === 'development') {
        return { uid: 'dev-user' };
    }

    try {
        const decoded = await getAuth().verifySessionCookie((sessionCookie as any).value, true);
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
        if (!isFirebaseAdminInitialized() && process.env.NODE_ENV === 'development') {
            // Mock data for dev without firebase credentials
            return NextResponse.json({
                settings: {
                    schoolYear: '2025',
                    maintenanceMode: false,
                    deliveryDeadlineDays: 2,
                    notificationsEnabled: true,
                    inventoryCategories: ["Todos", "Estocáveis", "Proteínas", "Hortifruti", "Outros"], // Mock Default Categories
                    inventoryItems: [
                        { id: '1', name: 'Arroz', category: 'Estocáveis', unit: 'kg', minQuantity: 10 },
                        { id: '2', name: 'Feijão', category: 'Estocáveis', unit: 'kg', minQuantity: 10 },
                        { id: '3', name: 'Macarrão', category: 'Estocáveis', unit: 'kg', minQuantity: 5 },
                        { id: '4', name: 'Carne Moída', category: 'Proteínas', unit: 'kg', minQuantity: 5 },
                    ]
                }
            }, { status: 200 });
        }

        const db = getFirestore();
        const doc = await db.collection('system_settings').doc('general').get();

        if (!doc.exists) {
            return NextResponse.json({ settings: {} }, { status: 200 });
        }

        return NextResponse.json({ settings: doc.data() }, { status: 200 });
    } catch (e) {
        console.error('GET /api/settings error', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const authed = await requireAuth();
    if (!authed) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        if (!isFirebaseAdminInitialized() && process.env.NODE_ENV === 'development') {
            console.log('Mock saving system settings:', body);
            return NextResponse.json({ success: true }, { status: 200 });
        }

        const db = getFirestore();
        await db.collection('system_settings').doc('general').set({
            ...body,
            updatedAt: new Date(),
            updatedBy: authed.uid
        }, { merge: true });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (e) {
        console.error('POST /api/settings error', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
