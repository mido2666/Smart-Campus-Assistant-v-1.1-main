# Unified User Manual - Smart Campus Assistant

## 1. Introduction

Welcome to the Smart Campus Assistant! This system provides a comprehensive suite of tools for both students and professors to manage academic activities, track attendance, and enhance campus interaction. This manual will guide you through the various features and functionalities available.

## 2. Getting Started

### 2.1. Accessing the System

1.  Navigate to the Smart Campus Assistant URL.
2.  Enter your credentials (University ID/Email and Password).
3.  You will be redirected to your respective Dashboard (Student or Professor).

### 2.2. Dashboard Overview

Your dashboard provides a personalized overview of your key activities and information. Specific details will vary based on your role (Student or Professor).

### 2.3. Profile Setup

1.  Click on your profile icon (usually in the top-right corner).
2.  Select "Settings" or "Profile" from the dropdown menu.
3.  Configure your preferences, which may include:
    *   Notification Settings (Email and Push notifications)
    *   Security Preferences (e.g., fraud detection sensitivity for professors, device registration for students)
    *   Display Options (Theme and layout preferences)
    *   Privacy Settings (e.g., location and photo permissions for students)

## 3. Student Features

### 3.1. Marking Attendance

This system utilizes a secure, multi-step verification process for marking attendance, including QR code scanning, location verification, device verification, and photo capture.

#### 3.1.1. Finding Active Sessions

1.  Navigate to "Attendance" in the main menu.
2.  View available sessions, which will display:
    *   **Session Title**: Course and session name.
    *   **Time**: Session start and end times.
    *   **Location**: Session location (if applicable).
    *   **Requirements**: Security requirements (location, photo, device check).

#### 3.1.2. Multi-Step Attendance Process

**Step 1: QR Code Scanning**

1.  Click "Mark Attendance" on an active session.
2.  Allow camera access when prompted.
3.  Point your camera at the QR code displayed by your professor.
4.  Wait for QR code verification and review the displayed session information.

**Step 2: Location Verification (if required)**

1.  Allow location access when prompted.
2.  Wait for GPS location to be determined and verified within the allowed radius (typically within 10 meters).

**Step 3: Device Verification (if required)**

1.  Your registered device will be automatically verified for security status and compliance.

**Step 4: Photo Capture (if required)**

1.  Allow camera access when prompted.
2.  Position yourself in the camera frame with good lighting and clear visibility.
3.  Take the attendance photo and verify its quality.

**Step 5: Final Confirmation**

1.  Review all verification steps and the security summary.
2.  Confirm attendance submission and wait for final confirmation.

#### 3.1.3. Attendance Status

Your attendance will be marked as:
*   **Present**: Successfully marked attendance.
*   **Late**: Marked attendance after the grace period.
*   **Absent**: Did not mark attendance.
*   **Excused**: Excused absence (requires professor approval).

### 3.2. Attendance History & Analytics

#### 3.2.1. Viewing History

Access your attendance history to view:
*   **Session Information**: Course, date, time.
*   **Attendance Status**: Present, absent, late, excused.
*   **Security Details**: Location, device, photo verification status.
*   **Fraud Score**: Security risk assessment (if applicable).

#### 3.2.2. Personal Statistics

View your attendance statistics, including:
*   **Overall Attendance Rate**: Percentage of sessions attended.
*   **Attendance Trends**: Historical attendance patterns.
*   **Course Performance**: Attendance breakdown by course.

## 4. Professor Features

### 4.1. Session Management

#### 4.1.1. Creating Attendance Sessions

1.  Navigate to "Sessions" in the main menu.
2.  Click "Create New Session" and fill in the details:
    *   **Course**: Select from your assigned courses.
    *   **Title**: Session title (e.g., "Lecture 1: Introduction").
    *   **Description**: Optional session description.
    *   **Start Time & End Time**: Define the session duration.

#### 4.1.2. Advanced Security Settings

Configure security options for enhanced fraud prevention:
*   **Location Settings**: Require students to be within a specified radius, set radius, and location name.
*   **Device Security**: Require device checks, student device registration, and detect shared devices.
*   **Photo Verification**: Require attendance photos, set minimum photo quality, and enable optional face detection.
*   **Fraud Detection**: Activate ML-based fraud detection, set risk thresholds, and configure alert notifications.

#### 4.1.3. Managing Sessions

*   **Starting Sessions**: From "Scheduled" sessions, click "Start Session," confirm, share the QR code, and monitor real-time attendance.
*   **Session Monitoring**: During active sessions, monitor live attendance count, student status, security alerts, and verification statuses.
*   **Stopping Sessions**: Click "Stop Session," confirm, review the final summary, and generate reports.
*   **Emergency Stop**: For urgent situations, use "Emergency Stop," provide a reason, and the system will immediately stop the session and notify students.

### 4.2. Student Management

#### 4.2.1. Student Overview

View all students in your courses, including their information, attendance history, registered devices, and security status.

#### 4.2.2. Manual Attendance & Bulk Operations

*   **Marking Attendance**: Manually mark student attendance for a session, setting status (Present, Absent, Late, Excused) and adding notes.
*   **Bulk Operations**: Perform actions like marking all students present/absent, excusing students, or exporting attendance data.

### 4.3. Fraud Detection & Security Management

#### 4.3.1. Fraud Alerts

Monitor and manage fraud alerts through an alert dashboard, reviewing details, investigating suspicious activity, and resolving or escalating alerts.

#### 4.3.2. Security Settings

Configure system-wide security settings (global) and override them for specific sessions (session-specific security).

### 4.4. Reporting and Analytics

#### 4.4.1. Attendance Reports

Generate standard reports (session, course, student, date range summaries) and create custom reports with selected parameters, data fields, filters, and sorting options. Export reports in PDF, Excel, CSV, or JSON formats.

#### 4.4.2. Analytics Dashboard

Monitor key performance indicators (overall attendance rate, fraud detection rate, security score) and analyze trends over time. The system also offers predictive analytics for attendance, risk, security, and performance.

## 5. Security Features

### 5.1. Device Registration

Register your devices (e.g., laptop, mobile) in "Settings" → "Device Management" to enable device verification for attendance. You can view, remove, and update registered devices.

### 5.2. Location Permissions

Grant location access when prompted and configure location settings (accuracy, privacy, sharing) to enable GPS-based attendance verification.

### 5.3. Photo Permissions

Grant camera access when prompted and configure photo settings (quality, format, privacy) to enable photo capture for attendance verification.

### 5.4. Data Protection

Your personal data is protected through encryption, secure storage, access control, and compliance with privacy regulations (e.g., GDPR, FERPA). Data is used for attendance tracking, security verification, analytics, and compliance.

### 5.5. Account & Device Security Best Practices

*   **Account Security**: Use strong, unique passwords; keep the system updated; use secure networks; always log out when finished.
*   **Device Security**: Register only your devices; use secure, updated browsers; use secure networks; keep devices updated.

## 6. Troubleshooting & Support

### 6.1. Common Issues

#### Attendance Issues

*   **Problem**: Can't mark attendance.
    *   **Solution**: Check if the session is active, verify your location, ensure all permissions are granted, refresh the page, or contact support.
*   **Problem**: QR code not scanning.
    *   **Solution**: Check camera permissions, ensure good lighting, hold the device steady, try different angles, or contact your professor.

#### Security Issues

*   **Problem**: Location verification failing.
    *   **Solution**: Check location permissions, ensure GPS is enabled, move to an area with better signal, check internet connection, or try again.
*   **Problem**: Device verification failing.
    *   **Solution**: Check device registration, ensure browser compatibility, clear browser cache, try a different browser, or contact support.

#### Photo Issues

*   **Problem**: Photo not capturing.
    *   **Solution**: Check camera permissions, ensure good lighting, position yourself clearly, try different angles, or check camera functionality.
*   **Problem**: Photo quality too low.
    *   **Solution**: Improve lighting, ensure clear visibility, position yourself properly, clean the camera lens, or try again.

### 6.2. Getting Help

*   **Support Resources**: Access comprehensive help documentation, video tutorials, and an FAQ section.
*   **Contact Information**: Email support (support@secureattendance.com), Phone support (1-800-ATTENDANCE), Live Chat (during business hours), and 24/7 Emergency Support.

## 7. Mobile Access

### 7.1. Mobile App

The mobile app provides quick attendance marking, real-time push notifications, limited offline functionality, and full security verification. Download from your app store, install, log in, and configure settings.

### 7.2. Mobile Web

Access the system via mobile web using supported browsers (Chrome, Safari, Firefox) with JavaScript, camera, and location access enabled. The system is optimized with responsive design, a touch interface, and mobile-specific features.

## 8. Best Practices

### 8.1. Attendance Best Practices

*   **Before Sessions**: Check requirements, test permissions, prepare your device, and verify your location.
*   **During Sessions**: Follow instructions, be patient with verification, stay in the session location, and contact support if needed.
*   **After Sessions**: Verify your attendance status, review history, report issues, and update settings.

### 8.2. Security Best Practices

*   **Fraud Prevention (Professors)**: Monitor alerts, investigate suspicious activity, keep settings current, and educate students.
*   **Data Protection**: Use secure login, keep the system updated, back up data, and comply with privacy regulations.

### 8.3. Communication Best Practices (Professors)

*   **Clear Instructions**: Clearly explain attendance requirements, security features, troubleshooting, and support contact.
*   **Regular Updates**: Notify students of session changes, system updates, security updates, and new feature announcements.

## 9. Advanced Features (Professors)

### 9.1. API Integration

Access the system via REST API with JWT token authentication. Full API endpoint documentation, rate limiting information, and code examples are available. Webhook integration for event notifications is also supported.

### 9.2. Custom Integrations

Integrate with Learning Management Systems (Canvas, Blackboard, Moodle) and third-party tools (calendar systems, communication tools, analytics tools, security tools).