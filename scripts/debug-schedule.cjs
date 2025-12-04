
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Schedule Data (CommonJS) ---');
    console.log('DATABASE_URL is set:', !!process.env.DATABASE_URL);

    try {
        // 1. Check Users
        const users = await prisma.user.findMany({
            where: { role: 'STUDENT' },
            take: 5
        });
        console.log(`Found ${users.length} students.`);

        for (const user of users) {
            console.log(`\nChecking Student: ${user.name} (ID: ${user.id})`);

            // 2. Check Enrollments
            const enrollments = await prisma.courseEnrollment.findMany({
                where: { studentId: user.id, status: 'ACTIVE' },
                include: { course: true }
            });
            console.log(`- Active Enrollments: ${enrollments.length}`);
            enrollments.forEach(e => console.log(`  - ${e.course.courseCode}: ${e.course.courseName}`));

            if (enrollments.length === 0) continue;

            const courseIds = enrollments.map(e => e.courseId);

            // 3. Check Schedules for these courses
            const schedules = await prisma.schedule.findMany({
                where: {
                    courseId: { in: courseIds },
                    isActive: true
                },
                include: { course: true }
            });
            console.log(`- Active Schedules for enrolled courses: ${schedules.length}`);
            schedules.forEach(s => console.log(`  - ${s.course.courseCode} on Day ${s.dayOfWeek}: ${s.startTime} - ${s.endTime}`));
        }
    } catch (error) {
        console.error('Error querying database:', error);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
