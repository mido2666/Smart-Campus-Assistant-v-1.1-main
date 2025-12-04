# 🔍 Schedule Page Debug Guide

## 📋 **DEBUG LOGGING ADDED**

### **File:** `src/pages/Schedule.tsx` (Lines 50-116)

Added comprehensive logging to understand the exact API response structure.

---

## 🚀 **TESTING STEPS:**

### **1. Clear Browser Cache & Refresh:**
```
Ctrl + Shift + Delete → Clear cache
OR
Ctrl + F5 (Hard refresh)
```

### **2. Open Browser DevTools:**
```
Press F12
Go to "Console" tab
Enable "Preserve log" checkbox
```

### **3. Navigate to Schedule Page:**
```
Login (if needed)
Click "Schedule" in sidebar
OR
Go to: http://localhost:5173/schedule
```

### **4. Check Console Logs:**
Look for the section:
```
📅 ===== SCHEDULE API RESPONSE =====
```

---

## 📊 **WHAT TO LOOK FOR:**

### **Scenario A: Nested Structure (Expected)**
```javascript
📅 ===== SCHEDULE API RESPONSE =====
Response success: true
Total schedule items: 10
First schedule item (full): {
  id: 141,
  courseId: 61,
  professorId: 91,
  dayOfWeek: 5,
  startTime: "09:00",
  endTime: "10:30",
  room: "A101",
  course: {
    id: 61,
    courseCode: "CS101",
    courseName: "Introduction to Computer Science"
  },
  professor: {
    id: 91,
    firstName: "Ahmed",
    lastName: "El-Sayed"
  }
}
Has course object? true
  course.courseName: Introduction to Computer Science
  course.courseCode: CS101
Has professor object? true
  professor.firstName: Ahmed
  professor.lastName: El-Sayed
```
**✅ If you see this:** The nested structure is correct, the fix should work!

---

### **Scenario B: Flat Structure (Possible)**
```javascript
📅 ===== SCHEDULE API RESPONSE =====
Response success: true
Total schedule items: 10
First schedule item (full): {
  id: 141,
  courseId: 61,
  professorId: 91,
  courseName: "Introduction to Computer Science",
  courseCode: "CS101",
  professorFirstName: "Ahmed",
  professorLastName: "El-Sayed",
  dayOfWeek: 5,
  startTime: "09:00",
  endTime: "10:30",
  room: "A101"
}
Has course object? false
Has professor object? false
Flat properties:
  courseName: Introduction to Computer Science
  courseCode: CS101
  professorFirstName: Ahmed
  professorLastName: El-Sayed
```
**⚠️ If you see this:** The API returns flat structure, need to adjust the code!

---

### **Scenario C: Mixed/Different Structure**
```javascript
📅 ===== SCHEDULE API RESPONSE =====
Response success: true
Total schedule items: 10
First schedule item (full): {
  id: 141,
  course_id: 61,
  course_name: "Introduction to Computer Science",
  course_code: "CS101",
  // ... different property names
}
```
**⚠️ If you see this:** Property names are different, need to update mapping!

---

### **Scenario D: Empty or Null Data**
```javascript
📅 ===== SCHEDULE API RESPONSE =====
Response success: true
Total schedule items: 0
===== END SCHEDULE API RESPONSE =====
```
**❌ If you see this:** No schedule data in database for this student!

---

## 🔧 **NEXT STEPS BASED ON OUTPUT:**

### **If Nested Structure (Scenario A):**
The current fix should work. If courses still show "Unknown Course", check:
1. **Network Tab:** Verify API response matches console logs
2. **Mapping logs:** Look for "Mapping item:" logs showing what values are extracted
3. **Component state:** Check if `setClasses(mapped)` is being called

### **If Flat Structure (Scenario B):**
Update the mapping code to prioritize flat properties:
```typescript
const courseName = item.courseName || item.course?.courseName || 'Unknown Course';
const courseCode = item.courseCode || item.course?.courseCode || 'N/A';
const professorFirstName = item.professorFirstName || item.professor?.firstName || '';
const professorLastName = item.professorLastName || item.professor?.lastName || 'Unknown';
```

### **If Different Property Names (Scenario C):**
Update mapping to match actual property names:
```typescript
const courseName = item.course_name || item.courseName || 'Unknown Course';
const courseCode = item.course_code || item.courseCode || 'N/A';
// ... etc
```

### **If No Data (Scenario D):**
Check backend:
1. Verify student has course enrollments
2. Check database seed
3. Verify API endpoint `/api/schedule/user` returns data
4. Check user ID and authentication

---

## 🌐 **ADDITIONAL CHECKS:**

### **1. Network Tab Investigation:**

**Steps:**
1. Press F12 → Go to "Network" tab
2. Refresh page
3. Filter: Type "schedule" in filter box
4. Find: `/api/schedule/user` request
5. Click on it
6. Go to "Response" tab
7. Copy the entire response

**Expected Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": 141,
      "courseId": 61,
      "professorId": 91,
      "dayOfWeek": 5,
      "startTime": "09:00",
      "endTime": "10:30",
      "room": "A101",
      "course": {
        "courseCode": "CS101",
        "courseName": "Introduction to Computer Science"
      },
      "professor": {
        "firstName": "Ahmed",
        "lastName": "El-Sayed"
      }
    }
  ]
}
```

### **2. Server Logs Check:**

Look in your server terminal for:
```
[SCHEDULE] Fetching schedule for user: 96
[SCHEDULE] Found enrollments: 4
[SCHEDULE] Found schedules: 10
```

If you see errors or 0 schedules, there's a backend issue.

---

## 📝 **INFORMATION TO SHARE:**

After testing, please provide:

1. **Console Logs:** Copy the entire "===== SCHEDULE API RESPONSE =====" section
2. **Network Response:** Copy the raw JSON response from Network tab
3. **Server Logs:** Any relevant logs from the backend terminal
4. **Current Behavior:** What you see on the schedule page
5. **Mapping Logs:** Copy any "Mapping item:" logs that appear

**Example:**
```
Console shows:
- Has course object? false
- courseName (flat): Introduction to Computer Science
- courseCode (flat): CS101

Network tab shows:
{success: true, data: [{courseName: "...", courseCode: "..."}]}

Page displays:
Unknown Course (N/A)
```

---

## 🎯 **COMMON ISSUES & SOLUTIONS:**

### **Issue 1: API Returns Flat Structure**
**Symptom:** `Has course object? false` but flat properties have values
**Solution:** Reorder the property access in mapping code to check flat first

### **Issue 2: Property Names Don't Match**
**Symptom:** All properties are `undefined`
**Solution:** Check actual property names and update mapping

### **Issue 3: No Data Returned**
**Symptom:** `Total schedule items: 0`
**Solution:** Check database, enrollments, and backend service

### **Issue 4: API Call Fails**
**Symptom:** Console shows API error, not success
**Solution:** Check backend server is running, endpoint exists, authentication

### **Issue 5: Data Exists But Not Displayed**
**Symptom:** Console shows correct data, but page shows "Unknown Course"
**Solution:** Check `setClasses(mapped)` is called, check React state updates

---

## ✅ **SUCCESS CRITERIA:**

When working correctly, you should see:

**Console:**
```javascript
📅 ===== SCHEDULE API RESPONSE =====
Total schedule items: 10
Has course object? true
  course.courseName: Introduction to Computer Science
  course.courseCode: CS101
===== END SCHEDULE API RESPONSE =====

Mapping item: {
  id: 141,
  courseName: "Introduction to Computer Science",
  courseCode: "CS101",
  professorFirstName: "Ahmed",
  professorLastName: "El-Sayed",
  hasNestedCourse: true,
  hasNestedProfessor: true
}
```

**Page Display:**
```
Introduction to Computer Science (CS101)
Friday • 9:00 AM - 10:30 AM • A101
Dr. Ahmed El-Sayed
```

---

**Run the test and share the console output so we can identify the exact issue! 🔍**

