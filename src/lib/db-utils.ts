
import { db } from "@/db";
import { users, schools, helpRequests, submissions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getUserFromDb(uid: string) {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return result[0];
}

export async function getSchoolFromDb(schoolId: string) {
    const result = await db.select().from(schools).where(eq(schools.id, schoolId)).limit(1);
    return result[0];
}

import { auditLogs } from "@/db/schema";
import { v4 as uuidv4 } from 'uuid';

export async function logActivity(
    userId: string,
    userEmail: string | null | undefined,
    action: string,
    resource: string,
    resourceId: string | null = null,
    details: any = null
) {
    try {
        await db.insert(auditLogs).values({
            id: uuidv4(),
            userId,
            userEmail: userEmail || null,
            action,
            resource,
            resourceId,
            details: details ? details : null,
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
}
