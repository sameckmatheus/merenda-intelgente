
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
