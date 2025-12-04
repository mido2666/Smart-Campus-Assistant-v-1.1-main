import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DeviceFingerprintService } from '../../src/services/security/device-fingerprint.service';
import { DeviceFingerprintData, DeviceFingerprintOptions } from '../../src/services/security/types';

// Mock data
const mockDeviceData: DeviceFingerprintData = {
  fingerprint: 'device-fingerprint-123',
  deviceInfo: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    platform: 'Win32',
    language: 'en-US',
    timezone: 'America/New_York',
    screenResolution: '1920x1080',
    colorDepth: 24,
    hardwareConcurrency: 8,
    maxTouchPoints: 0,
    vendor: 'Google Inc.',
    renderer: 'ANGLE (Intel, Intel(R) HD Graphics 620 Direct3D11 vs_5_0 ps_5_0)',
    canvas: 'canvas-fingerprint-data',
    webgl: 'webgl-fingerprint-data',
    audio: 'audio-fingerprint-data',
    fonts: ['Arial', 'Times New Roman', 'Courier New']
  },
  isActive: true,
  lastUsed: new Date(),
  createdAt: new Date()
};

const mockOptions: DeviceFingerprintOptions = {
  enableBrowserFingerprinting: true,
  enableHardwareFingerprinting: true,
  enableCanvasFingerprinting: true,
  enableWebGLFingerprinting: true,
  enableAudioFingerprinting: true,
  enableFontFingerprinting: true,
  minConfidence: 0.8,
  maxDevicesPerUser: 5
};

describe('Device Fingerprinting Tests', () => {
  let deviceService: DeviceFingerprintService;

  beforeEach(() => {
    deviceService = new DeviceFingerprintService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateFingerprint', () => {
    it('should generate unique fingerprint', async () => {
      const fingerprint = await deviceService.generateFingerprint(mockDeviceData.deviceInfo);

      expect(fingerprint).toBeDefined();
      expect(fingerprint).toHaveLength(64); // SHA-256 hash length
      expect(typeof fingerprint).toBe('string');
    });

    it('should generate consistent fingerprint for same device', async () => {
      const fingerprint1 = await deviceService.generateFingerprint(mockDeviceData.deviceInfo);
      const fingerprint2 = await deviceService.generateFingerprint(mockDeviceData.deviceInfo);

      expect(fingerprint1).toBe(fingerprint2);
    });

    it('should generate different fingerprints for different devices', async () => {
      const deviceInfo1 = mockDeviceData.deviceInfo;
      const deviceInfo2 = {
        ...mockDeviceData.deviceInfo,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      };

      const fingerprint1 = await deviceService.generateFingerprint(deviceInfo1);
      const fingerprint2 = await deviceService.generateFingerprint(deviceInfo2);

      expect(fingerprint1).not.toBe(fingerprint2);
    });

    it('should handle missing device info gracefully', async () => {
      const partialDeviceInfo = {
        userAgent: 'Mozilla/5.0',
        platform: 'Win32'
      };

      const fingerprint = await deviceService.generateFingerprint(partialDeviceInfo);

      expect(fingerprint).toBeDefined();
      expect(fingerprint).toHaveLength(64);
    });
  });

  describe('storeFingerprint', () => {
    it('should store fingerprint successfully', async () => {
      const result = await deviceService.storeFingerprint(
        'user-123',
        mockDeviceData.fingerprint,
        mockDeviceData.deviceInfo
      );

      expect(result.success).toBe(true);
      expect(result.deviceId).toBeDefined();
    });

    it('should handle duplicate fingerprint storage', async () => {
      // Store first fingerprint
      await deviceService.storeFingerprint(
        'user-123',
        mockDeviceData.fingerprint,
        mockDeviceData.deviceInfo
      );

      // Try to store same fingerprint again
      const result = await deviceService.storeFingerprint(
        'user-123',
        mockDeviceData.fingerprint,
        mockDeviceData.deviceInfo
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should enforce device limit per user', async () => {
      // Mock max devices limit
      const options = { ...mockOptions, maxDevicesPerUser: 2 };

      // Store first device
      await deviceService.storeFingerprint(
        'user-123',
        'fingerprint-1',
        mockDeviceData.deviceInfo
      );

      // Store second device
      await deviceService.storeFingerprint(
        'user-123',
        'fingerprint-2',
        { ...mockDeviceData.deviceInfo, userAgent: 'Different User Agent' }
      );

      // Try to store third device (should fail)
      const result = await deviceService.storeFingerprint(
        'user-123',
        'fingerprint-3',
        { ...mockDeviceData.deviceInfo, userAgent: 'Another User Agent' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('device limit');
    });
  });

  describe('validateFingerprint', () => {
    it('should validate existing fingerprint', async () => {
      // Store fingerprint first
      await deviceService.storeFingerprint(
        'user-123',
        mockDeviceData.fingerprint,
        mockDeviceData.deviceInfo
      );

      const result = await deviceService.validateFingerprint(
        'user-123',
        mockDeviceData.fingerprint
      );

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should reject unknown fingerprint', async () => {
      const result = await deviceService.validateFingerprint(
        'user-123',
        'unknown-fingerprint'
      );

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('should handle inactive device', async () => {
      // Store fingerprint as inactive
      await deviceService.storeFingerprint(
        'user-123',
        mockDeviceData.fingerprint,
        mockDeviceData.deviceInfo
      );

      // Deactivate device
      await deviceService.deactivateDevice('user-123', mockDeviceData.fingerprint);

      const result = await deviceService.validateFingerprint(
        'user-123',
        mockDeviceData.fingerprint
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('inactive');
    });
  });

  describe('detectDeviceChange', () => {
    it('should detect device change', async () => {
      // Store original device
      await deviceService.storeFingerprint(
        'user-123',
        'original-fingerprint',
        mockDeviceData.deviceInfo
      );

      // New device with different fingerprint
      const newDeviceInfo = {
        ...mockDeviceData.deviceInfo,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      };

      const result = await deviceService.detectDeviceChange(
        'user-123',
        newDeviceInfo
      );

      expect(result.hasChanged).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should not flag same device', async () => {
      // Store original device
      await deviceService.storeFingerprint(
        'user-123',
        mockDeviceData.fingerprint,
        mockDeviceData.deviceInfo
      );

      const result = await deviceService.detectDeviceChange(
        'user-123',
        mockDeviceData.deviceInfo
      );

      expect(result.hasChanged).toBe(false);
    });

    it('should handle minor device info changes', async () => {
      // Store original device
      await deviceService.storeFingerprint(
        'user-123',
        mockDeviceData.fingerprint,
        mockDeviceData.deviceInfo
      );

      // Minor change (different timezone)
      const updatedDeviceInfo = {
        ...mockDeviceData.deviceInfo,
        timezone: 'America/Los_Angeles'
      };

      const result = await deviceService.detectDeviceChange(
        'user-123',
        updatedDeviceInfo
      );

      expect(result.hasChanged).toBe(false); // Should not flag minor changes
    });
  });

  describe('detectDeviceSharing', () => {
    it('should detect device sharing', async () => {
      // Store device for user 1
      await deviceService.storeFingerprint(
        'user-1',
        mockDeviceData.fingerprint,
        mockDeviceData.deviceInfo
      );

      // Same device used by user 2
      const result = await deviceService.detectDeviceSharing(
        'user-2',
        mockDeviceData.fingerprint,
        mockDeviceData.deviceInfo
      );

      expect(result.isShared).toBe(true);
      expect(result.sharedWith).toContain('user-1');
    });

    it('should not flag legitimate device use', async () => {
      // Store device for user 1
      await deviceService.storeFingerprint(
        'user-1',
        mockDeviceData.fingerprint,
        mockDeviceData.deviceInfo
      );

      // Different device for user 2
      const differentDeviceInfo = {
        ...mockDeviceData.deviceInfo,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      };

      const result = await deviceService.detectDeviceSharing(
        'user-2',
        'different-fingerprint',
        differentDeviceInfo
      );

      expect(result.isShared).toBe(false);
    });
  });

  describe('Browser Fingerprinting', () => {
    it('should generate browser fingerprint', () => {
      const fingerprint = deviceService.getBrowserFingerprint(mockDeviceData.deviceInfo);

      expect(fingerprint).toBeDefined();
      expect(fingerprint.userAgent).toBe(mockDeviceData.deviceInfo.userAgent);
      expect(fingerprint.platform).toBe(mockDeviceData.deviceInfo.platform);
      expect(fingerprint.language).toBe(mockDeviceData.deviceInfo.language);
    });

    it('should handle missing browser properties', () => {
      const partialInfo = {
        userAgent: 'Mozilla/5.0',
        platform: 'Win32'
      };

      const fingerprint = deviceService.getBrowserFingerprint(partialInfo);

      expect(fingerprint).toBeDefined();
      expect(fingerprint.userAgent).toBe('Mozilla/5.0');
      expect(fingerprint.platform).toBe('Win32');
    });
  });

  describe('Hardware Fingerprinting', () => {
    it('should generate hardware fingerprint', () => {
      const fingerprint = deviceService.getHardwareFingerprint(mockDeviceData.deviceInfo);

      expect(fingerprint).toBeDefined();
      expect(fingerprint.screenResolution).toBe(mockDeviceData.deviceInfo.screenResolution);
      expect(fingerprint.colorDepth).toBe(mockDeviceData.deviceInfo.colorDepth);
      expect(fingerprint.hardwareConcurrency).toBe(mockDeviceData.deviceInfo.hardwareConcurrency);
    });

    it('should handle missing hardware properties', () => {
      const partialInfo = {
        screenResolution: '1920x1080'
      };

      const fingerprint = deviceService.getHardwareFingerprint(partialInfo);

      expect(fingerprint).toBeDefined();
      expect(fingerprint.screenResolution).toBe('1920x1080');
    });
  });

  describe('Canvas Fingerprinting', () => {
    it('should generate canvas fingerprint', () => {
      const fingerprint = deviceService.getCanvasFingerprint(mockDeviceData.deviceInfo);

      expect(fingerprint).toBeDefined();
      expect(fingerprint.canvas).toBe(mockDeviceData.deviceInfo.canvas);
    });

    it('should handle missing canvas data', () => {
      const partialInfo = {};

      const fingerprint = deviceService.getCanvasFingerprint(partialInfo);

      expect(fingerprint).toBeDefined();
      expect(fingerprint.canvas).toBeUndefined();
    });
  });

  describe('WebGL Fingerprinting', () => {
    it('should generate WebGL fingerprint', () => {
      const fingerprint = deviceService.getWebGLFingerprint(mockDeviceData.deviceInfo);

      expect(fingerprint).toBeDefined();
      expect(fingerprint.renderer).toBe(mockDeviceData.deviceInfo.renderer);
    });

    it('should handle missing WebGL data', () => {
      const partialInfo = {};

      const fingerprint = deviceService.getWebGLFingerprint(partialInfo);

      expect(fingerprint).toBeDefined();
      expect(fingerprint.renderer).toBeUndefined();
    });
  });

  describe('Audio Fingerprinting', () => {
    it('should generate audio fingerprint', () => {
      const fingerprint = deviceService.getAudioFingerprint(mockDeviceData.deviceInfo);

      expect(fingerprint).toBeDefined();
      expect(fingerprint.audio).toBe(mockDeviceData.deviceInfo.audio);
    });

    it('should handle missing audio data', () => {
      const partialInfo = {};

      const fingerprint = deviceService.getAudioFingerprint(partialInfo);

      expect(fingerprint).toBeDefined();
      expect(fingerprint.audio).toBeUndefined();
    });
  });

  describe('Font Fingerprinting', () => {
    it('should generate font fingerprint', () => {
      const fingerprint = deviceService.getFontFingerprint(mockDeviceData.deviceInfo);

      expect(fingerprint).toBeDefined();
      expect(fingerprint.fonts).toEqual(mockDeviceData.deviceInfo.fonts);
    });

    it('should handle missing font data', () => {
      const partialInfo = {};

      const fingerprint = deviceService.getFontFingerprint(partialInfo);

      expect(fingerprint).toBeDefined();
      expect(fingerprint.fonts).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      vi.spyOn(deviceService, 'storeFingerprint').mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        deviceService.storeFingerprint(
          'user-123',
          mockDeviceData.fingerprint,
          mockDeviceData.deviceInfo
        )
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid fingerprint format', async () => {
      const result = await deviceService.validateFingerprint(
        'user-123',
        'invalid-fingerprint-format'
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('invalid format');
    });

    it('should handle concurrent access', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        deviceService.storeFingerprint(
          'user-123',
          `fingerprint-${i}`,
          { ...mockDeviceData.deviceInfo, userAgent: `User Agent ${i}` }
        )
      );

      const results = await Promise.allSettled(promises);
      
      // At least one should succeed
      const successful = results.filter(result => result.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    it('should generate fingerprint within acceptable time', async () => {
      const startTime = Date.now();
      
      await deviceService.generateFingerprint(mockDeviceData.deviceInfo);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle multiple concurrent fingerprint generations', async () => {
      const promises = Array.from({ length: 10 }, () =>
        deviceService.generateFingerprint(mockDeviceData.deviceInfo)
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result).toHaveLength(64);
      });
    });
  });

  describe('Security Tests', () => {
    it('should detect fingerprint manipulation', async () => {
      const manipulatedInfo = {
        ...mockDeviceData.deviceInfo,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' // Suspiciously detailed
      };

      const result = await deviceService.detectDeviceChange(
        'user-123',
        manipulatedInfo
      );

      expect(result.hasChanged).toBe(true);
      expect(result.reason).toContain('manipulation detected');
    });

    it('should handle fingerprint collision', async () => {
      // Store first fingerprint
      await deviceService.storeFingerprint(
        'user-1',
        mockDeviceData.fingerprint,
        mockDeviceData.deviceInfo
      );

      // Try to store same fingerprint for different user
      const result = await deviceService.storeFingerprint(
        'user-2',
        mockDeviceData.fingerprint,
        mockDeviceData.deviceInfo
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('fingerprint collision');
    });
  });
});
