
import { SCHOOL_ACCOUNTS } from '../src/lib/school-auth';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Generate a unique password for each school based on their name
function generateSchoolPassword(schoolName: string): string {
    // Create a hash from the school name and add a prefix
    const hash = crypto.createHash('md5').update(schoolName).digest('hex').substring(0, 8);
    return `Escola${hash}!`;
}

async function generateCredentials() {
    const credentials: Array<{ account: string; schools: string[]; email: string; password: string }> = [];

    console.log(`Generating credentials for ${Object.keys(SCHOOL_ACCOUNTS).length} school accounts...\n`);

    for (const [email, schools] of Object.entries(SCHOOL_ACCOUNTS)) {
        // Use the first school's name to generate password for consistency
        const password = generateSchoolPassword(schools[0]);
        credentials.push({ account: schools[0], schools, email, password });
        console.log(`✓ ${schools.join(' + ')}`);
    }

    // Export credentials to CSV
    const outputDir = path.join(process.cwd(), 'scripts', 'output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const csvPath = path.join(outputDir, 'school-credentials.csv');
    const csvContent = [
        'Escola(s),Email,Senha',
        ...credentials.map(c => `"${c.schools.join(' + ')}","${c.email}","${c.password}"`)
    ].join('\n');

    fs.writeFileSync(csvPath, csvContent, 'utf-8');

    console.log('\n✅ Done!');
    console.log(`📄 Credentials exported to: ${csvPath}`);
    console.log(`📊 Total: ${credentials.length} school accounts\n`);
    console.log('Next steps:');
    console.log('1. Open Firebase Console: https://console.firebase.google.com/');
    console.log('2. Go to Authentication > Users');
    console.log('3. Create users manually using the credentials from the CSV file');
    console.log('\nNote: Accounts managing multiple schools will see tabs to switch between them.');
}

generateCredentials().catch(console.error);
