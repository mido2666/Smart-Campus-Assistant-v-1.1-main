# Profile Page Documentation

## Overview

The Profile Page is a comprehensive user profile management interface for the Smart Campus Assistant web app. It allows students to view and edit their personal information, manage account settings, and access their academic summary.

## Features

### 1. Profile Header
- Editable avatar with upload/preview functionality
- Student name, ID, and major display
- Quick stats: Attendance rate, GPA, and account status
- Toggle edit mode button

### 2. Personal Information Section
- Full name, email, phone number
- Date of birth, address
- Emergency contact information
- Edit mode with form validation

### 3. Account Settings
- Account type display (Student/Teacher)
- Notification preferences toggle
- Change password form with validation
- Password strength requirements (minimum 8 characters)

### 4. Academic Summary
- Current courses count with link to Schedule page
- Upcoming exams count with link to Schedule page
- Attendance records link to Attendance page

### 5. User Actions
- Save changes with validation
- Cancel editing
- Delete account with confirmation modal

## Component Structure

```
src/
├── pages/
│   └── Profile.tsx              # Main profile page component
└── components/
    ├── ProfileHeader.tsx        # Header with avatar and stats
    ├── ProfileForm.tsx          # Personal information form
    ├── AccountSettings.tsx      # Settings and password management
    ├── AcademicSummary.tsx      # Academic information cards
    └── AvatarUploader.tsx       # Avatar upload component
```

## Running Locally

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Navigate to `http://localhost:5173/profile` in your browser

## Design System

### Color Palette
- Primary Blue: `#1E3A8A` (blue-600 in Tailwind)
- Light Grey: `#F3F4F6` (gray-50 in Tailwind)
- Accent Orange: `#F97316` (orange-500 in Tailwind)

### Typography
- Headings: Bold, various sizes (text-xl to text-3xl)
- Body text: Regular weight, gray-700
- Labels: Medium weight, text-sm

### Spacing & Layout
- Card padding: 6 (p-6)
- Section gaps: 6 (gap-6)
- Rounded corners: xl (rounded-xl)
- Subtle shadows: shadow-sm

## Accessibility Features

- Keyboard navigation support
- ARIA labels on interactive elements
- Focus states on all controls
- High contrast text
- Screen reader compatible

## API Integration Guide

### Profile Data Endpoints

Replace the placeholder data in `Profile.tsx` with API calls:

```typescript
// GET user profile
const fetchProfile = async () => {
  try {
    const response = await fetch('/api/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    setProfile(data);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  }
};

// PUT update profile
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
      setOriginalProfile(updatedProfile);
      setIsEditing(false);
      showSuccessToast();
    }
  } catch (error) {
    console.error('Failed to update profile:', error);
    alert('Failed to update profile. Please try again.');
  }
};
```

### Avatar Upload to Backend

The avatar upload uses FormData to send the file to the backend:

```typescript
// In handleAvatarChange
const formData = new FormData();
formData.append('avatar', file);

await fetch('/api/profile/avatar', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

Backend should handle multipart/form-data and return the avatar URL.

### Password Change Endpoint

```typescript
// POST change password
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
      setShowPasswordForm(false);
      alert('Password changed successfully!');
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to change password');
    }
  } catch (error) {
    console.error('Failed to change password:', error);
    alert('Failed to change password. Please try again.');
  }
};
```

### Notification Preferences

```typescript
// PUT update notification settings
const handleNotificationToggle = async () => {
  const newValue = !profile.notificationsEnabled;

  try {
    await fetch('/api/profile/notifications', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ enabled: newValue })
    });

    setProfile({ ...profile, notificationsEnabled: newValue });
  } catch (error) {
    console.error('Failed to update notifications:', error);
  }
};
```

## Responsive Design

The profile page is optimized for:
- Desktop (1024px+): Two-column layout with sidebar
- Tablet (768px-1023px): Adapted grid layout
- Mobile responsiveness can be enhanced with additional breakpoints

## Future Enhancements

1. Add real-time validation for email and phone
2. Integrate with backend authentication system
3. Add profile completion percentage indicator
4. Implement activity log section
5. Add social media links section
6. Support for custom themes/preferences
7. Two-factor authentication settings
8. Export personal data feature

## Tailwind Config

The color palette has been added to `tailwind.config.js`:

```javascript
colors: {
  primary: {
    DEFAULT: '#1E3A8A',
    // ... full range 50-900
  },
  accent: {
    DEFAULT: '#F97316',
    // ... full range 50-900
  }
}
```

Use in components:
- `bg-primary-600` for primary blue backgrounds
- `text-accent-500` for accent orange text
- `hover:bg-primary-700` for darker hover states

## Security Considerations

1. All password changes should be done over HTTPS
2. Implement rate limiting on password change attempts
3. Validate file uploads (type, size) both client and server-side
4. Sanitize all user inputs before saving
5. Use JWT tokens or secure session management
6. Implement CSRF protection for state-changing operations

## Testing Checklist

- [ ] Profile loads with correct data
- [ ] Edit mode enables/disables form fields
- [ ] Avatar upload shows preview before save
- [ ] Form validation prevents invalid submissions
- [ ] Password change validates matching passwords
- [ ] Notification toggle persists changes
- [ ] Navigation links work correctly
- [ ] Cancel discards unsaved changes
- [ ] Delete account shows confirmation modal
- [ ] Success toast appears after saving
- [ ] Keyboard navigation works throughout
- [ ] Focus states are visible
- [ ] Screen reader announces changes

## Support

For questions or issues, refer to the main project documentation or contact the development team.
