import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Test health endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Test API endpoints
app.get('/api/users/student/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      gpa: 3.7,
      upcomingClasses: 2,
      completedCourses: 24,
      pendingAssignments: 3,
      attendancePercentage: 95,
      totalCredits: 72,
      currentSemester: 'Fall 2024'
    }
  });
});

app.get('/api/schedule/today', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        courseName: 'Data Structures',
        courseCode: 'CS201',
        professorName: 'Dr. Smith',
        startTime: '09:00',
        endTime: '10:30',
        room: 'Room 101'
      },
      {
        id: '2',
        courseName: 'Algorithms',
        courseCode: 'CS301',
        professorName: 'Dr. Johnson',
        startTime: '14:00',
        endTime: '15:30',
        room: 'Room 205'
      }
    ]
  });
});

app.get('/api/notifications/announcements', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        title: 'Midterm Exam Schedule',
        message: 'Midterm exams will be held next week. Please check your schedule.',
        timestamp: new Date().toISOString(),
        priority: 'high',
        isRead: false
      },
      {
        id: '2',
        title: 'Library Hours Update',
        message: 'Library will be open 24/7 during exam period.',
        timestamp: new Date().toISOString(),
        priority: 'medium',
        isRead: false
      }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET /health');
  console.log('  GET /api/users/student/stats');
  console.log('  GET /api/schedule/today');
  console.log('  GET /api/notifications/announcements');
});
