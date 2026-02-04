
import { initAdmin } from '../src/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { SCHOOL_ACCOUNTS } from '../src/lib/school-auth';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Ensure admin is initialized
// Use local .env or fallback
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

initAdmin();

// Generate a unique password for each school based on their name
function generateSchoolPassword(schoolName: string): string {
    // Create a hash from the school name and add a prefix
    const hash = crypto.createHash('md5').update(schoolName).digest('hex').substring(0, 8);
    return `Escola${hash}!`;
}

async function createUsers() {
    const auth = getAuth();
    const credentials: Array<{ school: string; email: string; password: string }> = [];

    console.log(`Starting user creation for ${Object.keys(SCHOOL_ACCOUNTS).length} schools...`);

    for (const [email, name] of Object.entries(SCHOOL_ACCOUNTS)) {
        const password = generateSchoolPassword(name);

        try {
            // Check if user exists
            try {
                const existingUser = await auth.getUserByEmail(email);
                console.log(`User ${email} already exists. Updating password...`);
                // Update password
                await auth.updateUser(existingUser.uid, { password });
                credentials.push({ school: name, email, password });
            } catch (error: any) {
                if (error.code === 'auth/user-not-found') {
                    // Create user
                    await auth.createUser({
                        email,
                        password,
                        displayName: name,
                        emailVerified: true,
                    });
                    console.log(`Created user: ${email} (${name})`);
                    credentials.push({ school: name, email, password });
                } else {
                    throw error;
                }
            }
        } catch (e) {
            console.error(`Failed to process ${email}:`, e);
        }
    }

    // Export credentials to CSV
    const outputDir = path.join(process.cwd(), 'scripts', 'output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const csvPath = path.join(outputDir, 'school-credentials.csv');
    const csvContent = [
        'Escola,Email,Senha',
        ...credentials.map(c => `"${c.school}","${c.email}","${c.password}"`)
    ].join('\n');

    fs.writeFileSync(csvPath, csvContent, 'utf-8');

    console.log('\n✅ Done!');
    console.log(`📄 Credentials exported to: ${csvPath}`);
    console.log(`\n📊 Summary: ${credentials.length} school accounts created/updated`);
}

createUsers().catch(console.error);
