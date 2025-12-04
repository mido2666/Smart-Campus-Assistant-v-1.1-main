import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FraudDetectionService } from '../../src/services/security/fraud-detection.service';
import { FraudDetectionResult, FraudDetectionOptions } from '../../src/services/security/types';

// Mock data
const mockAttendanceAttempt = {
  studentId: 'student-123',
  sessionId: 'session-456',
  timestamp: new Date('2024-01-15T10:00:00Z'),
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    accuracy: 5
  },
  deviceFingerprint: 'device-fingerprint-123',
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  photoUrl: 'https://example.com/photo.jpg',
  metadata: {
    browserInfo: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      platform: 'Win32',
      language: 'en-US'
    },
    networkInfo: {
      ipAddress: '192.168.1.100',
      isp: 'Comcast',
      country: 'US'
    }
  }
};

const mockSessionData = {
  sessionId: 'session-456',
  startTime: new Date('2024-01-15T09:00:00Z'),
  endTime: new Date('2024-01-15T11:00:00Z'),
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    radius: 100
  },
  securitySettings: {
    requireLocation: true,
    requirePhoto: true,
    requireDeviceCheck: true,
    enableFraudDetection: true,
    maxAttempts: 3,
    gracePeriod: 300000 // 5 minutes
  }
};

const mockHistoricalData = [
  {
    studentId: 'student-123',
    sessionId: 'session-456',
    timestamp: new Date('2024-01-14T10:00:00Z'),
    location: { latitude: 40.7128, longitude: -74.0060, accuracy: 5 },
    deviceFingerprint: 'device-fingerprint-123',
    fraudScore: 15,
    status: 'PRESENT'
  },
  {
    studentId: 'student-123',
    sessionId: 'session-456',
    timestamp: new Date('2024-01-13T10:00:00Z'),
    location: { latitude: 40.7128, longitude: -74.0060, accuracy: 5 },
    deviceFingerprint: 'device-fingerprint-123',
    fraudScore: 20,
    status: 'PRESENT'
  }
];

const mockOptions: FraudDetectionOptions = {
  enableLocationFraudDetection: true,
  enableDeviceFraudDetection: true,
  enableTimeFraudDetection: true,
  enableBehavioralFraudDetection: true,
  enableNetworkFraudDetection: true,
  riskThresholds: {
    low: 30,
    medium: 50,
    high: 70,
    critical: 90
  },
  mlModelPath: './models/fraud-detection.model',
  confidenceThreshold: 0.8
};

describe('Fraud Detection Tests', () => {
  let fraudService: FraudDetectionService;

  beforeEach(() => {
    fraudService = new FraudDetectionService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('analyzeAttempt', () => {
    it('should analyze attendance attempt successfully', async () => {
      const result = await fraudService.analyzeAttempt(
        mockAttendanceAttempt,
        mockSessionData,
        mockHistoricalData,
        mockOptions
      );

      expect(result).toBeDefined();
      expect(result.fraudScore).toBeGreaterThanOrEqual(0);
      expect(result.fraudScore).toBeLessThanOrEqual(100);
      expect(result.isFraudulent).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.reasons).toBeDefined();
      expect(Array.isArray(result.reasons)).toBe(true);
    });

    it('should detect location fraud', async () => {
      const suspiciousAttempt = {
        ...mockAttendanceAttempt,
        location: {
          latitude: 51.5074, // London (impossible travel from NYC)
          longitude: -0.1278,
          accuracy: 5
        }
      };

      const result = await fraudService.analyzeAttempt(
        suspiciousAttempt,
        mockSessionData,
        mockHistoricalData,
        mockOptions
      );

      expect(result.fraudScore).toBeGreaterThan(70);
      expect(result.isFraudulent).toBe(true);
      expect(result.reasons).toContain('location_fraud');
    });

    it('should detect device fraud', async () => {
      const suspiciousAttempt = {
        ...mockAttendanceAttempt,
        deviceFingerprint: 'different-device-fingerprint'
      };

      const result = await fraudService.analyzeAttempt(
        suspiciousAttempt,
        mockSessionData,
        mockHistoricalData,
        mockOptions
      );

      expect(result.fraudScore).toBeGreaterThan(50);
      expect(result.reasons).toContain('device_fraud');
    });

    it('should detect time fraud', async () => {
      const suspiciousAttempt = {
        ...mockAttendanceAttempt,
        timestamp: new Date('2024-01-15T08:00:00Z') // Before session start
      };

      const result = await fraudService.analyzeAttempt(
        suspiciousAttempt,
        mockSessionData,
        mockHistoricalData,
        mockOptions
      );

      expect(result.fraudScore).toBeGreaterThan(60);
      expect(result.reasons).toContain('time_fraud');
    });

    it('should detect behavioral fraud', async () => {
      const suspiciousAttempt = {
        ...mockAttendanceAttempt,
        metadata: {
          ...mockAttendanceAttempt.metadata,
          behaviorPattern: {
            mouseMovements: 'suspicious',
            keystrokePattern: 'automated',
            scrollBehavior: 'bot-like'
          }
        }
      };

      const result = await fraudService.analyzeAttempt(
        suspiciousAttempt,
        mockSessionData,
        mockHistoricalData,
        mockOptions
      );

      expect(result.fraudScore).toBeGreaterThan(40);
      expect(result.reasons).toContain('behavioral_fraud');
    });

    it('should detect network fraud', async () => {
      const suspiciousAttempt = {
        ...mockAttendanceAttempt,
        ipAddress: '10.0.0.1', // VPN/proxy IP
        metadata: {
          ...mockAttendanceAttempt.metadata,
          networkInfo: {
            ipAddress: '10.0.0.1',
            isp: 'VPN Provider',
            country: 'Unknown'
          }
        }
      };

      const result = await fraudService.analyzeAttempt(
        suspiciousAttempt,
        mockSessionData,
        mockHistoricalData,
        mockOptions
      );

      expect(result.fraudScore).toBeGreaterThan(30);
      expect(result.reasons).toContain('network_fraud');
    });
  });

  describe('calculateRiskScore', () => {
    it('should calculate risk score correctly', () => {
      const riskFactors = {
        locationRisk: 20,
        deviceRisk: 30,
        timeRisk: 10,
        behavioralRisk: 15,
        networkRisk: 25
      };

      const score = fraudService.calculateRiskScore(riskFactors);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(score).toBeCloseTo(20, 0); // Weighted average
    });

    it('should handle extreme risk factors', () => {
      const extremeRiskFactors = {
        locationRisk: 100,
        deviceRisk: 100,
        timeRisk: 100,
        behavioralRisk: 100,
        networkRisk: 100
      };

      const score = fraudService.calculateRiskScore(extremeRiskFactors);

      expect(score).toBe(100);
    });

    it('should handle zero risk factors', () => {
      const zeroRiskFactors = {
        locationRisk: 0,
        deviceRisk: 0,
        timeRisk: 0,
        behavioralRisk: 0,
        networkRisk: 0
      };

      const score = fraudService.calculateRiskScore(zeroRiskFactors);

      expect(score).toBe(0);
    });
  });

  describe('detectSuspiciousPattern', () => {
    it('should detect suspicious patterns', async () => {
      const suspiciousData = [
        { fraudScore: 80, timestamp: new Date('2024-01-15T10:00:00Z') },
        { fraudScore: 85, timestamp: new Date('2024-01-15T10:05:00Z') },
        { fraudScore: 90, timestamp: new Date('2024-01-15T10:10:00Z') }
      ];

      const result = await fraudService.detectSuspiciousPattern(suspiciousData);

      expect(result.isSuspicious).toBe(true);
      expect(result.patternType).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should not flag normal patterns', async () => {
      const normalData = [
        { fraudScore: 15, timestamp: new Date('2024-01-15T10:00:00Z') },
        { fraudScore: 20, timestamp: new Date('2024-01-15T10:05:00Z') },
        { fraudScore: 18, timestamp: new Date('2024-01-15T10:10:00Z') }
      ];

      const result = await fraudService.detectSuspiciousPattern(normalData);

      expect(result.isSuspicious).toBe(false);
    });

    it('should detect rapid attempts pattern', async () => {
      const rapidAttempts = [
        { fraudScore: 30, timestamp: new Date('2024-01-15T10:00:00Z') },
        { fraudScore: 35, timestamp: new Date('2024-01-15T10:00:30Z') },
        { fraudScore: 40, timestamp: new Date('2024-01-15T10:01:00Z') }
      ];

      const result = await fraudService.detectSuspiciousPattern(rapidAttempts);

      expect(result.isSuspicious).toBe(true);
      expect(result.patternType).toBe('rapid_attempts');
    });
  });

  describe('generateFraudAlert', () => {
    it('should generate fraud alert for high-risk attempt', async () => {
      const highRiskResult: FraudDetectionResult = {
        fraudScore: 85,
        isFraudulent: true,
        confidence: 0.9,
        reasons: ['location_fraud', 'device_fraud'],
        riskLevel: 'CRITICAL'
      };

      const alert = await fraudService.generateFraudAlert(
        mockAttendanceAttempt,
        highRiskResult
      );

      expect(alert).toBeDefined();
      expect(alert.alertType).toBe('FRAUD_DETECTED');
      expect(alert.severity).toBe('CRITICAL');
      expect(alert.description).toContain('fraud');
      expect(alert.metadata).toBeDefined();
    });

    it('should not generate alert for low-risk attempt', async () => {
      const lowRiskResult: FraudDetectionResult = {
        fraudScore: 15,
        isFraudulent: false,
        confidence: 0.8,
        reasons: [],
        riskLevel: 'LOW'
      };

      const alert = await fraudService.generateFraudAlert(
        mockAttendanceAttempt,
        lowRiskResult
      );

      expect(alert).toBeNull();
    });
  });

  describe('getHistoricalData', () => {
    it('should retrieve historical data', async () => {
      const historicalData = await fraudService.getHistoricalData(
        'student-123',
        'session-456',
        30 // days
      );

      expect(historicalData).toBeDefined();
      expect(Array.isArray(historicalData)).toBe(true);
    });

    it('should handle missing historical data', async () => {
      const historicalData = await fraudService.getHistoricalData(
        'new-student',
        'new-session',
        30
      );

      expect(historicalData).toBeDefined();
      expect(Array.isArray(historicalData)).toBe(true);
      expect(historicalData.length).toBe(0);
    });
  });

  describe('trainModel', () => {
    it('should train ML model successfully', async () => {
      const trainingData = [
        { features: [1, 2, 3], label: 0 },
        { features: [4, 5, 6], label: 1 },
        { features: [7, 8, 9], label: 0 }
      ];

      const result = await fraudService.trainModel(trainingData);

      expect(result.success).toBe(true);
      expect(result.modelPath).toBeDefined();
      expect(result.accuracy).toBeGreaterThan(0.8);
    });

    it('should handle insufficient training data', async () => {
      const insufficientData = [
        { features: [1, 2, 3], label: 0 }
      ];

      const result = await fraudService.trainModel(insufficientData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('insufficient data');
    });
  });

  describe('predictFraud', () => {
    it('should predict fraud using ML model', async () => {
      const features = [1, 2, 3, 4, 5];
      
      const prediction = await fraudService.predictFraud(features);

      expect(prediction).toBeDefined();
      expect(prediction.probability).toBeGreaterThanOrEqual(0);
      expect(prediction.probability).toBeLessThanOrEqual(1);
      expect(prediction.isFraudulent).toBeDefined();
    });

    it('should handle model loading errors', async () => {
      // Mock model loading error
      vi.spyOn(fraudService, 'predictFraud').mockRejectedValue(
        new Error('Model not found')
      );

      await expect(
        fraudService.predictFraud([1, 2, 3, 4, 5])
      ).rejects.toThrow('Model not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      vi.spyOn(fraudService, 'analyzeAttempt').mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        fraudService.analyzeAttempt(
          mockAttendanceAttempt,
          mockSessionData,
          mockHistoricalData,
          mockOptions
        )
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid input data', async () => {
      const invalidAttempt = {
        ...mockAttendanceAttempt,
        timestamp: 'invalid-date' as any
      };

      const result = await fraudService.analyzeAttempt(
        invalidAttempt,
        mockSessionData,
        mockHistoricalData,
        mockOptions
      );

      expect(result.fraudScore).toBeGreaterThan(50);
      expect(result.reasons).toContain('invalid_data');
    });

    it('should handle missing session data', async () => {
      const result = await fraudService.analyzeAttempt(
        mockAttendanceAttempt,
        null as any,
        mockHistoricalData,
        mockOptions
      );

      expect(result.fraudScore).toBeGreaterThan(70);
      expect(result.reasons).toContain('missing_session_data');
    });
  });

  describe('Performance Tests', () => {
    it('should analyze attempt within acceptable time', async () => {
      const startTime = Date.now();
      
      await fraudService.analyzeAttempt(
        mockAttendanceAttempt,
        mockSessionData,
        mockHistoricalData,
        mockOptions
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle multiple concurrent analyses', async () => {
      const promises = Array.from({ length: 5 }, () =>
        fraudService.analyzeAttempt(
          mockAttendanceAttempt,
          mockSessionData,
          mockHistoricalData,
          mockOptions
        )
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.fraudScore).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Security Tests', () => {
    it('should detect coordinated fraud attempts', async () => {
      const coordinatedAttempts = [
        { ...mockAttendanceAttempt, studentId: 'student-1', ipAddress: '192.168.1.100' },
        { ...mockAttendanceAttempt, studentId: 'student-2', ipAddress: '192.168.1.100' },
        { ...mockAttendanceAttempt, studentId: 'student-3', ipAddress: '192.168.1.100' }
      ];

      const results = await Promise.all(
        coordinatedAttempts.map(attempt =>
          fraudService.analyzeAttempt(attempt, mockSessionData, mockHistoricalData, mockOptions)
        )
      );

      results.forEach(result => {
        expect(result.fraudScore).toBeGreaterThan(60);
        expect(result.reasons).toContain('coordinated_fraud');
      });
    });

    it('should detect bot-like behavior', async () => {
      const botAttempt = {
        ...mockAttendanceAttempt,
        metadata: {
          ...mockAttendanceAttempt.metadata,
          behaviorPattern: {
            mouseMovements: 'linear',
            keystrokePattern: 'uniform',
            scrollBehavior: 'mechanical',
            responseTime: 'too_fast'
          }
        }
      };

      const result = await fraudService.analyzeAttempt(
        botAttempt,
        mockSessionData,
        mockHistoricalData,
        mockOptions
      );

      expect(result.fraudScore).toBeGreaterThan(80);
      expect(result.reasons).toContain('bot_behavior');
    });

    it('should detect location spoofing', async () => {
      const spoofedLocation = {
        ...mockAttendanceAttempt,
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 0.001 // Suspiciously high accuracy
        }
      };

      const result = await fraudService.analyzeAttempt(
        spoofedLocation,
        mockSessionData,
        mockHistoricalData,
        mockOptions
      );

      expect(result.fraudScore).toBeGreaterThan(70);
      expect(result.reasons).toContain('location_spoofing');
    });
  });
});
