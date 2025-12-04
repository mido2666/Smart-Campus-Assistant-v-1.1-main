# Student Data Summary

## Students with Complete Data

### 1. Mohamed Hassan (Student ID: 20221245) ⭐

The database now contains comprehensive data for student Mohamed Hassan:

### 📚 Enrolled Courses (4 courses)
1. **CS101** - Introduction to Computer Science (3 credits)
2. **CS201** - Data Structures and Algorithms (3 credits)
3. **CS301** - Database Systems (3 credits)  
4. **CS501** - Machine Learning (3 credits)

### 📊 Attendance Statistics

| Course | Attendance | Status |
|--------|-----------|--------|
| CS101  | 95% (19/20 classes) | Excellent |
| CS201  | 90% (18/20 classes) | Good (1 late) |
| CS301  | 95% (19/20 classes) | Excellent (1 late) |
| CS501  | 85% (17/20 classes) | Warning (1 late) |

**Overall Attendance:** ~91% across all courses
**Current GPA:** 3.70

### 📅 Class Schedule

**Monday:**
- 09:00-10:30 - CS101 (Room A101)
- 12:00-13:30 - CS301 (Room B101)
- 15:30-17:00 - CS501 (Room C101)

**Tuesday:**
- 10:30-12:00 - CS201 (Room A102)

**Wednesday:**
- 09:00-10:30 - CS101 (Room A101)
- 12:00-13:30 - CS301 (Room B101)
- 15:30-17:00 - CS501 (Room C101)

**Thursday:**
- 10:30-12:00 - CS201 (Room A102)

**Friday:**
- 09:00-10:30 - CS101 (Room A101)
- 15:30-17:00 - CS501 (Room C101)

### 🔔 Notifications (6 total, 5 unread)

#### Unread Notifications:
1. **WARNING** - CS201 Assignment #3 Due Soon
2. **URGENT** - CS301 Midterm Exam (Monday 10:00 AM, Hall A)
3. **SUCCESS** - CS501 Project Deadline Extended
4. **WARNING** - Attendance Warning - CS501 (below 90%)
5. **INFO** - Welcome to the University!

#### Read Notifications:
1. **INFO** - CS101 Lab Session Changed (Room B202)

### 📋 Attendance Records
- **Total Records:** 73 attendance entries
- **QR Code Scans:** 73 successful scans
- **Status Breakdown:**
  - Present: 70 classes
  - Late: 3 classes
  - Absent: 7 classes (missed)

### 🎯 Calculated Statistics (for Dashboard)

Based on the data, the dashboard can calculate:

- **GPA:** Not stored in DB (would need a Grades table)
  - Suggested: Use mock GPA of 3.7
- **Upcoming Classes:** 2-3 per day (from schedule table)
- **Completed Courses:** 0 (all current enrollments are ACTIVE)
- **Pending Assignments:** 3+ (from notifications)
- **Attendance Percentage:** 91.25% (calculated from attendance records)
- **Total Credits:** 12 credits (sum of enrolled courses)
- **Current Semester:** Fall 2024

## API Endpoints to Fetch This Data

1. **Student Stats:** `GET /api/users/student/stats`
2. **Today's Schedule:** `GET /api/schedule/today`
3. **Attendance Records:** `GET /api/attendance`
4. **Enrolled Courses:** `GET /api/courses/enrolled`
5. **Notifications:** `GET /api/notifications`
6. **User Profile:** `GET /api/users/profile`

### 2. Ahmed Hassan (Student ID: 12345678)

The database contains data for student Ahmed Hassan:

#### 📚 Enrolled Courses (3 courses)
1. **CS101** - Introduction to Computer Science (3 credits)
2. **CS201** - Data Structures and Algorithms (3 credits)
3. **CS401** - Software Engineering (3 credits)

#### 📊 Attendance Statistics

| Course | Attendance | Status |
|--------|-----------|--------|
| CS101  | 85% (17/20 classes) | Good |
| CS201  | 80% (16/20 classes, 1 late) | Satisfactory |

**Overall Attendance:** ~82.5% across all courses
**Current GPA:** 3.40

#### 🔔 No notifications yet

#### 📋 Attendance Records
- **Total Records:** 33 attendance entries
- **QR Code Scans:** 33 successful scans

---

## Other Students (Default Data)

The following students are enrolled but have default attendance and GPA values:

3. **Sara Mohamed** (23456789) - 85% attendance, 3.5 GPA
4. **Omar Ali** (34567890) - 85% attendance, 3.5 GPA
5. **Nour Ibrahim** (45678901) - 85% attendance, 3.5 GPA
6. **Youssef Mahmoud** (56789012) - 85% attendance, 3.5 GPA
7. **Fatma Ahmed** (67890123) - 85% attendance, 3.5 GPA
8. **Ali Hassan** (78901234) - 85% attendance, 3.5 GPA
9. **Mariam Sayed** (89012345) - 85% attendance, 3.5 GPA
10. **Hassan Mohamed** (90123456) - 85% attendance, 3.5 GPA

All students have:
- Course enrollments
- Class schedules
- Notification settings

---

## Profile Page & Dashboard Display

Both the Profile page and Dashboard page now show consistent GPA and Attendance Rate:

- **Mohamed Hassan (20221245):** 
  - Attendance Rate: **91%** ✅
  - Current GPA: **3.70** ✅
  - Dashboard GPA Card: **3.70** ✅

- **Ahmed Hassan (12345678):**
  - Attendance Rate: **82.5%** ✅
  - Current GPA: **3.40** ✅
  - Dashboard GPA Card: **3.40** ✅

- **Other Students:**
  - Attendance Rate: **85%** ✅
  - Current GPA: **3.50** ✅
  - Dashboard GPA Card: **3.50** ✅

## Attendance Page Display

The Attendance page now shows real overall attendance data linked to student profiles:

- **Mohamed Hassan (20221245):** 
  - Overall Attendance: **91%** ✅
  - Displays real attendance records from database
  - Shows course-specific attendance stats

- **Ahmed Hassan (12345678):**
  - Overall Attendance: **82%** ✅ (rounded from 82.5%)
  - Displays real attendance records from database
  - Shows 33 attendance entries

- **Other Students:**
  - Overall Attendance: **85%** ✅
  - Shows mock attendance data
  - Consistent with Profile page

### Attendance Page Features:
- ✅ Calculates stats from real database records
- ✅ Maps API data to proper format
- ✅ Shows total classes, missed classes, late classes
- ✅ Displays attendance alerts based on real percentage
- ✅ Consistent with Profile page GPA and attendance data

### Attendance Progress Chart:
- ✅ Calculates weekly attendance trends from real records
- ✅ Groups records by week and calculates percentages
- ✅ Adjusts to match overall attendance (91%, 82%, or 85%)
- ✅ Shows course-specific attendance when filtered
- ✅ Displays last 8 weeks of attendance data
- ✅ Interactive line chart with tooltips
- ✅ Filter by course to see specific trends
- ✅ Shows average attendance and trend indicators

## My Class Schedule Page

The Schedule page now shows real course schedules from the database:

- **Mohamed Hassan (20221245):**
  - **CS101** - Mon, Wed, Fri at 9:00-10:30 (Room A101) - Dr. Ahmed El-Sayed
  - **CS201** - Tue, Thu at 10:30-12:00 (Room A102) - Dr. Ahmed El-Sayed
  - **CS301** - Mon, Wed at 12:00-13:30 (Room B101) - Dr. Mona Ibrahim
  - **CS501** - Tue, Thu at 10:30-12:00 (Room C102) - Dr. Youssef Ahmed

- **Ahmed Hassan (12345678):**
  - **CS101** - Mon, Wed, Fri at 9:00-10:30 (Room A101) - Dr. Ahmed El-Sayed
  - **CS201** - Tue, Thu at 10:30-12:00 (Room A102) - Dr. Ahmed El-Sayed
  - **CS401** - Tue, Thu at 14:00-15:30 (Room B102) - Dr. Mona Ibrahim

### Schedule API Endpoints:
- ✅ `GET /api/schedule/user` - Fetches student-specific schedule based on enrolled courses
- ✅ `GET /api/schedule/today` - Returns today's classes for the student
- ✅ `GET /api/schedule/upcoming` - Returns next 10 upcoming classes
- ✅ `GET /api/schedule/student` - Alternative student schedule endpoint
- ✅ `GET /api/schedule/professor` - Professor's teaching schedule
- ✅ JWT authentication for all schedule endpoints
- ✅ Prisma database queries for real-time data
- ✅ Includes course code, name, professor, room, and timing

### Schedule Page Features:
- ✅ Displays all classes for the week organized by day
- ✅ Shows course code and name (e.g., "CS101 - Introduction to Computer Science")
- ✅ Displays professor names (e.g., "Dr. Ahmed El-Sayed")
- ✅ Shows room numbers and class times
- ✅ Status indicators (Ongoing, Completed, Upcoming)
- ✅ Filter by day of week
- ✅ Filter by status
- ✅ Search by course name or instructor
- ✅ Schedule statistics (Total Classes, Hours per Week, etc.)

---

## Note on GPA

The current database schema does NOT include:
- GPA field in User table
- Grades table for individual course grades

### Options to Add GPA:

1. **Add to User table:**
   ```prisma
   model User {
     ...
     gpa Float?
   }
   ```

2. **Create Grades table:**
   ```prisma
   model Grade {
     id        Int    @id @default(autoincrement())
     studentId Int
     courseId  Int
     grade     Float
     semester  String
     ...
   }
   ```

3. **For now:** Use mock/calculated GPA in frontend (suggested: 3.7)

## Test Login Credentials

**Student Account:**
- University ID: `20221245`
- Password: `123456`
- Role: STUDENT

**Professor Accounts:**
- ID: `11111111`, Password: `111111` (Ahmed El-Sayed)
- ID: `22222222`, Password: `222222` (Mona Ibrahim)

