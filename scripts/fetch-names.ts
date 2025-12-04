import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
    const professors = await prisma.user.findMany({
        where: { role: 'PROFESSOR' },
        orderBy: { universityId: 'asc' },
        select: { name: true }
    });

    console.log(JSON.stringify(professors.map(p => p.name), null, 2));
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
