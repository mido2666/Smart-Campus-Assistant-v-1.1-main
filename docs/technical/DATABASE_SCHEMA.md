# Database Schema Documentation - Secure Attendance System

## Overview

The Secure Attendance System uses PostgreSQL as the primary database with Prisma ORM for type-safe database operations. The schema is designed to support comprehensive attendance tracking, fraud detection, and security features.

## Database Configuration

```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Core Tables

### Users Table

```sql
CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
  "permissions" TEXT[],
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastLogin" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
```

**Fields:**
- `id`: Unique user identifier (UUID)
- `email`: User email address (unique)
- `password`: Hashed password
- `firstName`: User's first name
- `lastName`: User's last name
- `role`: User role (STUDENT, PROFESSOR, ADMIN)
- `permissions`: Array of permission strings
- `isActive`: Account status
- `lastLogin`: Last login timestamp
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

**Indexes:**
```sql
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_isActive_idx" ON "User"("isActive");
```

### Courses Table

```sql
CREATE TABLE "Course" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "professorId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("professorId") REFERENCES "User"("id") ON DELETE CASCADE
);
```

**Fields:**
- `id`: Course identifier (auto-increment)
- `name`: Course name
- `code`: Course code (unique)
- `description`: Course description
- `professorId`: Professor user ID
- `isActive`: Course status
- `createdAt`: Course creation timestamp
- `updatedAt`: Last update timestamp

**Indexes:**
```sql
CREATE INDEX "Course_code_idx" ON "Course"("code");
CREATE INDEX "Course_professorId_idx" ON "Course"("professorId");
CREATE INDEX "Course_isActive_idx" ON "Course"("isActive");
```

### Course Enrollments Table

```sql
CREATE TABLE "CourseEnrollment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" INTEGER NOT NULL,
  "studentId" TEXT NOT NULL,
  "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE,
  FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE,
  UNIQUE("courseId", "studentId")
);
```

**Fields:**
- `id`: Enrollment identifier (UUID)
- `courseId`: Course ID
- `studentId`: Student user ID
- `enrolledAt`: Enrollment timestamp
- `isActive`: Enrollment status

**Indexes:**
```sql
CREATE INDEX "CourseEnrollment_courseId_idx" ON "CourseEnrollment"("courseId");
CREATE INDEX "CourseEnrollment_studentId_idx" ON "CourseEnrollment"("studentId");
CREATE UNIQUE INDEX "CourseEnrollment_courseId_studentId_key" ON "CourseEnrollment"("courseId", "studentId");
```

## Attendance Tables

### Attendance Sessions Table

```sql
CREATE TABLE "AttendanceSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" INTEGER NOT NULL,
  "professorId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "location" JSONB,
  "securitySettings" JSONB NOT NULL,
  "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
  "qrCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE,
  FOREIGN KEY ("professorId") REFERENCES "User"("id") ON DELETE CASCADE
);
```

**Fields:**
- `id`: Session identifier (UUID)
- `courseId`: Course ID
- `professorId`: Professor user ID
- `title`: Session title
- `description`: Session description
- `startTime`: Session start time
- `endTime`: Session end time
- `location`: Location data (JSON)
- `securitySettings`: Security configuration (JSON)
- `status`: Session status
- `qrCode`: QR code for attendance
- `createdAt`: Session creation timestamp
- `updatedAt`: Last update timestamp

**Location JSON Structure:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radius": 100,
  "name": "Main Campus"
}
```

**Security Settings JSON Structure:**
```json
{
  "requireLocation": true,
  "requirePhoto": true,
  "requireDeviceCheck": true,
  "enableFraudDetection": true,
  "maxAttempts": 3,
  "gracePeriod": 300000
}
```

**Indexes:**
```sql
CREATE INDEX "AttendanceSession_courseId_idx" ON "AttendanceSession"("courseId");
CREATE INDEX "AttendanceSession_professorId_idx" ON "AttendanceSession"("professorId");
CREATE INDEX "AttendanceSession_status_idx" ON "AttendanceSession"("status");
CREATE INDEX "AttendanceSession_startTime_idx" ON "AttendanceSession"("startTime");
CREATE INDEX "AttendanceSession_endTime_idx" ON "AttendanceSession"("endTime");
```

### Attendance Records Table

```sql
CREATE TABLE "AttendanceRecord" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL,
  "status" "AttendanceStatus" NOT NULL,
  "location" JSONB,
  "deviceFingerprint" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "photoUrl" TEXT,
  "fraudScore" INTEGER,
  "attemptId" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE,
  FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("attemptId") REFERENCES "AttendanceAttempt"("id") ON DELETE SET NULL
);
```

**Fields:**
- `id`: Record identifier (UUID)
- `sessionId`: Session ID
- `studentId`: Student user ID
- `timestamp`: Attendance timestamp
- `status`: Attendance status
- `location`: Location data (JSON)
- `deviceFingerprint`: Device fingerprint
- `ipAddress`: IP address
- `userAgent`: User agent string
- `photoUrl`: Photo URL
- `fraudScore`: Fraud detection score
- `attemptId`: Related attempt ID
- `notes`: Additional notes
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp

**Location JSON Structure:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 5
}
```

**Indexes:**
```sql
CREATE INDEX "AttendanceRecord_sessionId_idx" ON "AttendanceRecord"("sessionId");
CREATE INDEX "AttendanceRecord_studentId_idx" ON "AttendanceRecord"("studentId");
CREATE INDEX "AttendanceRecord_timestamp_idx" ON "AttendanceRecord"("timestamp");
CREATE INDEX "AttendanceRecord_status_idx" ON "AttendanceRecord"("status");
CREATE INDEX "AttendanceRecord_fraudScore_idx" ON "AttendanceRecord"("fraudScore");
```

### Attendance Attempts Table

```sql
CREATE TABLE "AttendanceAttempt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "qrCodeId" TEXT NOT NULL,
  "attemptTime" TIMESTAMP(3) NOT NULL,
  "location" JSONB,
  "deviceFingerprint" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "photoUrl" TEXT,
  "status" "AttendanceAttemptStatus" NOT NULL,
  "failureReason" TEXT,
  "fraudScore" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("qrCodeId") REFERENCES "QRCode"("id") ON DELETE CASCADE
);
```

**Fields:**
- `id`: Attempt identifier (UUID)
- `studentId`: Student user ID
- `qrCodeId`: QR code ID
- `attemptTime`: Attempt timestamp
- `location`: Location data (JSON)
- `deviceFingerprint`: Device fingerprint
- `ipAddress`: IP address
- `userAgent`: User agent string
- `photoUrl`: Photo URL
- `status`: Attempt status
- `failureReason`: Failure reason
- `fraudScore`: Fraud detection score
- `createdAt`: Attempt creation timestamp

**Indexes:**
```sql
CREATE INDEX "AttendanceAttempt_studentId_idx" ON "AttendanceAttempt"("studentId");
CREATE INDEX "AttendanceAttempt_qrCodeId_idx" ON "AttendanceAttempt"("qrCodeId");
CREATE INDEX "AttendanceAttempt_attemptTime_idx" ON "AttendanceAttempt"("attemptTime");
CREATE INDEX "AttendanceAttempt_status_idx" ON "AttendanceAttempt"("status");
CREATE INDEX "AttendanceAttempt_fraudScore_idx" ON "AttendanceAttempt"("fraudScore");
```

## Security Tables

### QR Codes Table

```sql
CREATE TABLE "QRCode" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "code" TEXT NOT NULL UNIQUE,
  "latitude" DECIMAL(10,8),
  "longitude" DECIMAL(11,8),
  "radius" INTEGER,
  "validFrom" TIMESTAMP(3) NOT NULL,
  "validTo" TIMESTAMP(3) NOT NULL,
  "maxAttempts" INTEGER NOT NULL DEFAULT 1,
  "isLocationRequired" BOOLEAN NOT NULL DEFAULT false,
  "isPhotoRequired" BOOLEAN NOT NULL DEFAULT false,
  "isDeviceCheckRequired" BOOLEAN NOT NULL DEFAULT false,
  "gracePeriod" INTEGER NOT NULL DEFAULT 0,
  "fraudDetectionEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE
);
```

**Fields:**
- `id`: QR code identifier (UUID)
- `sessionId`: Session ID
- `code`: QR code string (unique)
- `latitude`: Location latitude
- `longitude`: Location longitude
- `radius`: Location radius in meters
- `validFrom`: Validity start time
- `validTo`: Validity end time
- `maxAttempts`: Maximum attempts allowed
- `isLocationRequired`: Location requirement flag
- `isPhotoRequired`: Photo requirement flag
- `isDeviceCheckRequired`: Device check requirement flag
- `gracePeriod`: Grace period in milliseconds
- `fraudDetectionEnabled`: Fraud detection flag
- `createdAt`: QR code creation timestamp
- `updatedAt`: Last update timestamp

**Indexes:**
```sql
CREATE UNIQUE INDEX "QRCode_code_key" ON "QRCode"("code");
CREATE INDEX "QRCode_sessionId_idx" ON "QRCode"("sessionId");
CREATE INDEX "QRCode_validFrom_idx" ON "QRCode"("validFrom");
CREATE INDEX "QRCode_validTo_idx" ON "QRCode"("validTo");
```

### Fraud Alerts Table

```sql
CREATE TABLE "FraudAlert" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "qrCodeId" TEXT NOT NULL,
  "alertType" "FraudAlertType" NOT NULL,
  "severity" "AlertSeverity" NOT NULL,
  "description" TEXT NOT NULL,
  "metadata" JSONB,
  "isResolved" BOOLEAN NOT NULL DEFAULT false,
  "resolvedAt" TIMESTAMP(3),
  "resolvedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("qrCodeId") REFERENCES "QRCode"("id") ON DELETE CASCADE,
  FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE SET NULL
);
```

**Fields:**
- `id`: Alert identifier (UUID)
- `studentId`: Student user ID
- `qrCodeId`: QR code ID
- `alertType`: Alert type
- `severity`: Alert severity
- `description`: Alert description
- `metadata`: Additional metadata (JSON)
- `isResolved`: Resolution status
- `resolvedAt`: Resolution timestamp
- `resolvedBy`: Resolved by user ID
- `createdAt`: Alert creation timestamp

**Metadata JSON Structure:**
```json
{
  "fraudScore": 85,
  "location": {
    "latitude": 51.5074,
    "longitude": -0.1278
  },
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "platform": "Win32"
  }
}
```

**Indexes:**
```sql
CREATE INDEX "FraudAlert_studentId_idx" ON "FraudAlert"("studentId");
CREATE INDEX "FraudAlert_qrCodeId_idx" ON "FraudAlert"("qrCodeId");
CREATE INDEX "FraudAlert_alertType_idx" ON "FraudAlert"("alertType");
CREATE INDEX "FraudAlert_severity_idx" ON "FraudAlert"("severity");
CREATE INDEX "FraudAlert_isResolved_idx" ON "FraudAlert"("isResolved");
CREATE INDEX "FraudAlert_createdAt_idx" ON "FraudAlert"("createdAt");
```

### Device Fingerprints Table

```sql
CREATE TABLE "DeviceFingerprint" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "deviceInfo" JSONB NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE
);
```

**Fields:**
- `id`: Device identifier (UUID)
- `studentId`: Student user ID
- `fingerprint`: Device fingerprint hash
- `deviceInfo`: Device information (JSON)
- `isActive`: Device status
- `lastUsed`: Last usage timestamp
- `createdAt`: Device creation timestamp

**Device Info JSON Structure:**
```json
{
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "platform": "Win32",
  "language": "en-US",
  "timezone": "America/New_York",
  "screenResolution": "1920x1080",
  "colorDepth": 24,
  "hardwareConcurrency": 8,
  "maxTouchPoints": 0,
  "vendor": "Google Inc.",
  "renderer": "ANGLE (Intel, Intel(R) HD Graphics 620 Direct3D11 vs_5_0 ps_5_0)",
  "canvas": "canvas-fingerprint-data",
  "webgl": "webgl-fingerprint-data",
  "audio": "audio-fingerprint-data",
  "fonts": ["Arial", "Times New Roman", "Courier New"]
}
```

**Indexes:**
```sql
CREATE INDEX "DeviceFingerprint_studentId_idx" ON "DeviceFingerprint"("studentId");
CREATE INDEX "DeviceFingerprint_fingerprint_idx" ON "DeviceFingerprint"("fingerprint");
CREATE INDEX "DeviceFingerprint_isActive_idx" ON "DeviceFingerprint"("isActive");
CREATE INDEX "DeviceFingerprint_lastUsed_idx" ON "DeviceFingerprint"("lastUsed");
```

## Enums

### User Role Enum

```sql
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'PROFESSOR', 'ADMIN');
```

### Session Status Enum

```sql
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED');
```

### Attendance Status Enum

```sql
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');
```

### Attendance Attempt Status Enum

```sql
CREATE TYPE "AttendanceAttemptStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING', 'CANCELLED');
```

### Fraud Alert Type Enum

```sql
CREATE TYPE "FraudAlertType" AS ENUM (
  'LOCATION_FRAUD',
  'DEVICE_FRAUD',
  'PHOTO_FRAUD',
  'BEHAVIOR_FRAUD',
  'NETWORK_FRAUD'
);
```

### Alert Severity Enum

```sql
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
```

## Views

### Attendance Summary View

```sql
CREATE VIEW "AttendanceSummary" AS
SELECT 
  s.id as session_id,
  s.title as session_title,
  s.start_time,
  s.end_time,
  COUNT(ar.id) as total_attendance,
  COUNT(CASE WHEN ar.status = 'PRESENT' THEN 1 END) as present_count,
  COUNT(CASE WHEN ar.status = 'ABSENT' THEN 1 END) as absent_count,
  COUNT(CASE WHEN ar.status = 'LATE' THEN 1 END) as late_count,
  COUNT(CASE WHEN ar.status = 'EXCUSED' THEN 1 END) as excused_count,
  ROUND(
    COUNT(CASE WHEN ar.status = 'PRESENT' THEN 1 END) * 100.0 / COUNT(ar.id), 
    2
  ) as attendance_rate
FROM "AttendanceSession" s
LEFT JOIN "AttendanceRecord" ar ON s.id = ar.session_id
GROUP BY s.id, s.title, s.start_time, s.end_time;
```

### Fraud Analytics View

```sql
CREATE VIEW "FraudAnalytics" AS
SELECT 
  DATE_TRUNC('day', fa.created_at) as date,
  fa.alert_type,
  fa.severity,
  COUNT(*) as alert_count,
  AVG(fa.metadata->>'fraudScore') as avg_fraud_score
FROM "FraudAlert" fa
WHERE fa.is_resolved = false
GROUP BY DATE_TRUNC('day', fa.created_at), fa.alert_type, fa.severity;
```

## Functions

### Calculate Distance Function

```sql
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL(10,8),
  lon1 DECIMAL(11,8),
  lat2 DECIMAL(10,8),
  lon2 DECIMAL(11,8)
) RETURNS DECIMAL(10,2) AS $$
BEGIN
  RETURN 6371000 * acos(
    cos(radians(lat1)) * cos(radians(lat2)) * 
    cos(radians(lon2) - radians(lon1)) + 
    sin(radians(lat1)) * sin(radians(lat2))
  );
END;
$$ LANGUAGE plpgsql;
```

### Fraud Score Calculation Function

```sql
CREATE OR REPLACE FUNCTION calculate_fraud_score(
  p_location JSONB,
  p_device_fingerprint TEXT,
  p_ip_address TEXT,
  p_user_agent TEXT
) RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Location fraud detection
  IF p_location IS NOT NULL THEN
    IF (p_location->>'latitude')::DECIMAL < -90 OR (p_location->>'latitude')::DECIMAL > 90 THEN
      score := score + 50;
    END IF;
    
    IF (p_location->>'longitude')::DECIMAL < -180 OR (p_location->>'longitude')::DECIMAL > 180 THEN
      score := score + 50;
    END IF;
  END IF;
  
  -- Device fraud detection
  IF p_device_fingerprint IS NULL THEN
    score := score + 30;
  END IF;
  
  -- Network fraud detection
  IF p_ip_address LIKE '10.%' OR p_ip_address LIKE '192.168.%' THEN
    score := score + 20;
  END IF;
  
  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;
```

## Triggers

### Update Attendance Record Trigger

```sql
CREATE OR REPLACE FUNCTION update_attendance_record_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_attendance_record_updated_at
  BEFORE UPDATE ON "AttendanceRecord"
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_record_updated_at();
```

### Fraud Alert Trigger

```sql
CREATE OR REPLACE FUNCTION create_fraud_alert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.fraud_score > 70 THEN
    INSERT INTO "FraudAlert" (
      id,
      student_id,
      qr_code_id,
      alert_type,
      severity,
      description,
      metadata
    ) VALUES (
      gen_random_uuid(),
      NEW.student_id,
      NEW.session_id,
      'BEHAVIOR_FRAUD',
      CASE 
        WHEN NEW.fraud_score > 90 THEN 'CRITICAL'
        WHEN NEW.fraud_score > 80 THEN 'HIGH'
        WHEN NEW.fraud_score > 70 THEN 'MEDIUM'
        ELSE 'LOW'
      END,
      'High fraud score detected: ' || NEW.fraud_score,
      jsonb_build_object(
        'fraudScore', NEW.fraud_score,
        'location', NEW.location,
        'deviceFingerprint', NEW.device_fingerprint
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_fraud_alert_trigger
  AFTER INSERT ON "AttendanceRecord"
  FOR EACH ROW
  EXECUTE FUNCTION create_fraud_alert();
```

## Indexes for Performance

### Composite Indexes

```sql
-- Attendance records by session and student
CREATE INDEX "AttendanceRecord_sessionId_studentId_idx" 
ON "AttendanceRecord"("sessionId", "studentId");

-- Fraud alerts by student and severity
CREATE INDEX "FraudAlert_studentId_severity_idx" 
ON "FraudAlert"("studentId", "severity");

-- Device fingerprints by student and active status
CREATE INDEX "DeviceFingerprint_studentId_isActive_idx" 
ON "DeviceFingerprint"("studentId", "isActive");
```

### Partial Indexes

```sql
-- Active sessions only
CREATE INDEX "AttendanceSession_active_idx" 
ON "AttendanceSession"("startTime", "endTime") 
WHERE "status" = 'ACTIVE';

-- Unresolved fraud alerts only
CREATE INDEX "FraudAlert_unresolved_idx" 
ON "FraudAlert"("createdAt") 
WHERE "isResolved" = false;

-- Recent attendance records only
CREATE INDEX "AttendanceRecord_recent_idx" 
ON "AttendanceRecord"("timestamp") 
WHERE "timestamp" > NOW() - INTERVAL '30 days';
```

## Data Retention Policies

### Attendance Records Retention

```sql
-- Delete attendance records older than 2 years
CREATE OR REPLACE FUNCTION cleanup_old_attendance_records()
RETURNS void AS $$
BEGIN
  DELETE FROM "AttendanceRecord" 
  WHERE "timestamp" < NOW() - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;
```

### Fraud Alerts Retention

```sql
-- Archive resolved fraud alerts older than 1 year
CREATE OR REPLACE FUNCTION archive_old_fraud_alerts()
RETURNS void AS $$
BEGIN
  UPDATE "FraudAlert" 
  SET "metadata" = "metadata" || '{"archived": true}'::jsonb
  WHERE "isResolved" = true 
    AND "resolvedAt" < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;
```

## Backup and Recovery

### Backup Strategy

```bash
# Full database backup
pg_dump -h localhost -U postgres -d secure_attendance > backup_$(date +%Y%m%d_%H%M%S).sql

# Schema-only backup
pg_dump -h localhost -U postgres -d secure_attendance --schema-only > schema_backup.sql

# Data-only backup
pg_dump -h localhost -U postgres -d secure_attendance --data-only > data_backup.sql
```

### Recovery Procedures

```bash
# Restore from backup
psql -h localhost -U postgres -d secure_attendance < backup_20240115_120000.sql

# Restore schema only
psql -h localhost -U postgres -d secure_attendance < schema_backup.sql

# Restore data only
psql -h localhost -U postgres -d secure_attendance < data_backup.sql
```

## Monitoring and Maintenance

### Database Health Checks

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- Check slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;
```

### Performance Optimization

```sql
-- Analyze tables for better query planning
ANALYZE "User";
ANALYZE "Course";
ANALYZE "AttendanceSession";
ANALYZE "AttendanceRecord";
ANALYZE "FraudAlert";
ANALYZE "DeviceFingerprint";

-- Update table statistics
UPDATE pg_stat_user_tables 
SET n_tup_ins = 0, n_tup_upd = 0, n_tup_del = 0 
WHERE schemaname = 'public';
```

## Security Considerations

### Row Level Security (RLS)

```sql
-- Enable RLS on sensitive tables
ALTER TABLE "AttendanceRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FraudAlert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DeviceFingerprint" ENABLE ROW LEVEL SECURITY;

-- Create policies for data access
CREATE POLICY "Users can view their own attendance records" 
ON "AttendanceRecord" FOR SELECT 
USING (auth.uid()::text = "studentId");

CREATE POLICY "Professors can view course attendance records" 
ON "AttendanceRecord" FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM "AttendanceSession" s 
    WHERE s.id = "AttendanceRecord"."sessionId" 
    AND s."professorId" = auth.uid()::text
  )
);
```

### Data Encryption

```sql
-- Encrypt sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt device fingerprints
UPDATE "DeviceFingerprint" 
SET "fingerprint" = encode(digest("fingerprint", 'sha256'), 'hex');

-- Encrypt IP addresses
UPDATE "AttendanceRecord" 
SET "ipAddress" = encode(digest("ipAddress", 'sha256'), 'hex');
```

## Migration Scripts

### Initial Migration

```sql
-- Create database
CREATE DATABASE secure_attendance;

-- Create user
CREATE USER attendance_user WITH PASSWORD 'secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE secure_attendance TO attendance_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO attendance_user;
```

### Schema Updates

```sql
-- Add new column
ALTER TABLE "AttendanceRecord" 
ADD COLUMN "photoHash" TEXT;

-- Create index for new column
CREATE INDEX "AttendanceRecord_photoHash_idx" 
ON "AttendanceRecord"("photoHash");

-- Update existing records
UPDATE "AttendanceRecord" 
SET "photoHash" = encode(digest("photoUrl", 'sha256'), 'hex') 
WHERE "photoUrl" IS NOT NULL;
```

This comprehensive database schema documentation provides a complete overview of the Secure Attendance System's data structure, relationships, and optimization strategies.
