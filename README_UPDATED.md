# Smart Campus Assistant

A modern web application for managing campus activities, attendance, schedules, and student services built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Authentication:** Student and Professor login with role-based routing
- **Dashboard:** Overview of classes, attendance, exams, and announcements
- **Schedule Management:** Week and day view of class schedules
- **Attendance Tracking:** Real-time attendance monitoring and statistics
- **Smart Chatbot:** AI-powered assistant for campus queries
- **Notifications:** Real-time updates and announcements
- **Profile Management:** Edit personal information, change passwords, manage settings

## 📋 Prerequisites

- Node.js 16+ and npm
- Modern web browser (Chrome, Firefox, Safari, or Edge)

## 🛠️ Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd project
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup (Optional)
If using Supabase for backend:
```bash
# Create .env file
cp .env.example .env

# Add your Supabase credentials
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 5. Build for Production
```bash
npm run build
```

Build output will be in the `dist/` directory.

### 6. Preview Production Build
```bash
npm run preview
```

---

## 📁 Project Structure

```
project/
├── src/
│   ├── pages/                  # Page components
│   │   ├── Login.tsx           # Login page
│   │   ├── StudentDashboard.tsx # Main dashboard
│   │   ├── Schedule.tsx        # Class schedule
│   │   ├── Attendance.tsx      # Attendance tracking
│   │   ├── Chatbot.tsx         # AI chatbot
│   │   ├── Notifications.tsx   # Notifications center
│   │   └── Profile.tsx         # User profile
│   ├── components/             # Reusable components
│   │   ├── Navbar.tsx          # Top navigation
│   │   ├── Sidebar.tsx         # Side navigation
│   │   ├── NotificationBell.tsx
│   │   ├── ProfileHeader.tsx
│   │   ├── ProfileForm.tsx
│   │   ├── AccountSettings.tsx
│   │   ├── AvatarUploader.tsx
│   │   ├── ScheduleClassCard.tsx
│   │   ├── AttendanceCalendar.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   └── ... (20+ components)
│   ├── data/                   # Placeholder data
│   │   └── notificationsData.ts
│   ├── assets/                 # Static assets
│   └── App.tsx                 # Main app component
├── public/                     # Public assets
├── CHANGELOG_UI_REVIEW.md      # Detailed fix documentation
├── UI_REVIEW_REPORT.md         # Comprehensive review
├── REVIEW_SUMMARY.md           # Quick reference
└── PROFILE_PAGE_README.md      # Profile page docs
```

---

## 🎨 Design System

### Color Palette
```javascript
Primary Blue:    #1E3A8A (blue-600)
Light Grey:      #F3F4F6 (gray-50)
Accent Orange:   #F97316 (orange-500)

// Full palette available in tailwind.config.js
colors: {
  primary: { DEFAULT: '#1E3A8A', ...shades },
  accent: { DEFAULT: '#F97316', ...shades }
}
```

### Typography
- **Headings:** Bold, sizes from text-xl to text-4xl
- **Body:** Regular weight, gray-700
- **Labels:** Medium weight, text-sm

### Spacing & Components
- **Card padding:** p-6
- **Section gaps:** gap-6
- **Border radius:** rounded-xl
- **Shadows:** shadow-sm for cards

---

## 🔗 API Integration Guide

### Current State
The application uses placeholder data located in:
- `src/data/notificationsData.ts` (centralized)
- Inline data in Schedule, Attendance, and Profile pages

### Replacing Placeholder Data with API

#### 1. Profile Page (`src/pages/Profile.tsx`)

**Fetch User Profile:**
```typescript
import { useEffect, useState } from 'react';

const fetchProfile = async () => {
  try {
    const response = await fetch('/api/profile', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    setProfile(data);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  }
};

useEffect(() => {
  fetchProfile();
}, []);
```

**Update Profile:**
```typescript
const handleSave = async () => {
  if (!validateForm()) return;

  try {
    const formData = new FormData();
    formData.append('name', profile.name);
    formData.append('email', profile.email);
    formData.append('phone', profile.phone);
    formData.append('dob', profile.dob);
    formData.append('address', profile.address);
    formData.append('emergencyContact', profile.emergencyContact);

    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (response.ok) {
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      showSuccessToast();
    }
  } catch (error) {
    console.error('Failed to update profile:', error);
  }
};
```

**Change Password:**
```typescript
const handlePasswordChange = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const response = await fetch('/api/profile/change-password', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      })
    });

    if (response.ok) {
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password changed successfully!');
    }
  } catch (error) {
    console.error('Failed to change password:', error);
  }
};
```

#### 2. Notifications Page (`src/pages/Notifications.tsx`)

**Fetch Notifications:**
```typescript
const fetchNotifications = async () => {
  try {
    const response = await fetch('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    setNotifications(data);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
  }
};
```

**Mark as Read:**
```typescript
const handleNotificationClick = async (notification: Notification) => {
  if (!notification.read) {
    try {
      await fetch(`/api/notifications/${notification.id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }
};
```

**Mark All as Read:**
```typescript
const handleMarkAllRead = async () => {
  try {
    await fetch('/api/notifications/read-all', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  } catch (error) {
    console.error('Failed to mark all as read:', error);
  }
};
```

#### 3. Schedule Page (`src/pages/Schedule.tsx`)

**Fetch Schedule:**
```typescript
const fetchSchedule = async () => {
  try {
    const response = await fetch('/api/schedule', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    setScheduleData(data);
  } catch (error) {
    console.error('Failed to fetch schedule:', error);
  }
};
```

#### 4. Attendance Page (`src/pages/Attendance.tsx`)

**Fetch Attendance:**
```typescript
const fetchAttendance = async () => {
  try {
    const response = await fetch('/api/attendance', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    setAttendanceData(data.records);
    setCalendarData(data.calendar);
  } catch (error) {
    console.error('Failed to fetch attendance:', error);
  }
};
```

**Mark Attendance:**
```typescript
const markAttendance = async (classId: string) => {
  try {
    await fetch('/api/attendance/mark', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ classId, status: 'present' })
    });

    await fetchAttendance(); // Refresh data
  } catch (error) {
    console.error('Failed to mark attendance:', error);
  }
};
```

#### 5. Chatbot Page (`src/pages/Chatbot.tsx`)

**Send Message to API:**
```typescript
const handleSendMessage = async (text: string) => {
  const userMessage = {
    id: messageIdCounter.current++,
    text,
    isUser: true,
    timestamp: 'Just now'
  };

  setMessages(prev => [...prev, userMessage]);
  setIsTyping(true);

  try {
    const response = await fetch('/api/chatbot/message', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: text })
    });

    const data = await response.json();

    const botMessage = {
      id: messageIdCounter.current++,
      text: data.response,
      isUser: false,
      timestamp: 'Just now',
      icon: data.icon
    };

    setMessages(prev => [...prev, botMessage]);
  } catch (error) {
    console.error('Failed to send message:', error);
  } finally {
    setIsTyping(false);
  }
};
```

**WebSocket Implementation (Real-time):**
```typescript
useEffect(() => {
  const ws = new WebSocket('ws://your-api/chatbot/stream');

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const botMessage = {
      id: messageIdCounter.current++,
      text: data.message,
      isUser: false,
      timestamp: 'Just now',
      icon: data.icon
    };
    setMessages(prev => [...prev, botMessage]);
  };

  return () => ws.close();
}, []);
```

### Required API Endpoints

```
Authentication:
  POST   /api/auth/login          - User login
  POST   /api/auth/logout         - User logout
  POST   /api/auth/refresh        - Refresh token

User Profile:
  GET    /api/profile             - Get user profile
  PUT    /api/profile             - Update profile
  POST   /api/profile/avatar      - Upload avatar
  POST   /api/profile/change-password - Change password
  PUT    /api/profile/notifications - Update notification settings

Schedule:
  GET    /api/schedule            - Get user schedule
  GET    /api/schedule/:classId   - Get specific class details

Attendance:
  GET    /api/attendance          - Get attendance records
  POST   /api/attendance/mark     - Mark attendance
  GET    /api/attendance/stats    - Get attendance statistics

Notifications:
  GET    /api/notifications       - Get all notifications
  PUT    /api/notifications/:id/read - Mark notification as read
  PUT    /api/notifications/read-all - Mark all as read

Chatbot:
  POST   /api/chatbot/message     - Send message
  WS     /api/chatbot/stream      - WebSocket for real-time chat
```

---

## 🔐 Authentication Flow

### Current Implementation (Placeholder)
```typescript
// src/pages/Login.tsx
const handleLogin = (e: React.FormEvent) => {
  e.preventDefault();
  // Currently just navigates based on role
  if (role === 'student') {
    navigate('/student-dashboard');
  } else {
    navigate('/professor-dashboard');
  }
};
```

### Production Implementation
```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        universityId,
        password,
        role
      })
    });

    if (response.ok) {
      const { token, user } = await response.json();

      // Store token
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Navigate based on role
      if (role === 'student') {
        navigate('/student-dashboard');
      } else {
        navigate('/professor-dashboard');
      }
    } else {
      const error = await response.json();
      alert(error.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Network error. Please try again.');
  }
};
```

---

## 🧪 Testing

### Manual Testing
```bash
# Start dev server
npm run dev

# Test all pages:
# 1. Login (/)
# 2. Dashboard (/student-dashboard)
# 3. Schedule (/schedule)
# 4. Attendance (/attendance)
# 5. Chatbot (/chatbot)
# 6. Notifications (/notifications)
# 7. Profile (/profile)
```

### Automated Testing (Future)
```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run linting
npm run lint
```

---

## 📝 Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
npm run typecheck # Run TypeScript type checking
```

---

## 🐛 Known Issues & Fixes

### Critical Issues Identified (See CHANGELOG_UI_REVIEW.md for details)

1. **Schedule Page Data Errors**
   - Invalid time ranges (e.g., "2:00 - 2:00", "1:00 - 22:30")
   - Zero durations
   - Status: Needs fixing before production

2. **Typos in User-Facing Text**
   - Chatbot: "attenlance", "cleasses"
   - Schedule: "meiss"
   - Attendance: "particiption"
   - Status: Needs fixing before production

3. **Data Inconsistencies**
   - Professor name formatting (commas vs periods)
   - Duplicate calendar days
   - Status: Needs fixing before production

For complete list of issues and fixes, see:
- `CHANGELOG_UI_REVIEW.md` - Detailed fixes
- `UI_REVIEW_REPORT.md` - Comprehensive review
- `REVIEW_SUMMARY.md` - Quick reference

---

## 📚 Additional Documentation

- **Profile Page:** See `PROFILE_PAGE_README.md`
- **UI Review:** See `UI_REVIEW_REPORT.md`
- **Changelog:** See `CHANGELOG_UI_REVIEW.md`
- **Quick Reference:** See `REVIEW_SUMMARY.md`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards
- Use TypeScript for type safety
- Use Tailwind CSS for styling (no inline styles)
- Follow existing component structure
- Add proper accessibility attributes
- Test on multiple browsers

---

## 📄 License

[Your License Here]

---

## 👥 Team

[Your Team Information]

---

## 📞 Support

For questions or issues:
- Technical: Check documentation files
- Bugs: Open an issue on GitHub
- Feature requests: Open a discussion

---

*Last Updated: October 10, 2025*
*Version: 0.2025*
