import { PrismaClient } from '../src/generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Starting credentials update...');

    // 1. Update Professor IDs
    console.log('👨‍🏫 Updating Professor IDs...');

    // Fetch all professors sorted by name to ensure deterministic ordering
    const professors = await prisma.user.findMany({
        where: { role: 'PROFESSOR' },
        orderBy: { name: 'asc' }
    });

    console.log(`Found ${professors.length} professors.`);

    // Step 1: Move to temporary IDs to avoid unique constraint violations
    console.log('   ↳ Setting temporary IDs...');
    for (const professor of professors) {
        await prisma.user.update({
            where: { id: professor.id },
            data: { universityId: `TEMP_${professor.id}` }
        });
    }

    // Step 2: Set final IDs
    console.log('   ↳ Setting final IDs...');
    let currentId = 10000001;

    for (const professor of professors) {
        const newId = currentId.toString();

        await prisma.user.update({
            where: { id: professor.id },
            data: { universityId: newId }
        });

        console.log(`Updated ${professor.name}: -> ${newId}`);
        currentId++;
    }

    // 2. Unify Passwords
    console.log('🔐 Unifying passwords...');

    const newPassword = 'AAA123456$';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updateResult = await prisma.user.updateMany({
        data: { password: hashedPassword }
    });

    console.log(`✅ Updated password for ${updateResult.count} users to '${newPassword}'`);

    console.log('🎉 Credentials update completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error during update:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
