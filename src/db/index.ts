
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: connectionString ? connectionString.split('?')[0] : undefined,
    ssl: {
        rejectUnauthorized: false
    }
});

export const db = drizzle(pool, { schema });
