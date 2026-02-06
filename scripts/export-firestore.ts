
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin (reuse logic or simple init)
const serviceAccountBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;

if (!serviceAccountBase64) {
    console.error("Error: GOOGLE_APPLICATION_CREDENTIALS_BASE64 is not set in .env.local");
    process.exit(1);
}

try {
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf-8'));
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
} catch (error) {
    console.error("Error parsing service account:", error);
    process.exit(1);
}

const db = admin.firestore();

async function exportCollection(collectionName: string) {
    console.log(`Exporting ${collectionName}...`);
    const snapshot = await db.collection(collectionName).get();
    return snapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Timestamps to ISO strings or keep as objects?
        // Let's keep as is for now, but handle serialization helper
        return {
            id: doc.id,
            ...data
        };
    });
}

// Helper to handle Timestamp serialization
function serialize(key: string, value: any) {
    if (value && typeof value === 'object' && value.constructor.name === 'Timestamp') {
        return value.toDate().toISOString(); // Convert Firebase Timestamp to ISO Date string
    }
    if (value && typeof value === 'object' && '_seconds' in value && '_nanoseconds' in value) {
        return new Date(value._seconds * 1000 + value._nanoseconds / 1000000).toISOString();
    }
    return value;
}

async function main() {
    const data = {
        users: await exportCollection('users'),
        schools: await exportCollection('schools'),
        help_requests: await exportCollection('help_requests'),
        submissions: await exportCollection('submissions'),
    };

    const dumpPath = path.join(process.cwd(), 'firestore-dump.json');
    fs.writeFileSync(dumpPath, JSON.stringify(data, serialize, 2));
    console.log(`Data exported to ${dumpPath}`);
}

main().catch(console.error);
