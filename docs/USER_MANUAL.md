# Smart Campus Assistant - User Manual

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Application**: Smart Campus Assistant  

## Table of Contents

1. [Getting Started](#getting-started)
2. [Command Palette](#command-palette)
3. [User Roles](#user-roles)
4. [Authentication](#authentication)
5. [Dashboard](#dashboard)
6. [User Management](#user-management)
7. [Course Management](#course-management)
8. [Attendance Tracking](#attendance-tracking)
9. [Notifications](#notifications)
10. [AI Chatbot](#ai-chatbot)
11. [Analytics & Reports](#analytics--reports)
12. [Settings](#settings)
13. [Mobile Usage](#mobile-usage)
14. [Troubleshooting](#troubleshooting)

## Getting Started

### System Requirements

- **Web Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Internet Connection**: Stable broadband connection
- **Screen Resolution**: Minimum 320px (mobile) to 1920px+ (desktop)
- **JavaScript**: Must be enabled
- **Mobile Support**: iOS 14+, Android 8+

### First Time Setup

1. **Access the System**
   - Open your web browser
   - Navigate to the Smart Campus Assistant URL
   - The system will redirect you to the login page

2. **Initial Login**
   - **University ID**: 8-digit number (e.g., 12345678)
   - **Password**: 1-9 digits (e.g., 123456)
   - Click "Sign In" to access the system

3. **Password Requirements**
   - University ID: Exactly 8 digits
   - Password: 1-9 digits only
   - No special characters or letters required

## Command Palette

The Command Palette is a powerful search and navigation tool that allows you to quickly access any page or feature in the Smart Campus Assistant.

### Opening the Command Palette

**Keyboard Shortcut:**
- Press `Ctrl+K` (Windows/Linux) or `Cmd+K` (Mac) from anywhere in the app

**Visual Access:**
- Click the amber search button in the bottom-right corner

### Using the Command Palette

1. **Open the Palette**: Use the keyboard shortcut or click the floating button
2. **Start Typing**: Type any word related to what you want to do (e.g., "dashboard", "qr", "chat")
3. **Navigate Results**: Use arrow keys (↑/↓) to move through results
4. **Select Action**: Press Enter or click to select
5. **Close**: Press Escape or click outside

### Search Examples

**For Students:**
- `dashboard` → Go to Dashboard
- `schedule` → View My Schedule
- `qr` or `scan` → Mark Attendance with QR Code
- `attendance` → View Attendance Page
- `history` → View Attendance History
- `chat` or `assistant` → Open AI Assistant
- `notifications` → View Notifications
- `profile` → Go to Profile

**For Professors:**
- `dashboard` → Go to Dashboard
- `courses` → View My Courses
- `create` → Create Attendance Session
- `sessions` → View Active Sessions
- `reports` → View Attendance Reports
- `settings` → Attendance Settings
- `chat` → Open AI Assistant
- `notifications` → View Notifications

**Universal:**
- `theme` → Toggle Dark/Light Mode
- `logout` → Sign Out

### Features

- **Recent Actions**: Your last 5 actions appear at the top
- **Fuzzy Search**: Find things even with typos or partial words
- **Categories**: Actions organized by Navigation, Actions, Settings
- **Fast Access**: Opens instantly with no loading time
- **Dark Mode**: Fully supports light and dark themes

### Benefits

- Navigate anywhere in seconds
- No need to click through menus
- Full keyboard navigation support
- See all available actions at once
- Boost your productivity

For more detailed information, see the [Command Palette Guide](COMMAND_PALETTE_GUIDE.md).

## User Roles

The Smart Campus Assistant supports three main user roles with different access levels and features:

### Student
- **Dashboard**: View personal academic summary and upcoming classes
- **Schedule**: Access course schedules and class timetables
- **Attendance**: Mark attendance using QR codes and view attendance history
- **AI Assistant**: Get help with academic queries and system navigation
- **Notifications**: Receive important updates and reminders
- **Profile**: Manage personal information and settings

### Professor
- **Dashboard**: View teaching schedule and course overview
- **Courses**: Manage course information and student enrollments
- **Attendance**: Generate QR codes and manage student attendance
- **AI Chatbot**: Get assistance with administrative tasks
- **Notifications**: Receive system updates and student notifications
- **Profile**: Manage professional information and preferences

### Administrator
- **Full System Access**: Complete control over all system features
- **User Management**: Create, edit, and manage all user accounts
- **System Configuration**: Configure system settings and preferences
- **Analytics & Reports**: Access comprehensive system analytics
- **Database Management**: Monitor and maintain system database

## Authentication

### Login Process

1. **Navigate to Login Page**
   - Enter your email address
   - Enter your password
   - Click "Sign In"

2. **Two-Factor Authentication (if enabled)**
   - Enter the verification code sent to your registered device
   - Click "Verify"

3. **Session Management**
   - Sessions automatically expire after 24 hours of inactivity
   - You can extend your session by clicking "Stay Logged In"

### Password Management

1. **Change Password**
   - Go to Settings > Security
   - Click "Change Password"
   - Enter current password
   - Enter new password (twice for confirmation)
   - Click "Update Password"

2. **Reset Password**
   - Click "Forgot Password" on login page
   - Enter your email address
   - Check your email for reset instructions
   - Follow the link to create a new password

## Dashboard

### Overview

The dashboard provides a comprehensive view of your academic activities and system status.

### Key Components

1. **Quick Stats**
   - Total courses enrolled
   - Attendance percentage
   - Upcoming classes
   - Recent notifications

2. **Recent Activity**
   - Latest attendance marks
   - Recent course updates
   - System notifications
   - Chatbot interactions

3. **Quick Actions**
   - Mark attendance
   - View schedule
   - Access chatbot
   - Check notifications

### Customization

- **Widgets**: Drag and drop to rearrange dashboard widgets
- **Preferences**: Customize what information is displayed
- **Themes**: Choose between light and dark themes

## User Management

### Profile Management

1. **View Profile**
   - Click on your profile picture in the top-right corner
   - Select "Profile" from the dropdown menu

2. **Edit Profile**
   - Click "Edit Profile" button
   - Update the following information:
     - First Name
     - Last Name
     - Email Address
     - Phone Number
     - Bio/Description
     - University ID
     - Profile Picture
   - Click "Save Changes"

3. **Privacy Settings**
   - Control who can see your profile information
   - Set notification preferences
   - Manage data sharing settings

### User Administration (Admin Only)

1. **Create New User**
   - Navigate to Users > Add New User
   - Fill in required information:
     - Email address
     - First and last name
     - Role (Student/Professor/Admin)
     - Department (if applicable)
   - Click "Create User"

2. **Manage Existing Users**
   - Search for users by name, email, or ID
   - View user details and activity
   - Edit user information
   - Activate/deactivate accounts
   - Reset user passwords

3. **Bulk Operations**
   - Select multiple users
   - Perform bulk actions:
     - Send notifications
     - Export user data
     - Update user roles
     - Delete users

## Course Management

### Course Overview

1. **View All Courses**
   - Navigate to Courses from the main menu
   - See list of all available courses
   - Filter by department, semester, or status

2. **Course Details**
   - Click on any course to view details
   - Information includes:
     - Course code and name
     - Description and objectives
     - Credit hours
     - Professor information
     - Schedule and location
     - Enrolled students

### Course Administration (Professors/Admins)

1. **Create New Course**
   - Click "Add New Course"
   - Fill in course information:
     - Course code (e.g., CS101)
     - Course name
     - Description
     - Credit hours
     - Department
     - Prerequisites
   - Click "Create Course"

2. **Edit Course Information**
   - Select the course to edit
   - Update any course details
   - Save changes

3. **Manage Enrollments**
   - View enrolled students
   - Add/remove students
   - Export enrollment lists

## Attendance Tracking

### Marking Attendance

1. **For Students**
   - Navigate to Attendance > Mark Attendance
   - Select the course and session
   - Choose your attendance status:
     - Present
     - Absent
     - Late
     - Excused
   - Add notes if necessary
   - Click "Submit"

2. **For Professors**
   - Navigate to Attendance > Manage Attendance
   - Select the course and session
   - View student list
   - Mark attendance for each student
   - Add notes or comments
   - Save attendance record

### Attendance Reports

1. **View Attendance History**
   - Navigate to Reports > Attendance
   - Select date range and filters
   - View detailed attendance records
   - Export reports in PDF or Excel format

2. **Attendance Analytics**
   - View attendance trends
   - Identify patterns in absences
   - Generate summary reports
   - Compare attendance across courses

### Attendance Policies

- **Late Policy**: Students marked late after 15 minutes
- **Excused Absences**: Require documentation and approval
- **Make-up Sessions**: Available for excused absences
- **Minimum Attendance**: 80% required for course completion

## Notifications

### Notification Types

1. **System Notifications**
   - System updates and maintenance
   - Security alerts
   - Policy changes

2. **Academic Notifications**
   - Course schedule changes
   - Assignment deadlines
   - Grade updates
   - Attendance reminders

3. **Personal Notifications**
   - Profile updates
   - Password changes
   - Login alerts

### Managing Notifications

1. **View Notifications**
   - Click the notification bell icon
   - See all unread notifications
   - Mark notifications as read

2. **Notification Settings**
   - Go to Settings > Notifications
   - Choose notification types to receive
   - Set delivery preferences:
     - Email notifications
     - In-app notifications
     - SMS notifications (if available)

3. **Notification History**
   - View all past notifications
   - Search and filter notifications
   - Export notification history

## AI Chatbot

### Getting Started with Chatbot

1. **Access Chatbot**
   - Click the chatbot icon in the bottom-right corner
   - Or navigate to Help > AI Assistant

2. **Chat Interface**
   - Type your question in the chat box
   - Press Enter or click Send
   - Wait for the AI response

### Common Use Cases

1. **Academic Support**
   - "What is my schedule for today?"
   - "How do I mark attendance?"
   - "What are the course requirements?"

2. **System Help**
   - "How do I change my password?"
   - "Where can I find my grades?"
   - "How do I update my profile?"

3. **General Information**
   - "What are the attendance policies?"
   - "How do I contact my professor?"
   - "What is the academic calendar?"

### Chatbot Features

- **Multi-language Support**: Available in multiple languages
- **Context Awareness**: Remembers conversation context
- **Smart Suggestions**: Provides relevant suggestions
- **Voice Input**: Speak your questions (if supported)
- **File Upload**: Share documents for analysis

## Analytics & Reports

### Available Reports

1. **Attendance Reports**
   - Individual student attendance
   - Course attendance summaries
   - Department-wide statistics
   - Trend analysis

2. **User Activity Reports**
   - Login frequency
   - Feature usage statistics
   - System engagement metrics

3. **Academic Reports**
   - Course enrollment statistics
   - Grade distributions
   - Performance analytics

### Generating Reports

1. **Select Report Type**
   - Navigate to Reports section
   - Choose the type of report needed

2. **Set Parameters**
   - Select date range
   - Choose filters (course, department, etc.)
   - Set output format (PDF, Excel, CSV)

3. **Generate and Download**
   - Click "Generate Report"
   - Wait for processing
   - Download the completed report

### Dashboard Analytics

- **Real-time Metrics**: Live updates of key statistics
- **Visual Charts**: Graphs and charts for easy understanding
- **Comparative Analysis**: Compare data across time periods
- **Export Options**: Save analytics data for external analysis

## Settings

### Account Settings

1. **Personal Information**
   - Update contact details
   - Change profile picture
   - Modify bio/description

2. **Security Settings**
   - Change password
   - Enable two-factor authentication
   - Manage login sessions
   - View security history

3. **Privacy Settings**
   - Control profile visibility
   - Manage data sharing
   - Set notification preferences

### System Preferences

1. **Display Settings**
   - Choose theme (light/dark)
   - Set language preference
   - Configure date/time format

2. **Notification Preferences**
   - Email notification settings
   - In-app notification preferences
   - SMS notification options

3. **Accessibility**
   - Font size adjustment
   - Accessibility features
   - Screen reader compatibility

## Mobile Usage

### Mobile Features

The Smart Campus Assistant is fully optimized for mobile devices with responsive design and touch-friendly interfaces.

#### Mobile Navigation
- **Hamburger Menu**: Tap the menu icon (☰) in the top-left corner
- **Mobile Drawer**: Swipe from left or tap menu to access navigation
- **Touch Gestures**: Swipe to close modals and navigate between sections
- **Safe Areas**: Automatically adjusts for device notches and home indicators

#### Mobile-Specific Features
- **QR Code Scanning**: Use your device camera to scan attendance QR codes
- **Touch-Friendly Buttons**: All interactive elements are optimized for touch
- **Responsive Tables**: Tables automatically convert to card layout on mobile
- **Mobile Notifications**: Push notifications for important updates
- **Offline Support**: Basic offline functionality with service worker

#### Mobile Performance
- **Fast Loading**: Optimized for mobile networks
- **Lazy Loading**: Components load only when needed
- **Image Optimization**: Compressed images for faster loading
- **Cached Data**: Offline access to previously loaded data

### Mobile Browser Support
- **iOS Safari**: 14.0+
- **Chrome Mobile**: 90+
- **Firefox Mobile**: 88+
- **Samsung Internet**: 14.0+
- **Edge Mobile**: 90+

## Troubleshooting

### Common Issues

1. **Login Problems**
   - **Issue**: Cannot log in with correct credentials
   - **Solution**: 
     - Ensure University ID is exactly 8 digits
     - Ensure password is 1-9 digits only
     - Check if Caps Lock is on
     - Clear browser cache and cookies
     - Try refreshing the page
     - Contact administrator if problem persists

2. **Attendance Not Saving**
   - **Issue**: Attendance marks are not being saved
   - **Solution**:
     - Check internet connection
     - Ensure QR code is still valid and not expired
     - Refresh the page and try again
     - Check if you're enrolled in the course
     - Contact technical support

3. **Slow Performance**
   - **Issue**: System is running slowly
   - **Solution**:
     - Close unnecessary browser tabs
     - Clear browser cache and cookies
     - Check internet connection speed
     - Try using a different browser
     - Restart your device (mobile)

4. **Missing Data**
   - **Issue**: Expected data is not showing
   - **Solution**:
     - Refresh the page
     - Check date filters
     - Verify user permissions
     - Clear browser cache
     - Contact administrator

5. **Mobile-Specific Issues**
   - **Issue**: Touch targets too small
   - **Solution**: The app is designed with 44px minimum touch targets. If issues persist, try zooming in or using landscape mode
   
   - **Issue**: QR code scanning not working
   - **Solution**: 
     - Allow camera permissions when prompted
     - Ensure good lighting
     - Hold device steady
     - Try refreshing the QR code

6. **AI Chatbot Issues**
   - **Issue**: Chatbot not responding
   - **Solution**:
     - Check internet connection
     - Try refreshing the page
     - Clear browser cache
     - Contact technical support if issue persists

### Browser Compatibility

**Supported Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Mobile Browsers:**
- iOS Safari 14.0+
- Chrome Mobile 90+
- Firefox Mobile 88+
- Samsung Internet 14.0+
- Edge Mobile 90+

**Browser Settings:**
- Enable JavaScript
- Allow cookies
- Disable pop-up blockers for the site
- Enable local storage
- Allow camera access (for QR code scanning)

### Getting Help

1. **Self-Service Options**
   - Check this user manual
   - Use the AI chatbot or AI Assistant
   - Search the knowledge base
   - Review FAQ section
   - Check mobile-specific help guides

2. **Contact Support**
   - **Email**: support@smartcampus.edu
   - **Phone**: +1-800-SMART-CAMPUS (Monday-Friday, 8 AM - 6 PM)
   - **Live Chat**: Available during business hours
   - **Ticket System**: Submit support tickets online

3. **Emergency Support**
   - For critical system issues
   - Available 24/7
   - Contact: emergency@smartcampus.edu

### System Status

- **Status Page**: Check system status at status.smartcampus.edu
- **Maintenance Notices**: Posted 24 hours in advance
- **Outage Updates**: Real-time updates during incidents
- **Mobile App**: Check app store for updates

---

## Additional Resources

- **Video Tutorials**: Available in the Help section
- **Training Materials**: Downloadable PDFs and guides
- **Best Practices**: Tips for effective system usage
- **Updates**: Stay informed about new features and improvements
- **Mobile Guide**: Mobile-specific usage instructions
- **Accessibility Guide**: Accessibility features and settings

### Quick Reference

**Login Credentials:**
- University ID: 8 digits (e.g., 12345678)
- Password: 1-9 digits (e.g., 123456)

**Key Features:**
- Mobile responsive design
- QR code attendance scanning
- AI-powered chatbot assistance
- Real-time notifications
- Comprehensive analytics

For the most up-to-date information, please visit our official documentation website or contact your system administrator.
