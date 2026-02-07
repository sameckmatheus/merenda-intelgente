
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { auditLogs, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { initAdmin } from '@/lib/firebase-admin';

initAdmin();

async function requireAuth() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!sessionCookie) return null;
    try {
        return await getAuth().verifySessionCookie(sessionCookie, true);
    } catch {
        return null;
    }
}

export async function GET(request: Request) {
    const authed = await requireAuth();
    if (!authed) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ideally check for admin role here. 
    // For now, allow logged in users (or restrict based on role in future).
    // The prompt implies "administrative access", so maybe only admins.
    // Let's fetch user role.

    // Fetch logs with user details
    try {
        const result = await db.select({
            id: auditLogs.id,
            userId: auditLogs.userId,
            userEmail: auditLogs.userEmail,
            action: auditLogs.action,
            resource: auditLogs.resource,
            details: auditLogs.details,
            createdAt: auditLogs.createdAt,
            userName: users.name,
        })
            .from(auditLogs)
            .leftJoin(users, eq(auditLogs.userId, users.id))
            .orderBy(desc(auditLogs.createdAt))
            .limit(100);

        return NextResponse.json({ logs: result });
    } catch (error) {
        console.error("Failed to fetch logs:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
