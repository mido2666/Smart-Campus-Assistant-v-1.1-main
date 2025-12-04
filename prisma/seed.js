const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.attendanceRecord.deleteMany();
  await prisma.qRCode.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.courseEnrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationSettings.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️ Cleared existing data');

  // Create professors
  const professors = [
    {
      universityId: '11111111',
      email: 'ahmed.elsayed@university.edu',
      password: await bcrypt.hash('111111', 10),
      firstName: 'Ahmed',
      lastName: 'El-Sayed',
      role: 'PROFESSOR',
    },
    {
      universityId: '22222222',
      email: 'mona.ibrahim@university.edu',
      password: await bcrypt.hash('222222', 10),
      firstName: 'Mona',
      lastName: 'Ibrahim',
      role: 'PROFESSOR',
    },
    {
      universityId: '33333333',
      email: 'youssef.ahmed@university.edu',
      password: await bcrypt.hash('333333', 10),
      firstName: 'Youssef',
      lastName: 'Ahmed',
      role: 'PROFESSOR',
    },
    {
      universityId: '44444444',
      email: 'fatma.hassan@university.edu',
      password: await bcrypt.hash('444444', 10),
      firstName: 'Fatma',
      lastName: 'Hassan',
      role: 'PROFESSOR',
    },
    {
      universityId: '55555555',
      email: 'omar.mahmoud@university.edu',
      password: await bcrypt.hash('555555', 10),
      firstName: 'Omar',
      lastName: 'Mahmoud',
      role: 'PROFESSOR',
    },
  ];

  const createdProfessors = [];
  for (const professor of professors) {
    const created = await prisma.user.create({
      data: professor,
    });
    createdProfessors.push(created);
    console.log(`👨‍🏫 Created professor: ${professor.firstName} ${professor.lastName} (${professor.universityId})`);
  }

  // Create students
  const students = [
    {
      universityId: '20221245',
      email: 'mohamed.hassan@university.edu',
      password: await bcrypt.hash('123456', 10),
      firstName: 'Mohamed',
      lastName: 'Hassan',
      role: 'STUDENT',
    },
    {
      universityId: '12345678',
      email: 'ahmed.hassan@university.edu',
      password: await bcrypt.hash('123456', 10),
      firstName: 'Ahmed',
      lastName: 'Hassan',
      role: 'STUDENT',
    },
    {
      universityId: '23456789',
      email: 'sara.mohamed@university.edu',
      password: await bcrypt.hash('234567', 10),
      firstName: 'Sara',
      lastName: 'Mohamed',
      role: 'STUDENT',
    },
    {
      universityId: '34567890',
      email: 'omar.ali@university.edu',
      password: await bcrypt.hash('345678', 10),
      firstName: 'Omar',
      lastName: 'Ali',
      role: 'STUDENT',
    },
    {
      universityId: '45678901',
      email: 'nour.ibrahim@university.edu',
      password: await bcrypt.hash('456789', 10),
      firstName: 'Nour',
      lastName: 'Ibrahim',
      role: 'STUDENT',
    },
    {
      universityId: '56789012',
      email: 'youssef.mahmoud@university.edu',
      password: await bcrypt.hash('567890', 10),
      firstName: 'Youssef',
      lastName: 'Mahmoud',
      role: 'STUDENT',
    },
    {
      universityId: '67890123',
      email: 'fatma.ahmed@university.edu',
      password: await bcrypt.hash('678901', 10),
      firstName: 'Fatma',
      lastName: 'Ahmed',
      role: 'STUDENT',
    },
    {
      universityId: '78901234',
      email: 'ali.hassan@university.edu',
      password: await bcrypt.hash('789012', 10),
      firstName: 'Ali',
      lastName: 'Hassan',
      role: 'STUDENT',
    },
    {
      universityId: '89012345',
      email: 'mariam.sayed@university.edu',
      password: await bcrypt.hash('890123', 10),
      firstName: 'Mariam',
      lastName: 'Sayed',
      role: 'STUDENT',
    },
    {
      universityId: '90123456',
      email: 'hassan.mohamed@university.edu',
      password: await bcrypt.hash('901234', 10),
      firstName: 'Hassan',
      lastName: 'Mohamed',
      role: 'STUDENT',
    },
  ];

  const createdStudents = [];
  for (const student of students) {
    const created = await prisma.user.create({
      data: student,
    });
    createdStudents.push(created);
    console.log(`👨‍🎓 Created student: ${student.firstName} ${student.lastName} (${student.universityId})`);
  }

  // Create courses
  const courses = [
    {
      courseCode: 'CS101',
      courseName: 'Introduction to Computer Science',
      description: 'Fundamental concepts of computer science including programming, algorithms, and data structures.',
      credits: 3,
      professorId: createdProfessors[0].id,
    },
    {
      courseCode: 'CS201',
      courseName: 'Data Structures and Algorithms',
      description: 'Advanced data structures and algorithm design and analysis.',
      credits: 4,
      professorId: createdProfessors[0].id,
    },
    {
      courseCode: 'CS301',
      courseName: 'Database Systems',
      description: 'Database design, implementation, and management.',
      credits: 3,
      professorId: createdProfessors[1].id,
    },
    {
      courseCode: 'CS401',
      courseName: 'Software Engineering',
      description: 'Software development methodologies and project management.',
      credits: 4,
      professorId: createdProfessors[1].id,
    },
    {
      courseCode: 'CS501',
      courseName: 'Machine Learning',
      description: 'Introduction to machine learning algorithms and applications.',
      credits: 3,
      professorId: createdProfessors[2].id,
    },
    {
      courseCode: 'CS601',
      courseName: 'Computer Networks',
      description: 'Network protocols, architecture, and security.',
      credits: 3,
      professorId: createdProfessors[2].id,
    },
    {
      courseCode: 'CS701',
      courseName: 'Artificial Intelligence',
      description: 'AI concepts, search algorithms, and knowledge representation.',
      credits: 4,
      professorId: createdProfessors[3].id,
    },
    {
      courseCode: 'CS801',
      courseName: 'Cybersecurity',
      description: 'Information security, cryptography, and network security.',
      credits: 3,
      professorId: createdProfessors[3].id,
    },
    {
      courseCode: 'CS901',
      courseName: 'Web Development',
      description: 'Modern web development with React, Node.js, and databases.',
      credits: 4,
      professorId: createdProfessors[4].id,
    },
    {
      courseCode: 'CS1001',
      courseName: 'Mobile App Development',
      description: 'Cross-platform mobile app development with React Native.',
      credits: 3,
      professorId: createdProfessors[4].id,
    },
  ];

  const createdCourses = [];
  for (const course of courses) {
    const created = await prisma.course.create({
      data: course,
    });
    createdCourses.push(created);
    console.log(`📚 Created course: ${course.courseCode} - ${course.courseName}`);
  }

  // Create course enrollments (students enrolled in courses)
  const enrollments = [
    // Mohamed Hassan (20221245) enrolled in multiple courses
    { studentId: createdStudents[0].id, courseId: createdCourses[0].id },
    { studentId: createdStudents[0].id, courseId: createdCourses[1].id },
    { studentId: createdStudents[0].id, courseId: createdCourses[2].id },
    { studentId: createdStudents[0].id, courseId: createdCourses[4].id },
    
    // Ahmed Hassan (12345678)
    { studentId: createdStudents[1].id, courseId: createdCourses[0].id },
    { studentId: createdStudents[1].id, courseId: createdCourses[1].id },
    { studentId: createdStudents[1].id, courseId: createdCourses[3].id },
    
    // Sara Mohamed (23456789)
    { studentId: createdStudents[2].id, courseId: createdCourses[0].id },
    { studentId: createdStudents[2].id, courseId: createdCourses[2].id },
    { studentId: createdStudents[2].id, courseId: createdCourses[4].id },
    { studentId: createdStudents[2].id, courseId: createdCourses[6].id },
    
    // Omar Ali (34567890)
    { studentId: createdStudents[3].id, courseId: createdCourses[1].id },
    { studentId: createdStudents[3].id, courseId: createdCourses[3].id },
    { studentId: createdStudents[3].id, courseId: createdCourses[5].id },
    
    // Nour Ibrahim (45678901)
    { studentId: createdStudents[4].id, courseId: createdCourses[0].id },
    { studentId: createdStudents[4].id, courseId: createdCourses[2].id },
    { studentId: createdStudents[4].id, courseId: createdCourses[4].id },
    { studentId: createdStudents[4].id, courseId: createdCourses[7].id },
    
    // Youssef Mahmoud (56789012)
    { studentId: createdStudents[5].id, courseId: createdCourses[1].id },
    { studentId: createdStudents[5].id, courseId: createdCourses[3].id },
    { studentId: createdStudents[5].id, courseId: createdCourses[5].id },
    { studentId: createdStudents[5].id, courseId: createdCourses[8].id },
    
    // Fatma Ahmed (67890123)
    { studentId: createdStudents[6].id, courseId: createdCourses[0].id },
    { studentId: createdStudents[6].id, courseId: createdCourses[2].id },
    { studentId: createdStudents[6].id, courseId: createdCourses[6].id },
    
    // Ali Hassan (78901234)
    { studentId: createdStudents[7].id, courseId: createdCourses[1].id },
    { studentId: createdStudents[7].id, courseId: createdCourses[4].id },
    { studentId: createdStudents[7].id, courseId: createdCourses[7].id },
    { studentId: createdStudents[7].id, courseId: createdCourses[9].id },
    
    // Mariam Sayed (89012345)
    { studentId: createdStudents[8].id, courseId: createdCourses[0].id },
    { studentId: createdStudents[8].id, courseId: createdCourses[3].id },
    { studentId: createdStudents[8].id, courseId: createdCourses[5].id },
    { studentId: createdStudents[8].id, courseId: createdCourses[8].id },
    
    // Hassan Mohamed (90123456)
    { studentId: createdStudents[9].id, courseId: createdCourses[2].id },
    { studentId: createdStudents[9].id, courseId: createdCourses[4].id },
    { studentId: createdStudents[9].id, courseId: createdCourses[6].id },
    { studentId: createdStudents[9].id, courseId: createdCourses[9].id },
  ];

  for (const enrollment of enrollments) {
    await prisma.courseEnrollment.create({
      data: enrollment,
    });
  }
  console.log(`📝 Created ${enrollments.length} course enrollments`);

  // Create schedules for courses
  const schedules = [
    // CS101 - Introduction to Computer Science (Monday, Wednesday, Friday)
    { courseId: createdCourses[0].id, professorId: createdProfessors[0].id, dayOfWeek: 1, startTime: '09:00', endTime: '10:30', room: 'A101' },
    { courseId: createdCourses[0].id, professorId: createdProfessors[0].id, dayOfWeek: 3, startTime: '09:00', endTime: '10:30', room: 'A101' },
    { courseId: createdCourses[0].id, professorId: createdProfessors[0].id, dayOfWeek: 5, startTime: '09:00', endTime: '10:30', room: 'A101' },
    
    // CS201 - Data Structures and Algorithms (Tuesday, Thursday)
    { courseId: createdCourses[1].id, professorId: createdProfessors[0].id, dayOfWeek: 2, startTime: '10:30', endTime: '12:00', room: 'A102' },
    { courseId: createdCourses[1].id, professorId: createdProfessors[0].id, dayOfWeek: 4, startTime: '10:30', endTime: '12:00', room: 'A102' },
    
    // CS301 - Database Systems (Monday, Wednesday)
    { courseId: createdCourses[2].id, professorId: createdProfessors[1].id, dayOfWeek: 1, startTime: '12:00', endTime: '13:30', room: 'B101' },
    { courseId: createdCourses[2].id, professorId: createdProfessors[1].id, dayOfWeek: 3, startTime: '12:00', endTime: '13:30', room: 'B101' },
    
    // CS401 - Software Engineering (Tuesday, Thursday)
    { courseId: createdCourses[3].id, professorId: createdProfessors[1].id, dayOfWeek: 2, startTime: '14:00', endTime: '15:30', room: 'B102' },
    { courseId: createdCourses[3].id, professorId: createdProfessors[1].id, dayOfWeek: 4, startTime: '14:00', endTime: '15:30', room: 'B102' },
    
    // CS501 - Machine Learning (Monday, Wednesday, Friday)
    { courseId: createdCourses[4].id, professorId: createdProfessors[2].id, dayOfWeek: 1, startTime: '15:30', endTime: '17:00', room: 'C101' },
    { courseId: createdCourses[4].id, professorId: createdProfessors[2].id, dayOfWeek: 3, startTime: '15:30', endTime: '17:00', room: 'C101' },
    { courseId: createdCourses[4].id, professorId: createdProfessors[2].id, dayOfWeek: 5, startTime: '15:30', endTime: '17:00', room: 'C101' },
    
    // CS601 - Computer Networks (Tuesday, Thursday)
    { courseId: createdCourses[5].id, professorId: createdProfessors[2].id, dayOfWeek: 2, startTime: '09:00', endTime: '10:30', room: 'C102' },
    { courseId: createdCourses[5].id, professorId: createdProfessors[2].id, dayOfWeek: 4, startTime: '09:00', endTime: '10:30', room: 'C102' },
    
    // CS701 - Artificial Intelligence (Monday, Wednesday)
    { courseId: createdCourses[6].id, professorId: createdProfessors[3].id, dayOfWeek: 1, startTime: '10:30', endTime: '12:00', room: 'D101' },
    { courseId: createdCourses[6].id, professorId: createdProfessors[3].id, dayOfWeek: 3, startTime: '10:30', endTime: '12:00', room: 'D101' },
    
    // CS801 - Cybersecurity (Tuesday, Thursday)
    { courseId: createdCourses[7].id, professorId: createdProfessors[3].id, dayOfWeek: 2, startTime: '12:00', endTime: '13:30', room: 'D102' },
    { courseId: createdCourses[7].id, professorId: createdProfessors[3].id, dayOfWeek: 4, startTime: '12:00', endTime: '13:30', room: 'D102' },
    
    // CS901 - Web Development (Monday, Wednesday, Friday)
    { courseId: createdCourses[8].id, professorId: createdProfessors[4].id, dayOfWeek: 1, startTime: '14:00', endTime: '15:30', room: 'E101' },
    { courseId: createdCourses[8].id, professorId: createdProfessors[4].id, dayOfWeek: 3, startTime: '14:00', endTime: '15:30', room: 'E101' },
    { courseId: createdCourses[8].id, professorId: createdProfessors[4].id, dayOfWeek: 5, startTime: '14:00', endTime: '15:30', room: 'E101' },
    
    // CS1001 - Mobile App Development (Tuesday, Thursday)
    { courseId: createdCourses[9].id, professorId: createdProfessors[4].id, dayOfWeek: 2, startTime: '15:30', endTime: '17:00', room: 'E102' },
    { courseId: createdCourses[9].id, professorId: createdProfessors[4].id, dayOfWeek: 4, startTime: '15:30', endTime: '17:00', room: 'E102' },
  ];

  for (const schedule of schedules) {
    await prisma.schedule.create({
      data: schedule,
    });
  }
  console.log(`📅 Created ${schedules.length} course schedules`);

  // Create notification settings for all users
  for (const user of [...createdProfessors, ...createdStudents]) {
    await prisma.notificationSettings.create({
      data: {
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
  console.log(`🔔 Created notification settings for all users`);

  // Create some sample notifications
  const notifications = [
    {
      userId: createdStudents[0].id,
      title: 'Welcome to the University!',
      message: 'Welcome to our university system. You can now access your courses and track your attendance.',
      type: 'INFO',
      category: 'SYSTEM',
    },
    {
      userId: createdStudents[0].id,
      title: 'CS101 Assignment Due',
      message: 'Your assignment for Introduction to Computer Science is due next week.',
      type: 'WARNING',
      category: 'ASSIGNMENT',
    },
    {
      userId: createdProfessors[0].id,
      title: 'New Student Enrolled',
      message: 'A new student has enrolled in your CS101 course.',
      type: 'INFO',
      category: 'COURSE',
    },
  ];

  for (const notification of notifications) {
    await prisma.notification.create({
      data: notification,
    });
  }
  console.log(`📢 Created ${notifications.length} sample notifications`);

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`👨‍🏫 Professors: ${createdProfessors.length}`);
  console.log(`👨‍🎓 Students: ${createdStudents.length}`);
  console.log(`📚 Courses: ${createdCourses.length}`);
  console.log(`📝 Enrollments: ${enrollments.length}`);
  console.log(`📅 Schedules: ${schedules.length}`);
  console.log(`📢 Notifications: ${notifications.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
