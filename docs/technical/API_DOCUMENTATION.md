# API Documentation - Secure Attendance System

## Overview

The Secure Attendance System provides a comprehensive REST API for managing attendance sessions, processing attendance records, detecting fraud, and generating analytics. All endpoints require authentication and implement role-based access control.

## Base URL

```
Production: https://api.secureattendance.com/v1
Development: http://localhost:3000/api
```

## Authentication

All API requests require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Token Format

```json
{
  "userId": "user-123",
  "email": "user@example.com",
  "role": "PROFESSOR|STUDENT|ADMIN",
  "permissions": ["attendance:create", "attendance:read"],
  "iat": 1640995200,
  "exp": 1641081600
}
```

## Rate Limiting

- **General endpoints**: 100 requests per minute
- **Authentication endpoints**: 10 requests per minute
- **Attendance endpoints**: 20 requests per minute
- **Security endpoints**: 50 requests per minute

## Response Format

All responses follow a consistent format:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {},
  "timestamp": "2024-01-15T10:00:00Z"
}
```

## Endpoints

### Authentication

#### POST /auth/login
Authenticate user and return JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "role": "PROFESSOR",
      "permissions": ["attendance:create", "attendance:read"]
    }
  }
}
```

#### POST /auth/refresh
Refresh JWT token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

#### POST /auth/logout
Invalidate JWT token.

### Session Management

#### POST /attendance/sessions
Create a new attendance session.

**Request Body:**
```json
{
  "courseId": 1,
  "title": "Lecture Session",
  "description": "Introduction to Computer Science",
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T11:00:00Z",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "radius": 100,
    "name": "Main Campus"
  },
  "securitySettings": {
    "requireLocation": true,
    "requirePhoto": true,
    "requireDeviceCheck": true,
    "enableFraudDetection": true,
    "maxAttempts": 3,
    "gracePeriod": 300000
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "session-123",
    "courseId": 1,
    "professorId": "user-123",
    "title": "Lecture Session",
    "description": "Introduction to Computer Science",
    "startTime": "2024-01-15T09:00:00Z",
    "endTime": "2024-01-15T11:00:00Z",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "radius": 100,
      "name": "Main Campus"
    },
    "securitySettings": {
      "requireLocation": true,
      "requirePhoto": true,
      "requireDeviceCheck": true,
      "enableFraudDetection": true,
      "maxAttempts": 3,
      "gracePeriod": 300000
    },
    "status": "SCHEDULED",
    "qrCode": "qr-code-123",
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2024-01-15T08:00:00Z"
  }
}
```

#### GET /attendance/sessions
List attendance sessions with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `status` (string): Filter by status (SCHEDULED, ACTIVE, COMPLETED, CANCELLED)
- `courseId` (number): Filter by course ID
- `startDate` (string): Filter by start date (ISO 8601)
- `endDate` (string): Filter by end date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session-123",
        "title": "Lecture Session",
        "status": "ACTIVE",
        "startTime": "2024-01-15T09:00:00Z",
        "endTime": "2024-01-15T11:00:00Z",
        "course": {
          "id": 1,
          "name": "Computer Science 101",
          "code": "CS101"
        },
        "_count": {
          "attendanceRecords": 25
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

#### GET /attendance/sessions/:id
Get detailed information about a specific session.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "session-123",
    "title": "Lecture Session",
    "description": "Introduction to Computer Science",
    "startTime": "2024-01-15T09:00:00Z",
    "endTime": "2024-01-15T11:00:00Z",
    "status": "ACTIVE",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "radius": 100,
      "name": "Main Campus"
    },
    "securitySettings": {
      "requireLocation": true,
      "requirePhoto": true,
      "requireDeviceCheck": true,
      "enableFraudDetection": true,
      "maxAttempts": 3,
      "gracePeriod": 300000
    },
    "course": {
      "id": 1,
      "name": "Computer Science 101",
      "code": "CS101"
    },
    "attendanceRecords": [
      {
        "id": "record-123",
        "studentId": "student-123",
        "timestamp": "2024-01-15T09:30:00Z",
        "status": "PRESENT",
        "location": {
          "latitude": 40.7128,
          "longitude": -74.0060,
          "accuracy": 5
        },
        "deviceFingerprint": "device-123",
        "fraudScore": 15,
        "student": {
          "id": "student-123",
          "email": "student@example.com",
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ],
    "_count": {
      "attendanceRecords": 25
    }
  }
}
```

#### PUT /attendance/sessions/:id
Update an existing session.

**Request Body:**
```json
{
  "title": "Updated Session Title",
  "description": "Updated description",
  "securitySettings": {
    "requireLocation": false,
    "requirePhoto": true,
    "requireDeviceCheck": true,
    "enableFraudDetection": true,
    "maxAttempts": 5,
    "gracePeriod": 600000
  }
}
```

#### DELETE /attendance/sessions/:id
Delete a session (only if not active).

#### POST /attendance/sessions/:id/start
Start an attendance session.

#### POST /attendance/sessions/:id/stop
Stop an attendance session.

### Attendance Processing

#### POST /attendance/scan
Scan QR code and mark attendance.

**Request Body:**
```json
{
  "sessionId": "session-123",
  "qrCode": "qr-code-123",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 5
  },
  "deviceFingerprint": "device-fingerprint-123",
  "photo": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "record-123",
    "sessionId": "session-123",
    "studentId": "student-123",
    "timestamp": "2024-01-15T09:30:00Z",
    "status": "PRESENT",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "accuracy": 5
    },
    "deviceFingerprint": "device-fingerprint-123",
    "photoUrl": "https://storage.example.com/photos/photo-123.jpg",
    "fraudScore": 15,
    "createdAt": "2024-01-15T09:30:00Z"
  }
}
```

#### POST /attendance/mark
Manually mark attendance (professor only).

**Request Body:**
```json
{
  "sessionId": "session-123",
  "studentId": "student-123",
  "status": "PRESENT",
  "notes": "Manual attendance marking"
}
```

#### GET /attendance/status/:sessionId
Get real-time attendance status for a session.

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "session-123",
      "title": "Lecture Session",
      "status": "ACTIVE",
      "startTime": "2024-01-15T09:00:00Z",
      "endTime": "2024-01-15T11:00:00Z",
      "location": {
        "latitude": 40.7128,
        "longitude": -74.0060,
        "radius": 100
      }
    },
    "attendance": {
      "total": 25,
      "present": 20,
      "absent": 3,
      "late": 2,
      "excused": 0
    },
    "records": [
      {
        "id": "record-123",
        "studentId": "student-123",
        "timestamp": "2024-01-15T09:30:00Z",
        "status": "PRESENT",
        "fraudScore": 15,
        "student": {
          "id": "student-123",
          "email": "student@example.com",
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ]
  }
}
```

#### PUT /attendance/records/:id
Update an attendance record.

**Request Body:**
```json
{
  "status": "LATE",
  "notes": "Student arrived late"
}
```

### Security & Fraud Detection

#### POST /attendance/verify-location
Verify student location.

**Request Body:**
```json
{
  "sessionId": "session-123",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isWithinRadius": true,
    "distance": 25.5,
    "requiredRadius": 100,
    "accuracy": 5,
    "fraudScore": 0
  }
}
```

#### POST /attendance/verify-device
Verify student device.

**Request Body:**
```json
{
  "deviceFingerprint": "device-fingerprint-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isVerified": true,
    "deviceInfo": {
      "userAgent": "Mozilla/5.0...",
      "platform": "Win32",
      "language": "en-US"
    },
    "lastUsed": "2024-01-15T08:00:00Z",
    "confidence": 95
  }
}
```

#### POST /attendance/upload-photo
Upload and verify student photo.

**Request Body:**
```multipart/form-data
photo: <file>
sessionId: "session-123"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "photoUrl": "https://storage.example.com/photos/photo-123.jpg",
    "qualityScore": 85,
    "hasFace": true,
    "size": 245760,
    "format": "JPEG"
  }
}
```

#### GET /attendance/fraud-alerts
Get fraud alerts with filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `severity` (string): Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)
- `isResolved` (boolean): Filter by resolution status

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "alert-123",
        "studentId": "student-123",
        "sessionId": "session-123",
        "alertType": "LOCATION_FRAUD",
        "severity": "HIGH",
        "description": "Location spoofing detected",
        "metadata": {
          "fraudScore": 85,
          "location": {
            "latitude": 51.5074,
            "longitude": -0.1278
          }
        },
        "isResolved": false,
        "createdAt": "2024-01-15T09:30:00Z",
        "student": {
          "id": "student-123",
          "email": "student@example.com",
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

#### POST /attendance/report-fraud
Report fraud incident.

**Request Body:**
```json
{
  "sessionId": "session-123",
  "alertType": "LOCATION_FRAUD",
  "severity": "HIGH",
  "description": "Suspicious location detected",
  "metadata": {
    "fraudScore": 85,
    "location": {
      "latitude": 51.5074,
      "longitude": -0.1278
    }
  }
}
```

#### PUT /attendance/fraud-alerts/:id/resolve
Resolve a fraud alert.

**Request Body:**
```json
{
  "resolution": "Investigated and confirmed as false positive"
}
```

### Analytics & Reporting

#### GET /attendance/analytics
Get attendance analytics.

**Query Parameters:**
- `startDate` (string): Start date (ISO 8601)
- `endDate` (string): End date (ISO 8601)
- `courseId` (number): Filter by course ID
- `groupBy` (string): Group by period (day, week, month)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRecords": 1000,
      "presentCount": 850,
      "absentCount": 100,
      "lateCount": 40,
      "excusedCount": 10,
      "attendanceRate": 85.0
    },
    "trends": [
      {
        "date": "2024-01-15",
        "total": 25,
        "present": 20,
        "absent": 3,
        "late": 2,
        "excused": 0,
        "attendanceRate": 80.0
      }
    ],
    "records": [
      {
        "id": "record-123",
        "sessionId": "session-123",
        "studentId": "student-123",
        "timestamp": "2024-01-15T09:30:00Z",
        "status": "PRESENT",
        "fraudScore": 15
      }
    ]
  }
}
```

#### GET /attendance/security-metrics
Get security performance metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSessions": 50,
    "totalAttendance": 1000,
    "fraudAttempts": 25,
    "securityScore": 85.5,
    "riskLevel": "LOW",
    "trends": {
      "attendance": [85, 87, 89, 88, 90],
      "fraud": [5, 3, 2, 4, 1],
      "security": [80, 82, 85, 87, 90]
    }
  }
}
```

#### GET /attendance/reports
Generate attendance reports.

**Query Parameters:**
- `type` (string): Report type (attendance, fraud, security)
- `format` (string): Report format (json, csv, pdf)
- `startDate` (string): Start date (ISO 8601)
- `endDate` (string): End date (ISO 8601)

#### GET /attendance/export/:format
Export data in specified format.

**Path Parameters:**
- `format` (string): Export format (json, csv, xlsx, pdf)

### Device Management

#### POST /attendance/register-device
Register a new device.

**Request Body:**
```json
{
  "deviceFingerprint": "device-fingerprint-123",
  "deviceInfo": {
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "platform": "Win32",
    "language": "en-US",
    "timezone": "America/New_York",
    "screenResolution": "1920x1080",
    "colorDepth": 24,
    "hardwareConcurrency": 8
  },
  "deviceName": "My Laptop"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "device-123",
    "studentId": "student-123",
    "fingerprint": "device-fingerprint-123",
    "deviceInfo": {
      "userAgent": "Mozilla/5.0...",
      "platform": "Win32",
      "language": "en-US"
    },
    "isActive": true,
    "lastUsed": "2024-01-15T09:30:00Z",
    "createdAt": "2024-01-15T09:30:00Z"
  }
}
```

#### GET /attendance/devices
List user devices.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "id": "device-123",
        "fingerprint": "device-fingerprint-123",
        "deviceInfo": {
          "userAgent": "Mozilla/5.0...",
          "platform": "Win32",
          "language": "en-US"
        },
        "isActive": true,
        "lastUsed": "2024-01-15T09:30:00Z",
        "createdAt": "2024-01-15T09:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "pages": 1
    }
  }
}
```

#### DELETE /attendance/devices/:id
Remove a device.

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication required |
| `AUTH_INVALID` | Invalid authentication token |
| `AUTH_EXPIRED` | Authentication token expired |
| `AUTH_FORBIDDEN` | Insufficient permissions |
| `VALIDATION_ERROR` | Request validation failed |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `RESOURCE_CONFLICT` | Resource conflict (e.g., duplicate) |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded |
| `LOCATION_VERIFICATION_FAILED` | Location verification failed |
| `DEVICE_VERIFICATION_FAILED` | Device verification failed |
| `FRAUD_DETECTED` | Fraud detected in request |
| `SESSION_NOT_ACTIVE` | Session is not active |
| `ATTENDANCE_ALREADY_MARKED` | Attendance already marked |
| `INVALID_QR_CODE` | Invalid QR code |
| `LOCATION_OUTSIDE_RADIUS` | Location outside allowed radius |
| `DEVICE_NOT_REGISTERED` | Device not registered |
| `PHOTO_QUALITY_TOO_LOW` | Photo quality too low |
| `INTERNAL_SERVER_ERROR` | Internal server error |

## WebSocket Events

### Connection

```javascript
const socket = io('ws://localhost:3000');

// Authenticate
socket.emit('authenticate', { token: 'jwt_token' });

// Join session
socket.emit('join_session', { sessionId: 'session-123' });
```

### Events

#### Attendance Events
- `attendance:marked` - Real-time attendance updates
- `attendance:failed` - Attendance failure notifications
- `attendance:fraud_detected` - Fraud detection alerts
- `attendance:location_warning` - Location verification issues
- `attendance:device_warning` - Device verification issues

#### Security Events
- `security:fraud_alert` - Real-time fraud alerts
- `security:risk_high` - High-risk activity notifications
- `security:device_change` - Device change alerts
- `security:location_spoof` - Location spoofing detection

#### Session Events
- `session:started` - Session start notifications
- `session:ended` - Session end notifications
- `session:updated` - Session update notifications
- `session:emergency_stop` - Emergency session stop

#### Notification Events
- `notification:security` - Security notifications
- `notification:attendance` - Attendance notifications
- `notification:system` - System notifications
- `notification:emergency` - Emergency notifications

## SDK Examples

### JavaScript/TypeScript

```typescript
import { AttendanceAPI } from '@secure-attendance/sdk';

const api = new AttendanceAPI({
  baseURL: 'https://api.secureattendance.com/v1',
  token: 'jwt_token_here'
});

// Create session
const session = await api.sessions.create({
  courseId: 1,
  title: 'Lecture Session',
  startTime: '2024-01-15T09:00:00Z',
  endTime: '2024-01-15T11:00:00Z',
  securitySettings: {
    requireLocation: true,
    requirePhoto: true,
    enableFraudDetection: true
  }
});

// Mark attendance
const attendance = await api.attendance.scan({
  sessionId: 'session-123',
  qrCode: 'qr-code-123',
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    accuracy: 5
  }
});
```

### Python

```python
from secure_attendance import AttendanceAPI

api = AttendanceAPI(
    base_url='https://api.secureattendance.com/v1',
    token='jwt_token_here'
)

# Create session
session = api.sessions.create(
    course_id=1,
    title='Lecture Session',
    start_time='2024-01-15T09:00:00Z',
    end_time='2024-01-15T11:00:00Z',
    security_settings={
        'require_location': True,
        'require_photo': True,
        'enable_fraud_detection': True
    }
)

# Mark attendance
attendance = api.attendance.scan(
    session_id='session-123',
    qr_code='qr-code-123',
    location={
        'latitude': 40.7128,
        'longitude': -74.0060,
        'accuracy': 5
    }
)
```

## Rate Limiting

Rate limits are applied per user and reset every minute:

- **Authentication**: 10 requests/minute
- **Session Management**: 20 requests/minute
- **Attendance Processing**: 20 requests/minute
- **Security & Fraud**: 50 requests/minute
- **Analytics**: 30 requests/minute
- **Device Management**: 10 requests/minute

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995260
```

## Pagination

List endpoints support pagination:

```http
GET /attendance/sessions?page=1&limit=20
```

Response includes pagination metadata:

```json
{
  "data": {
    "sessions": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

## Filtering and Sorting

Many endpoints support filtering and sorting:

```http
GET /attendance/sessions?status=ACTIVE&courseId=1&sort=startTime&order=desc
```

## Webhooks

Configure webhooks for real-time notifications:

```json
{
  "url": "https://your-app.com/webhooks/attendance",
  "events": ["attendance:marked", "fraud:detected"],
  "secret": "webhook_secret"
}
```

## Changelog

### v1.2.0 (2024-01-15)
- Added fraud detection endpoints
- Enhanced security features
- Improved analytics

### v1.1.0 (2024-01-01)
- Added device management
- Enhanced location verification
- Improved error handling

### v1.0.0 (2023-12-01)
- Initial API release
- Basic attendance functionality
- Core security features
