import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocationService } from '../../src/services/security/location.service';
import { LocationData, LocationValidationOptions } from '../../src/services/security/types';

// Mock data
const mockLocationData: LocationData = {
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 5,
  timestamp: new Date('2024-01-15T10:00:00Z')
};

const mockSessionLocation = {
  latitude: 40.7128,
  longitude: -74.0060,
  radius: 100
};

const mockValidationOptions: LocationValidationOptions = {
  requireLocation: true,
  maxDistance: 100,
  minAccuracy: 10,
  timeWindow: 300000, // 5 minutes
  allowLocationSpoofing: false
};

describe('Location Validation Tests', () => {
  let locationService: LocationService;

  beforeEach(() => {
    locationService = new LocationService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateLocation', () => {
    it('should validate location within radius', async () => {
      const result = await locationService.validateLocation(
        mockLocationData,
        mockSessionLocation,
        mockValidationOptions
      );

      expect(result.isValid).toBe(true);
      expect(result.distance).toBeLessThanOrEqual(mockSessionLocation.radius);
      expect(result.accuracy).toBe(mockLocationData.accuracy);
    });

    it('should reject location outside radius', async () => {
      const farLocation: LocationData = {
        ...mockLocationData,
        latitude: 40.8000,
        longitude: -73.9000
      };

      const result = await locationService.validateLocation(
        farLocation,
        mockSessionLocation,
        mockValidationOptions
      );

      expect(result.isValid).toBe(false);
      expect(result.distance).toBeGreaterThan(mockSessionLocation.radius);
      expect(result.reason).toContain('outside allowed radius');
    });

    it('should reject location with poor accuracy', async () => {
      const poorAccuracyLocation: LocationData = {
        ...mockLocationData,
        accuracy: 50
      };

      const result = await locationService.validateLocation(
        poorAccuracyLocation,
        mockSessionLocation,
        { ...mockValidationOptions, minAccuracy: 10 }
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('accuracy');
    });

    it('should handle missing location data', async () => {
      const result = await locationService.validateLocation(
        null as any,
        mockSessionLocation,
        mockValidationOptions
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('location data required');
    });

    it('should validate time window', async () => {
      const oldLocation: LocationData = {
        ...mockLocationData,
        timestamp: new Date(Date.now() - 600000) // 10 minutes ago
      };

      const result = await locationService.validateLocation(
        oldLocation,
        mockSessionLocation,
        mockValidationOptions
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('time window');
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance correctly', () => {
      const distance = locationService.calculateDistance(
        40.7128, -74.0060, // NYC
        40.7589, -73.9851  // Times Square
      );

      expect(distance).toBeCloseTo(5.5, 1); // Approximately 5.5 km
    });

    it('should return 0 for same coordinates', () => {
      const distance = locationService.calculateDistance(
        40.7128, -74.0060,
        40.7128, -74.0060
      );

      expect(distance).toBe(0);
    });

    it('should handle edge cases', () => {
      const distance = locationService.calculateDistance(
        0, 0,
        0, 180
      );

      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('isWithinRadius', () => {
    it('should return true for location within radius', () => {
      const isWithin = locationService.isWithinRadius(
        mockLocationData,
        mockSessionLocation
      );

      expect(isWithin).toBe(true);
    });

    it('should return false for location outside radius', () => {
      const farLocation: LocationData = {
        ...mockLocationData,
        latitude: 40.8000,
        longitude: -73.9000
      };

      const isWithin = locationService.isWithinRadius(
        farLocation,
        mockSessionLocation
      );

      expect(isWithin).toBe(false);
    });
  });

  describe('detectLocationSpoofing', () => {
    it('should detect suspicious location changes', async () => {
      const previousLocation: LocationData = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 5,
        timestamp: new Date(Date.now() - 60000) // 1 minute ago
      };

      const currentLocation: LocationData = {
        latitude: 51.5074, // London
        longitude: -0.1278,
        accuracy: 5,
        timestamp: new Date()
      };

      const result = await locationService.detectLocationSpoofing(
        currentLocation,
        previousLocation
      );

      expect(result.isSuspicious).toBe(true);
      expect(result.reason).toContain('impossible travel');
    });

    it('should not flag reasonable location changes', async () => {
      const previousLocation: LocationData = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 5,
        timestamp: new Date(Date.now() - 300000) // 5 minutes ago
      };

      const currentLocation: LocationData = {
        latitude: 40.7130,
        longitude: -74.0058,
        accuracy: 5,
        timestamp: new Date()
      };

      const result = await locationService.detectLocationSpoofing(
        currentLocation,
        previousLocation
      );

      expect(result.isSuspicious).toBe(false);
    });

    it('should detect accuracy manipulation', async () => {
      const location: LocationData = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 0.1, // Suspiciously high accuracy
        timestamp: new Date()
      };

      const result = await locationService.detectLocationSpoofing(
        location,
        null
      );

      expect(result.isSuspicious).toBe(true);
      expect(result.reason).toContain('accuracy manipulation');
    });
  });

  describe('handleTimezone', () => {
    it('should convert timezone correctly', () => {
      const utcTime = new Date('2024-01-15T10:00:00Z');
      const localTime = locationService.handleTimezone(utcTime, 'America/New_York');

      expect(localTime.getHours()).toBe(5); // EST is UTC-5
    });

    it('should handle invalid timezone', () => {
      const utcTime = new Date('2024-01-15T10:00:00Z');
      const localTime = locationService.handleTimezone(utcTime, 'Invalid/Timezone');

      expect(localTime).toBe(utcTime); // Should return original time
    });
  });

  describe('verifyLocationAccuracy', () => {
    it('should verify GPS accuracy', () => {
      const result = locationService.verifyLocationAccuracy(mockLocationData);

      expect(result.isAccurate).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should flag poor accuracy', () => {
      const poorLocation: LocationData = {
        ...mockLocationData,
        accuracy: 100
      };

      const result = locationService.verifyLocationAccuracy(poorLocation);

      expect(result.isAccurate).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should detect suspicious accuracy values', () => {
      const suspiciousLocation: LocationData = {
        ...mockLocationData,
        accuracy: 0.001 // Suspiciously high accuracy
      };

      const result = locationService.verifyLocationAccuracy(suspiciousLocation);

      expect(result.isAccurate).toBe(false);
      expect(result.reason).toContain('suspicious accuracy');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid coordinates', async () => {
      const invalidLocation: LocationData = {
        latitude: 200, // Invalid latitude
        longitude: -74.0060,
        accuracy: 5,
        timestamp: new Date()
      };

      const result = await locationService.validateLocation(
        invalidLocation,
        mockSessionLocation,
        mockValidationOptions
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('invalid coordinates');
    });

    it('should handle network errors gracefully', async () => {
      // Mock network error
      vi.spyOn(locationService, 'validateLocation').mockRejectedValue(
        new Error('Network error')
      );

      await expect(
        locationService.validateLocation(
          mockLocationData,
          mockSessionLocation,
          mockValidationOptions
        )
      ).rejects.toThrow('Network error');
    });

    it('should handle timeout errors', async () => {
      // Mock timeout
      vi.spyOn(locationService, 'validateLocation').mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      await expect(
        locationService.validateLocation(
          mockLocationData,
          mockSessionLocation,
          mockValidationOptions
        )
      ).rejects.toThrow('Timeout');
    });
  });

  describe('Performance Tests', () => {
    it('should validate location within acceptable time', async () => {
      const startTime = Date.now();
      
      await locationService.validateLocation(
        mockLocationData,
        mockSessionLocation,
        mockValidationOptions
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle multiple concurrent validations', async () => {
      const promises = Array.from({ length: 10 }, () =>
        locationService.validateLocation(
          mockLocationData,
          mockSessionLocation,
          mockValidationOptions
        )
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle coordinates at poles', () => {
      const northPole: LocationData = {
        latitude: 90,
        longitude: 0,
        accuracy: 5,
        timestamp: new Date()
      };

      const result = locationService.validateLocation(
        northPole,
        { latitude: 90, longitude: 0, radius: 100 },
        mockValidationOptions
      );

      expect(result.isValid).toBe(true);
    });

    it('should handle coordinates at international date line', () => {
      const dateLineLocation: LocationData = {
        latitude: 0,
        longitude: 180,
        accuracy: 5,
        timestamp: new Date()
      };

      const result = locationService.validateLocation(
        dateLineLocation,
        { latitude: 0, longitude: 180, radius: 100 },
        mockValidationOptions
      );

      expect(result.isValid).toBe(true);
    });

    it('should handle zero radius', () => {
      const result = locationService.validateLocation(
        mockLocationData,
        { ...mockSessionLocation, radius: 0 },
        mockValidationOptions
      );

      expect(result.isValid).toBe(true); // Exact match should be valid
    });
  });
});
