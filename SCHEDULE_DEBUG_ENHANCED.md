# Enhanced Debug Logging for Schedule API Issue

## 🎯 Changes Made

### File: `src/pages/StudentDashboard.tsx`

Added comprehensive debug logging to identify exactly where the API call pipeline fails:

### 1. **useEffect Entry Logging** (Lines 173-178)
```typescript
console.log('===== DASHBOARD USEEFFECT TRIGGERED =====');
console.log('User details:', { id: user.id, universityId: user.universityId, role: user.role });
console.log('Today day of week:', new Date().getDay());
```

### 2. **Promise Creation Logging** (Lines 189-198)
```typescript
const statsPromise = fetchStats();
console.log('📊 fetchStats() called, returned:', statsPromise);

const schedulePromise = fetchSchedule();
console.log('📅 fetchSchedule() called, returned:', schedulePromise);

const announcementsPromise = fetchAnnouncements();
console.log('📢 fetchAnnouncements() called, returned:', announcementsPromise);
```

### 3. **Individual API Callback Logging**

#### Stats API (Lines 70-80):
```typescript
onSuccess: (data) => {
  console.log('===== STATS API RESPONSE =====');
  console.log('Student stats fetched successfully:', data);
}
onError: (error) => {
  console.error('===== STATS API ERROR =====');
  console.error('❌ Stats API failed:', error);
}
```

#### Schedule API (Lines 109-150):
```typescript
onSuccess: (data) => {
  console.log('===== SCHEDULE API RESPONSE =====');
  console.log('Schedule data received:', data);
  console.log('Is array:', Array.isArray(data));
  console.log('Array length:', Array.isArray(data) ? data.length : 'N/A');
  // ... transformation logic
}
onError: (error) => {
  console.error('===== SCHEDULE API ERROR =====');
  console.error('❌ Schedule API failed!');
  console.error('Error type:', typeof error);
  console.error('Error message:', error?.message);
  console.error('Error code:', error?.code);
  console.error('Error details:', error?.details);
  console.error('Full error object:', error);
}
```

#### Announcements API (Lines 157-167):
```typescript
onSuccess: (data) => {
  console.log('===== ANNOUNCEMENTS API RESPONSE =====');
  console.log('Announcements fetched successfully:', data);
}
onError: (error) => {
  console.error('===== ANNOUNCEMENTS API ERROR =====');
  console.error('❌ Announcements API failed:', error);
}
```

### 4. **Promise.allSettled Results Logging** (Lines 208-221)
```typescript
console.log('===== DASHBOARD API RESULTS =====');
const apiNames = ['fetchStats', 'fetchSchedule', 'fetchAnnouncements'];
results.forEach((result, index) => {
  const apiName = apiNames[index];
  if (result.status === 'rejected') {
    console.error(`❌ ${apiName} FAILED:`, result.reason);
    console.error(`   Reason type:`, typeof result.reason);
    console.error(`   Reason message:`, result.reason?.message || 'No message');
    console.error(`   Full reason:`, result.reason);
  } else {
    console.log(`✅ ${apiName} SUCCESS`);
    console.log(`   Value type:`, typeof result.value);
    console.log(`   Value:`, result.value);
  }
});
console.log('===== END DASHBOARD API RESULTS =====');
```

---

## 🔍 What to Look For in Console

### **SCENARIO 1: API Never Called**
```
===== DASHBOARD USEEFFECT TRIGGERED =====
Starting to fetch dashboard data...
📞 About to call Promise.allSettled with 3 API calls...
📊 fetchStats() called, returned: [object Promise]
📅 fetchSchedule() called, returned: [object Promise]  // ✓ Promise created
📢 fetchAnnouncements() called, returned: [object Promise]

// BUT NO:
// ===== SCHEDULE API RESPONSE =====
// OR
// ===== SCHEDULE API ERROR =====
```
**Diagnosis:** Promise never resolves or rejects. Likely:
- useApi hook not calling onSuccess/onError
- API call hangs indefinitely
- Network request stuck

---

### **SCENARIO 2: API Call Rejected (Error)**
```
===== SCHEDULE API ERROR =====
❌ Schedule API failed!
Error type: object
Error message: Failed to fetch
Error code: NETWORK_ERROR
Error details: {...}
Full error object: {...}

// In Promise.allSettled:
❌ fetchSchedule FAILED: [ApiError object]
   Reason type: object
   Reason message: Failed to fetch
```
**Diagnosis:** API call failed. Check:
- Server running on port 3001
- Endpoint exists: `/api/schedule/today`
- Network connectivity
- CORS configuration
- Authentication token valid

---

### **SCENARIO 3: API Returns Empty Data**
```
===== SCHEDULE API RESPONSE =====
Schedule data received: []
Is array: true
Array length: 0
Raw data before transformation: []
Transformed schedule data: []
Setting dashboard schedule with 0 classes

// In Promise.allSettled:
✅ fetchSchedule SUCCESS
   Value type: object  // Returns null because execute() returns response.data
   Value: null
```
**Diagnosis:** API succeeded but returned empty array. Check:
- User enrollment data in database
- Today's day of week matches schedule records
- Database query logic in backend

---

### **SCENARIO 4: API Returns Data But Undefined courseName/courseCode**
```
===== SCHEDULE API RESPONSE =====
Schedule data received: [{id: 141, courseId: 61, courseName: undefined, ...}]
Is array: true
Array length: 2
Transforming item: {id: 141, courseName: undefined, courseCode: undefined, ...}
// This should create: "undefined (undefined)" for course names
```
**Diagnosis:** Backend returning data but course fields are undefined. Check:
- Backend Prisma query includes course data
- `schedule.course` is populated
- Workaround in `schedule.routes.js` is working

---

### **SCENARIO 5: Success! (Expected Output)**
```
===== DASHBOARD USEEFFECT TRIGGERED =====
User details: {id: 96, universityId: '20221245', role: 'STUDENT'}
Today day of week: 5
📞 About to call Promise.allSettled with 3 API calls...
📊 fetchStats() called, returned: [object Promise]
📅 fetchSchedule() called, returned: [object Promise]
📢 fetchAnnouncements() called, returned: [object Promise]

===== SCHEDULE API RESPONSE =====
Schedule data received: (2) [{…}, {…}]
Is array: true
Array length: 2
Transforming item: {id: 141, courseName: 'Introduction to Computer Science', courseCode: 'CS101', ...}
Transforming item: {id: 150, courseName: 'Machine Learning', courseCode: 'CS501', ...}
Transformed schedule data: (2) [{…}, {…}]
Setting dashboard schedule with 2 classes

===== DASHBOARD API RESULTS =====
✅ fetchStats SUCCESS
✅ fetchSchedule SUCCESS
   Value: null  // Note: execute() returns response.data, which might be null in Promise result
✅ fetchAnnouncements SUCCESS
===== END DASHBOARD API RESULTS =====
```

---

## 🚀 Testing Steps

1. **Clear Browser Cache** (IMPORTANT!)
   ```
   Chrome/Edge: Ctrl+Shift+Delete → Clear cached images and files
   Firefox: Ctrl+Shift+Delete → Clear cache
   Or: Hard refresh with Ctrl+F5
   ```

2. **Open Browser DevTools**
   - Press `F12`
   - Go to **Console** tab
   - Enable "Preserve log" (to keep logs across page reloads)

3. **Login to Application**
   - Username: `20221245`
   - Password: `123456`
   - Role: Student

4. **Watch Console Output**
   - Look for the debug sections marked with `=====`
   - Identify which scenario matches your output
   - Check if schedule API reaches onSuccess or onError

5. **Check Network Tab**
   - Go to **Network** tab in DevTools
   - Filter by "Fetch/XHR"
   - Look for `/api/schedule/today` request
   - Check:
     - Status code (200, 304, 404, 500)
     - Response body
     - Request headers (Authorization token present?)

6. **Check Server Logs**
   - Look for `[SCHEDULE/TODAY]` logs in terminal
   - Verify server receives the request
   - Check if it's returning data correctly

---

## 📊 Expected vs Actual

### Server Logs (From Terminal):
```
[SCHEDULE/TODAY] ========== REQUEST START ==========
[SCHEDULE/TODAY] User ID: 96
[SCHEDULE/TODAY] Found enrollments: 4
[SCHEDULE/TODAY] Found schedules for today: 2
[SCHEDULE/TODAY] Schedule 141: { courseName: 'Introduction to Computer Science', ... }
[SCHEDULE/TODAY] Schedule 150: { courseName: 'Machine Learning', ... }
[SCHEDULE/TODAY] Sending response with 2 classes
GET /api/schedule/today 200 30.757 ms - -
```
✅ **Backend is working correctly**

### Frontend Logs (Should Show):
```
===== SCHEDULE API RESPONSE =====
Schedule data received: (2) [{…}, {…}]
Array length: 2
Setting dashboard schedule with 2 classes
```
❓ **If this is missing, that's the problem!**

---

## 🐛 Common Issues

### Issue 1: Browser Cache
**Symptom:** Old code still running despite file changes
**Solution:** Hard refresh (Ctrl+F5) or clear cache

### Issue 2: 304 Not Modified
**Symptom:** API returns 304, but data not displayed
**Solution:** Backend is using cached response, but frontend should handle this

### Issue 3: useApi Hook Not Calling Callbacks
**Symptom:** No onSuccess or onError logs
**Solution:** Check if `response.success` is true/false in the API response format

### Issue 4: Promise Never Resolves
**Symptom:** execute() called but callbacks never fire
**Solution:** Check useApi hook implementation, verify Promise chain

### Issue 5: Data Transformation Mismatch
**Symptom:** Data received but not displayed
**Solution:** Check data structure, ensure courseName/courseCode exist

---

## 📝 Next Steps Based on Findings

After reviewing console logs, you'll know exactly:

1. ✅ **If execute() is being called** → Check promise creation logs
2. ✅ **If API request is made** → Check Network tab
3. ✅ **If server responds** → Check server terminal logs
4. ✅ **If response reaches frontend** → Check onSuccess/onError logs
5. ✅ **If data is transformed correctly** → Check transformation logs
6. ✅ **If state is updated** → Check "Setting dashboard schedule" log

**This will pinpoint the EXACT step where the pipeline breaks!** 🎯


