
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to database...');
        // Try to get the first user to make sure connection works
        const user = await prisma.user.findFirst();
        console.log('User found:', user ? user.id : 'None');

        if (user) {
            console.log(`Fetching notifications for user ${user.id}...`);
            const notifications = await prisma.notification.findMany({
                where: { userId: user.id },
                take: 5
            });
            console.log('Notifications fetched successfully:', notifications);
        } else {
            console.log('No users found to test notifications.');
        }

    } catch (error) {
        console.error('Error occurred:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
