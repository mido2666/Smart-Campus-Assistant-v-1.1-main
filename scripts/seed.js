const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@smartcampus.edu' },
      update: {},
      create: {
        universityId: 'ADMIN001',
        email: 'admin@smartcampus.edu',
        password: adminPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'ADMIN',
      },
    });
    console.log('✅ Admin user created:', admin.email);

    // Create professor users
    const professorPassword = await bcrypt.hash('prof123', 12);
    const professor1 = await prisma.user.upsert({
      where: { email: 'john.doe@smartcampus.edu' },
      update: {},
      create: {
        universityId: 'PROF001',
        email: 'john.doe@smartcampus.edu',
        password: professorPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'PROFESSOR',
      },
    });

    const professor2 = await prisma.user.upsert({
      where: { email: 'jane.smith@smartcampus.edu' },
      update: {},
      create: {
        universityId: 'PROF002',
        email: 'jane.smith@smartcampus.edu',
        password: professorPassword,
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'PROFESSOR',
      },
    });
    console.log('✅ Professor users created');

    // Create student users
    const studentPassword = await bcrypt.hash('student123', 12);
    const students = [];
    for (let i = 1; i <= 20; i++) {
      const student = await prisma.user.upsert({
        where: { email: `student${i.toString().padStart(3, '0')}@smartcampus.edu` },
        update: {},
        create: {
          universityId: `STU${i.toString().padStart(3, '0')}`,
          email: `student${i.toString().padStart(3, '0')}@smartcampus.edu`,
          password: studentPassword,
          firstName: `Student${i}`,
          lastName: 'Example',
          role: 'STUDENT',
        },
      });
      students.push(student);
    }
    console.log('✅ Student users created');

    // Create courses
    const courses = [];
    const courseData = [
      {
        courseCode: 'CS101',
        courseName: 'Introduction to Computer Science',
        description: 'Fundamental concepts of computer science and programming',
        credits: 3,
        professorId: professor1.id,
      },
      {
        courseCode: 'CS201',
        courseName: 'Data Structures and Algorithms',
        description: 'Advanced programming concepts and algorithm design',
        credits: 4,
        professorId: professor1.id,
      },
      {
        courseCode: 'MATH101',
        courseName: 'Calculus I',
        description: 'Introduction to differential and integral calculus',
        credits: 4,
        professorId: professor2.id,
      },
      {
        courseCode: 'PHYS101',
        courseName: 'Physics I',
        description: 'Mechanics, thermodynamics, and waves',
        credits: 4,
        professorId: professor2.id,
      },
      {
        courseCode: 'ENG101',
        courseName: 'English Composition',
        description: 'Academic writing and communication skills',
        credits: 3,
        professorId: professor1.id,
      },
    ];

    for (const courseInfo of courseData) {
      const course = await prisma.course.upsert({
        where: { courseCode: courseInfo.courseCode },
        update: {},
        create: courseInfo,
      });
      courses.push(course);
    }
    console.log('✅ Courses created');

    // Create course enrollments
    for (const course of courses) {
      // Enroll first 10 students in each course
      for (let i = 0; i < Math.min(10, students.length); i++) {
        await prisma.courseEnrollment.upsert({
          where: {
            studentId_courseId: {
              studentId: students[i].id,
              courseId: course.id,
            },
          },
          update: {},
          create: {
            studentId: students[i].id,
            courseId: course.id,
            status: 'ACTIVE',
          },
        });
      }
    }
    console.log('✅ Course enrollments created');

    // Create schedules
    const scheduleData = [
      {
        courseId: courses[0].id,
        professorId: professor1.id,
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '10:30',
        room: 'CS-101',
        semester: 'Fall 2024',
      },
      {
        courseId: courses[0].id,
        professorId: professor1.id,
        dayOfWeek: 3, // Wednesday
        startTime: '09:00',
        endTime: '10:30',
        room: 'CS-101',
        semester: 'Fall 2024',
      },
      {
        courseId: courses[1].id,
        professorId: professor1.id,
        dayOfWeek: 2, // Tuesday
        startTime: '11:00',
        endTime: '12:30',
        room: 'CS-201',
        semester: 'Fall 2024',
      },
      {
        courseId: courses[1].id,
        professorId: professor1.id,
        dayOfWeek: 4, // Thursday
        startTime: '11:00',
        endTime: '12:30',
        room: 'CS-201',
        semester: 'Fall 2024',
      },
      {
        courseId: courses[2].id,
        professorId: professor2.id,
        dayOfWeek: 1, // Monday
        startTime: '14:00',
        endTime: '15:30',
        room: 'MATH-101',
        semester: 'Fall 2024',
      },
      {
        courseId: courses[2].id,
        professorId: professor2.id,
        dayOfWeek: 3, // Wednesday
        startTime: '14:00',
        endTime: '15:30',
        room: 'MATH-101',
        semester: 'Fall 2024',
      },
    ];

    for (const scheduleInfo of scheduleData) {
      await prisma.schedule.upsert({
        where: {
          courseId_professorId_dayOfWeek_startTime: {
            courseId: scheduleInfo.courseId,
            professorId: scheduleInfo.professorId,
            dayOfWeek: scheduleInfo.dayOfWeek,
            startTime: scheduleInfo.startTime,
          },
        },
        update: {},
        create: scheduleInfo,
      });
    }
    console.log('✅ Schedules created');

    // Create sample QR codes
    const qrCodes = [];
    for (let i = 0; i < 3; i++) {
      const qrCode = await prisma.qRCode.create({
        data: {
          sessionId: `session_${Date.now()}_${i}`,
          courseId: courses[i % courses.length].id,
          professorId: courses[i % courses.length].professorId,
          title: `Lecture ${i + 1}`,
          description: `QR code for lecture ${i + 1}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          isActive: true,
        },
      });
      qrCodes.push(qrCode);
    }
    console.log('✅ QR codes created');

    // Create sample attendance records
    for (const qrCode of qrCodes) {
      const course = courses.find(c => c.id === qrCode.courseId);
      const enrolledStudents = await prisma.courseEnrollment.findMany({
        where: { courseId: course.id, status: 'ACTIVE' },
        include: { student: true },
      });

      // Mark attendance for 80% of students
      const attendanceCount = Math.floor(enrolledStudents.length * 0.8);
      for (let i = 0; i < attendanceCount; i++) {
        await prisma.attendanceRecord.upsert({
          where: {
            studentId_qrCodeId: {
              studentId: enrolledStudents[i].studentId,
              qrCodeId: qrCode.id,
            },
          },
          update: {},
          create: {
            studentId: enrolledStudents[i].studentId,
            courseId: qrCode.courseId,
            qrCodeId: qrCode.id,
            status: 'PRESENT',
            markedAt: new Date(),
          },
        });
      }
    }
    console.log('✅ Attendance records created');

    // Create notification settings for all users
    const allUsers = await prisma.user.findMany();
    for (const user of allUsers) {
      await prisma.notificationSettings.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          emailNotifications: true,
          pushNotifications: true,
          examNotifications: true,
          assignmentNotifications: true,
          attendanceNotifications: true,
          courseNotifications: true,
          systemNotifications: true,
          emailFrequency: 'IMMEDIATE',
        },
      });
    }
    console.log('✅ Notification settings created');

    // Create sample notifications
    const notificationData = [
      {
        userId: students[0].id,
        title: 'Welcome to Smart Campus Assistant',
        message: 'Welcome to the Smart Campus Assistant! You can now track your attendance, view your schedule, and get help from our AI chatbot.',
        type: 'INFO',
        category: 'SYSTEM',
      },
      {
        userId: students[0].id,
        title: 'New Assignment Posted',
        message: 'A new assignment has been posted for CS101 - Introduction to Computer Science.',
        type: 'INFO',
        category: 'ASSIGNMENT',
      },
      {
        userId: professor1.id,
        title: 'Class Reminder',
        message: 'You have a class scheduled for CS101 in 30 minutes.',
        type: 'REMINDER',
        category: 'COURSE',
      },
    ];

    for (const notificationInfo of notificationData) {
      await prisma.notification.create({
        data: notificationInfo,
      });
    }
    console.log('✅ Sample notifications created');

    // Create sample chat sessions
    for (let i = 0; i < 5; i++) {
      const chatSession = await prisma.chatSession.create({
        data: {
          userId: students[i].id,
          sessionName: `Chat Session ${i + 1}`,
          isActive: true,
          language: 'en',
          lastMessageAt: new Date(),
        },
      });

      // Create sample messages
      await prisma.chatMessage.createMany({
        data: [
          {
            sessionId: chatSession.id,
            role: 'USER',
            content: 'Hello, I need help with my attendance.',
            language: 'en',
            isProcessed: true,
            responseTime: 1500,
          },
          {
            sessionId: chatSession.id,
            role: 'ASSISTANT',
            content: 'Hello! I can help you with your attendance. You can view your attendance records in the attendance section of the dashboard.',
            language: 'en',
            isProcessed: true,
            responseTime: 1500,
          },
        ],
      });
    }
    console.log('✅ Sample chat sessions created');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Admin user: admin@smartcampus.edu (password: admin123)`);
    console.log(`- Professor users: 2 created`);
    console.log(`- Student users: 20 created`);
    console.log(`- Courses: ${courses.length} created`);
    console.log(`- Schedules: ${scheduleData.length} created`);
    console.log(`- QR codes: ${qrCodes.length} created`);
    console.log(`- Attendance records: Sample data created`);
    console.log(`- Notifications: Sample data created`);
    console.log(`- Chat sessions: Sample data created`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
