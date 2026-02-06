
import { db } from '../src/db/index'; // Ensure this works in ts-node or change to relative path
import { users, schools, helpRequests, submissions } from '../src/db/schema';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
    const dumpPath = path.join(process.cwd(), 'firestore-dump.json');
    if (!fs.existsSync(dumpPath)) {
        console.error("Dump file not found!");
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'));

    console.log("Importing Users...");
    for (const user of data.users) {
        // Transform if necessary
        await db.insert(users).values({
            id: user.id || user.uid, // Fallback if id is missing but uid exists
            uid: user.uid,
            name: user.name,
            email: user.email,
            role: user.role,
            schoolId: user.schoolId,
            phone: user.phone,
            createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
            status: user.status,
        }).onConflictDoNothing(); // prevent duplicates
    }

    console.log("Importing Schools...");
    for (const school of data.schools) {
        await db.insert(schools).values({
            id: school.id,
            name: school.name,
            totalStudents: school.totalStudents,
            contacts: school.contacts,
            responsibleIds: school.responsibleIds,
            updatedAt: school.updatedAt ? new Date(school.updatedAt) : new Date(),
        }).onConflictDoNothing();
    }

    console.log("Importing Help Requests...");
    for (const req of data.help_requests) {
        await db.insert(helpRequests).values({
            id: req.id,
            protocol: req.protocol || 'UNKNOWN',
            schoolId: req.schoolId,
            schoolName: req.schoolName,
            description: req.description,
            status: req.status,
            resolutionType: req.resolutionType,
            resolutionNotes: req.resolutionNotes,
            priority: req.priority,
            createdAt: req.createdAt ? new Date(req.createdAt) : new Date(),
            updatedAt: req.updatedAt ? new Date(req.updatedAt) : undefined,
        }).onConflictDoNothing();
    }

    console.log("Importing Submissions...");
    for (const sub of data.submissions) {
        await db.insert(submissions).values({
            id: sub.id,
            respondentName: sub.respondentName,
            school: sub.school,
            date: sub.date ? new Date(sub.date) : new Date(),
            shift: sub.shift,
            menuType: sub.menuType,
            totalStudents: parseInt(sub.totalStudents || '0'),
            presentStudents: parseInt(sub.presentStudents || '0'),
            helpNeeded: !!sub.helpNeeded,
            description: sub.description,
            itemsPurchased: !!sub.itemsPurchased,
            status: sub.status,
            alternativeMenuDescription: sub.alternativeMenuDescription,
            missingItems: sub.missingItems,
            canBuyMissingItems: !!sub.canBuyMissingItems,
            suppliesReceived: !!sub.suppliesReceived,
            suppliesDescription: sub.suppliesDescription,
            observations: sub.observations,
            helpRequestId: sub.helpRequestId,
            menuAdaptationReason: sub.menuAdaptationReason,
            createdAt: sub.createdAt ? new Date(sub.createdAt) : new Date(),
        }).onConflictDoNothing();
    }

    console.log("Import complete!");
}

main().catch(console.error);
