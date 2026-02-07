
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from '../src/db/schema';
import { schools, users, submissions } from '../src/db/schema';
import * as dotenv from 'dotenv';
import { count } from 'drizzle-orm';

dotenv.config({ path: '.env.local' });

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

    try {
        const schoolsCount = await db.select({ count: count() }).from(schools);
        const usersCount = await db.select({ count: count() }).from(users);
        const submissionsCount = await db.select({ count: count() }).from(submissions);

        console.log("--- Migration Verification ---");
        console.log(`Schools: ${schoolsCount[0].count}`);
        console.log(`Users: ${usersCount[0].count}`);
        console.log(`Submissions: ${submissionsCount[0].count}`);
        console.log("------------------------------");

    } catch (e) {
        console.error("Verification failed:", e);
    } finally {
        await client.end();
    }
}

main().catch(console.error);
