# Debug Guide: Today's Schedule Not Showing

## Issue
No schedule is displaying in the "Today's Schedule" section on the dashboard.

## Expected Behavior (Today is Friday - Day 5)

### Mohamed Hassan (20221245) should see:
- **CS101** - Introduction to Computer Science
  - Time: 09:00 AM - 10:30 AM
  - Room: A101
- **CS501** - Machine Learning
  - Time: 03:30 PM - 05:00 PM
  - Room: C101

### Ahmed Hassan (12345678) should see:
- **CS101** - Introduction to Computer Science
  - Time: 09:00 AM - 10:30 AM
  - Room: A101

## Debug Steps

### Step 1: Restart the Server
The new logging code needs to be loaded:

```bash
# Stop the current server (Ctrl+C in the terminal where it's running)
# Then restart it:
node server/index.js
```

### Step 2: Clear Browser Cache and Refresh
- Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac) to hard refresh
- Or open DevTools (F12) → Application → Clear Storage → Clear site data

### Step 3: Open Browser DevTools
- Press `F12` to open DevTools
- Go to the **Console** tab

### Step 4: Log In
Log in as Mohamed Hassan:
- University ID: `20221245`
- Password: `222222`

### Step 5: Check Logs

#### In Browser Console, look for:
```
===== SCHEDULE API RESPONSE =====
Full response: {...}
Response.data: [...]
Current day of week: 5
Raw data before transformation: [...]
Is array: true
Array length: 2 (should be 2 for Mohamed)
Transforming item: {...}
Transformed schedule data: [...]
Setting dashboard schedule with 2 classes
```

#### In Terminal (server logs), look for:
```
[SCHEDULE/TODAY] ========== REQUEST START ==========
[SCHEDULE/TODAY] User ID: 2
[SCHEDULE/TODAY] Today (day of week): 5
[SCHEDULE/TODAY] Found enrollments: 4
[SCHEDULE/TODAY] Enrolled courses: ['CS101 (ID: 1)', 'CS201 (ID: 2)', 'CS301 (ID: 3)', 'CS501 (ID: 5)']
[SCHEDULE/TODAY] Course IDs: [1, 2, 3, 5]
[SCHEDULE/TODAY] Found schedules for today: 2
[SCHEDULE/TODAY] Schedule 1: { course: 'CS101', day: 5, time: '09:00-10:30', room: 'A101' }
[SCHEDULE/TODAY] Schedule 2: { course: 'CS501', day: 5, time: '15:30-17:00', room: 'C101' }
[SCHEDULE/TODAY] Sending response with 2 classes
[SCHEDULE/TODAY] ========== REQUEST END ==========
```

## Possible Issues and Solutions

### Issue 1: "Found schedules for today: 0"
**Problem**: No schedules found in the database for today.

**Solution**: Re-seed the database:
```bash
npm run db:seed
```

### Issue 2: "Array length: 0"
**Problem**: API returned empty array.

**Possible causes**:
1. API endpoint not returning data correctly
2. Data transformation issue
3. Authentication token issue

**Solution**: Check the full API response in console logs.

### Issue 3: "Failed to fetch schedule" error
**Problem**: API call is failing.

**Possible causes**:
1. Server not running
2. Wrong API endpoint URL
3. CORS issue
4. Authentication error

**Solution**: 
- Check if server is running on http://localhost:3001
- Check terminal for error messages
- Verify JWT token is valid

### Issue 4: Dashboard shows loading forever
**Problem**: API call hanging or timing out.

**Solution**:
- Check server terminal for errors
- Check Network tab in DevTools for the API call status
- Try manually navigating to: http://localhost:3001/api/schedule/today (you'll get 401 without auth, but it confirms the endpoint exists)

### Issue 5: "Invalid or expired token"
**Problem**: Authentication token issue.

**Solution**:
1. Log out
2. Clear localStorage: `localStorage.clear()` in browser console
3. Log in again

## Manual Database Check

If you want to verify the data is in the database:

```bash
# Open Prisma Studio
npx prisma studio
```

Then check:
1. **CourseEnrollment** table - verify Mohamed Hassan (studentId = 2) is enrolled in CS101 and CS501
2. **Schedule** table - verify schedules exist with dayOfWeek = 5 for courses 1 (CS101) and 5 (CS501)

## Quick Test API Call

You can test the API directly using curl (after logging in and copying the access token):

```bash
curl -X GET http://localhost:3001/api/schedule/today \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## What to Report Back

Please share:
1. **Browser console output** - Copy all the schedule-related logs
2. **Terminal output** - Copy the [SCHEDULE/TODAY] logs
3. **Network tab** - Screenshot of the /api/schedule/today request and response
4. **Any error messages** you see

This will help identify exactly where the issue is occurring!


