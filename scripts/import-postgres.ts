
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from '../src/db/schema';
import { schools, users, submissions, helpRequests } from '../src/db/schema';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';

dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
const serviceAccountBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
if (serviceAccountBase64 && !admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf-8'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error("Error initializing Firebase Admin:", error);
    }
}

async function main() {
    console.log("Connecting to Postgres...");
    if (!process.env.POSTGRES_URL) {
        console.error("POSTGRES_URL is missing in .env.local");
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
    });

    await client.connect();
    const db = drizzle(client, { schema });
    console.log("Connected.");

    const dumpPath = path.join(process.cwd(), 'firestore-dump.json');
    if (!fs.existsSync(dumpPath)) {
        console.error("Dump file not found:", dumpPath);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'));

    console.log("Starting import...");

    // 1. Schools
    if (data.schools) {
        console.log(`Importing ${data.schools.length} schools...`);
        for (const s of data.schools) {
            try {
                // Check if exists
                const existing = await db.select().from(schools).where(eq(schools.id, s.id));
                if (existing.length > 0) {
                    process.stdout.write('.');
                    continue; // Skip if exists
                }

                await db.insert(schools).values({
                    id: s.id,
                    name: s.name,
                    address: s.address || null,
                    phone: s.phone || (s.contacts?.whatsapp || null),
                    status: s.status || 'active',
                    totalStudents: {
                        morning: s.counts?.morning || 0,
                        afternoon: s.counts?.afternoon || 0,
                        night: s.counts?.night || 0,
                    },
                    contacts: {
                        email: s.contacts?.email || s.email || '',
                        whatsapp: s.contacts?.whatsapp || ''
                    },
                    responsibleIds: [],
                    inventory: s.inventory || [],
                    categories: s.categories || [],
                    updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
                });
                process.stdout.write('+');
            } catch (e) {
                console.error(`\nError importing school ${s.id}:`, e);
            }
        }
        console.log("\nSchools import done.");
    }

    // 2. Users
    if (data.users) {
        console.log(`Importing ${data.users.length} users...`);
        for (const u of data.users) {
            try {
                let uid = u.id;
                try {
                    const authUser = await admin.auth().getUserByEmail(u.email);
                    uid = authUser.uid;
                } catch (e) {
                    // console.warn(`Could not find Auth User for email ${u.email}, using dump ID ${u.id}`);
                }

                const existing = await db.select().from(users).where(eq(users.email, u.email));
                if (existing.length > 0) {
                    process.stdout.write('.');
                    continue;
                }

                await db.insert(users).values({
                    id: uid,
                    uid: uid,
                    name: u.name,
                    email: u.email,
                    role: u.role || 'school_responsible',
                    schoolId: u.schoolId || null,
                    phone: u.phone || null,
                    status: u.status || 'active',
                    createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
                });
                process.stdout.write('+');
            } catch (e) {
                console.error(`\nError importing user ${u.email}:`, e);
            }
        }
        console.log("\nUsers import done.");
    }

    // 3. Submissions
    if (data.submissions) {
        console.log(`Importing ${data.submissions.length} submissions...`);
        for (const sub of data.submissions) {
            try {
                const existing = await db.select().from(submissions).where(eq(submissions.id, sub.id));
                if (existing.length > 0) {
                    process.stdout.write('.');
                    continue;
                }

                await db.insert(submissions).values({
                    id: sub.id,
                    respondentName: sub.respondentName,
                    school: sub.school,
                    date: sub.date ? new Date(sub.date) : new Date(),
                    shift: sub.shift,
                    menuType: sub.menuType,
                    totalStudents: Number(sub.totalStudents),
                    presentStudents: Number(sub.presentStudents),
                    helpNeeded: !!sub.helpNeeded,
                    description: sub.description || null,
                    itemsPurchased: !!sub.itemsPurchased,
                    status: sub.status || 'pendente',
                    alternativeMenuDescription: sub.alternativeMenuDescription || null,
                    missingItems: sub.missingItems || null,
                    canBuyMissingItems: !!sub.canBuyMissingItems,
                    suppliesReceived: !!sub.suppliesReceived,
                    suppliesDescription: sub.suppliesDescription || null,
                    observations: sub.observations || null,
                    menuAdaptationReason: sub.menuAdaptationReason || null,
                    createdAt: sub.createdAt ? new Date(sub.createdAt) : new Date(),
                });
                process.stdout.write('+');
            } catch (e) {
                console.error(`\nError importing submission ${sub.id}:`, e);
            }
        }
        console.log("\nSubmissions import done.");
    }

    console.log("Import completed!");
    await client.end();
    process.exit(0);
}

main().catch(console.error);
