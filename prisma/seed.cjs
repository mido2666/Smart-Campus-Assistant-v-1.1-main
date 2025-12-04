const { PrismaClient } = require('@prisma/client');
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

  // 1. Create Professors from the Schedule
  const professorsData = [
    { name: 'Dr. Adel Nassim', email: 'adel.nassim@thebes.edu', uid: '10000001' },
    { name: 'Dr. Mohamed Ahmed Mahfouz', email: 'mohamed.mahfouz@thebes.edu', uid: '10000002' },
    { name: 'Dr. Ahmed Amin', email: 'ahmed.amin@thebes.edu', uid: '10000003' },
    { name: 'Dr. Magdy Ahmed Abdel Barr', email: 'magdy.abdelbarr@thebes.edu', uid: '10000004' },
    { name: 'Dr. Rizk Ghobrial Basit Agban', email: 'rizk.ghobrial@thebes.edu', uid: '10000005' },
  ];

  const createdProfessors = [];
  for (const p of professorsData) {
    const nameParts = p.name.split(' ');
    const firstName = nameParts[1];
    const lastName = nameParts.slice(2).join(' ');

    const professor = await prisma.user.create({
      data: {
        universityId: p.uid,
        email: p.email,
        password: await bcrypt.hash('123456', 10), // Default password
        firstName: firstName,
        lastName: lastName,
        name: p.name,
        role: 'PROFESSOR',
      },
    });
    createdProfessors.push(professor);
    console.log(`👨‍🏫 Created professor: ${p.name}`);
  }

  // 2. Create Courses from the Schedule
  // Mapping professors to courses based on index in createdProfessors
  // 0: Adel Nassim, 1: Mohamed Mahfouz, 2: Ahmed Amin, 3: Magdy Abdel Barr, 4: Rizk Ghobrial
  const coursesData = [
    { code: 'BIS401', name: 'Applied Statistics', profIndex: 0, credits: 3 }, // Adel Nassim
    { code: 'BIS402', name: 'Graduation Project', profIndex: 1, credits: 4 }, // Mohamed Mahfouz (Group 1) & Ahmed Amin (Group 2)
    { code: 'BIS403', name: 'Enterprise Information Systems', profIndex: 1, credits: 3 }, // Mohamed Mahfouz
    { code: 'BIS404', name: 'Computer Programming Applications', profIndex: 3, credits: 3 }, // Magdy Abdel Barr
    { code: 'BIS405', name: 'Strategic Management', profIndex: 4, credits: 3 }, // Rizk Ghobrial
    { code: 'BIS406', name: 'Business Analytics & Data Mining', profIndex: 3, credits: 3 }, // Magdy Abdel Barr
  ];

  const createdCourses = [];
  for (const c of coursesData) {
    const course = await prisma.course.create({
      data: {
        courseCode: c.code,
        courseName: c.name,
        description: `Course for Level 4 - Business Information Systems`,
        credits: c.credits,
        professorId: createdProfessors[c.profIndex].id,
      },
    });
    createdCourses.push(course);
    console.log(`📚 Created course: ${c.name}`);
  }

  // 3. Create Schedules
  // Days: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // Note: JS Date.getDay() returns 0 for Sunday, 6 for Saturday.

  const schedulesData = [
    { courseIndex: 0, day: 6, start: '08:30', end: '11:30', room: 'Saad Zaghloul A201' }, // Sat - Applied Stats
    { courseIndex: 1, day: 6, start: '11:30', end: '14:30', room: 'Ahmed Zewail A501', profIndex: 1 }, // Sat - Grad Project (Mahfouz)
    { courseIndex: 2, day: 0, start: '08:30', end: '11:30', room: 'Taha Hussein A302' }, // Sun - Enterprise IS
    { courseIndex: 1, day: 1, start: '12:30', end: '15:30', room: 'Mostafa Kamel A301', profIndex: 2 }, // Mon - Grad Project (Amin)
    { courseIndex: 3, day: 2, start: '08:30', end: '11:30', room: 'Ali Mubarak A202' }, // Tue - Programming Apps
    { courseIndex: 4, day: 4, start: '08:30', end: '11:30', room: 'Al-Khwarizmi A502' }, // Thu - Strategic Mgmt
    { courseIndex: 5, day: 4, start: '11:30', end: '14:30', room: 'Saad Zaghloul A201' }, // Thu - Business Analytics
  ];

  for (const s of schedulesData) {
    const course = createdCourses[s.courseIndex];
    // Use specified professor if available, otherwise use course's default professor
    const professorId = s.profIndex !== undefined ? createdProfessors[s.profIndex].id : course.professorId;

    await prisma.schedule.create({
      data: {
        courseId: course.id,
        professorId: professorId,
        dayOfWeek: s.day,
        startTime: s.start,
        endTime: s.end,
        room: s.room,
      },
    });
  }
  console.log(`📅 Created schedules based on image`);

  // 4. Create Students (50 Students)
  const createdStudents = [];
  const firstNames = ['Mohamed', 'Ahmed', 'Sara', 'Omar', 'Nour', 'Youssef', 'Fatma', 'Ali', 'Mariam', 'Hassan', 'Khaled', 'Salma', 'Mahmoud', 'Aya', 'Ibrahim', 'Hoda', 'Mostafa', 'Rana', 'Tarek', 'Dina'];
  const lastNames = ['Hassan', 'Mohamed', 'Ali', 'Ibrahim', 'Mahmoud', 'Ahmed', 'Sayed', 'Abdallah', 'Fathy', 'Kamel', 'Salah', 'Adel', 'Samir', 'Nabil', 'Farouk', 'Gamal', 'Wahid', 'Zaki', 'Saad', 'Mokhtar'];

  for (let i = 0; i < 50; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const universityId = (20220000 + i).toString();

    const student = await prisma.user.create({
      data: {
        universityId,
        email: `student${universityId}@thebes.edu`,
        password: await bcrypt.hash('123456', 10),
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        role: 'STUDENT',
      },
    });
    createdStudents.push(student);
  }
  console.log(`👨‍🎓 Created ${createdStudents.length} students`);

  // 5. Enroll Students
  // Enroll all students in all courses (Level 4 cohort)
  for (const student of createdStudents) {
    for (const course of createdCourses) {
      await prisma.courseEnrollment.create({
        data: {
          studentId: student.id,
          courseId: course.id,
        },
      });
    }
  }
  console.log(`📝 Enrolled all students in Level 4 courses`);

  // 6. Generate Attendance Records
  // We need to generate sessions back in time to show history.
  // We'll simulate the last 12 weeks of the semester.
  const now = new Date();
  const semesterStart = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // 12 weeks ago

  for (let i = 0; i < schedulesData.length; i++) {
    const schedule = schedulesData[i];
    const course = createdCourses[schedule.courseIndex];
    const professorId = schedule.profIndex !== undefined ? createdProfessors[schedule.profIndex].id : course.professorId;

    // Find the first occurrence of this day after semester start
    let currentDate = new Date(semesterStart);
    while (currentDate.getDay() !== schedule.day) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    let sessionCount = 1;
    while (currentDate <= now) {
      // Create QR Code / Session
      const qrCode = await prisma.qRCode.create({
        data: {
          sessionId: `session-${course.courseCode}-${sessionCount}-${currentDate.getTime()}`,
          courseId: course.id,
          professorId: professorId,
          title: `${course.courseName} - Week ${sessionCount}`,
          description: `Lecture in ${schedule.room}`,
          expiresAt: new Date(currentDate.getTime() + 3 * 60 * 60 * 1000), // 3 hours duration
          latitude: 30.0444,
          longitude: 31.2357,
          radius: 100,
          validFrom: currentDate,
          validTo: new Date(currentDate.getTime() + 3 * 60 * 60 * 1000),
          maxAttempts: 3,
          createdAt: currentDate,
        },
      });

      // Mark Attendance
      for (const student of createdStudents) {
        const rand = Math.random();
        let status = 'PRESENT';
        let fraudScore = 0;
        let location = { lat: 30.0444, lng: 31.2357 };

        // Vary attendance rates slightly by course to make it interesting
        const attendanceRate = 0.85 + (Math.random() * 0.1); // 85-95% attendance

        if (rand > attendanceRate) {
          status = Math.random() > 0.5 ? 'ABSENT' : 'LATE';
        }

        if (status !== 'ABSENT') {
          // Simulate Fraud
          if (Math.random() > 0.98) { // 2% chance of fraud
            fraudScore = 0.85;
            location = { lat: 30.0500, lng: 31.2400 }; // Wrong location

            await prisma.fraudAlert.create({
              data: {
                studentId: student.id,
                qrCodeId: qrCode.id,
                alertType: 'LOCATION_SPOOFING',
                severity: 'HIGH',
                description: 'Student location mismatch detected',
                isResolved: false,
                createdAt: currentDate
              }
            });
          }

          await prisma.attendanceRecord.create({
            data: {
              studentId: student.id,
              courseId: course.id,
              qrCodeId: qrCode.id,
              status: status,
              markedAt: new Date(currentDate.getTime() + Math.random() * 30 * 60 * 1000),
              location: JSON.stringify(location),
              ipAddress: '192.168.1.10',
              fraudScore: fraudScore,
              createdAt: currentDate
            },
          });
        }
      }

      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);
      sessionCount++;
    }
  }
  console.log(`📋 Generated attendance history for all courses`);

  // 7. Create Notification Settings
  for (const user of [...createdProfessors, ...createdStudents]) {
    await prisma.notificationSettings.create({
      data: { userId: user.id }
    });
  }

  console.log('✅ Database seeding completed successfully!');
  console.log('🔑 Professor Credentials:');
  professorsData.forEach(p => console.log(`   ${p.name}: ${p.email} / 123456`));
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
