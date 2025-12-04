// Security Services Export
export { LocationService } from './location.service';
export { DeviceFingerprintService } from './device-fingerprint.service';
export { FraudDetectionService } from './fraud-detection.service';
export { TimeValidationService } from './time-validation.service';
export { PhotoVerificationService } from './photo-verification.service';
export { SecurityAnalyticsService } from './security-analytics.service';

// Types Export
export * from './types';

// Security Service Factory
export class SecurityServiceFactory {
  private static instance: SecurityServiceFactory;
  private services: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): SecurityServiceFactory {
    if (!SecurityServiceFactory.instance) {
      SecurityServiceFactory.instance = new SecurityServiceFactory();
    }
    return SecurityServiceFactory.instance;
  }

  public getLocationService(): LocationService {
    if (!this.services.has('location')) {
      this.services.set('location', new LocationService());
    }
    return this.services.get('location');
  }

  public getDeviceFingerprintService(): DeviceFingerprintService {
    if (!this.services.has('device')) {
      this.services.set('device', new DeviceFingerprintService());
    }
    return this.services.get('device');
  }

  public getFraudDetectionService(config: any): FraudDetectionService {
    if (!this.services.has('fraud')) {
      this.services.set('fraud', new FraudDetectionService(config));
    }
    return this.services.get('fraud');
  }

  public getTimeValidationService(config: any): TimeValidationService {
    if (!this.services.has('time')) {
      this.services.set('time', new TimeValidationService(config));
    }
    return this.services.get('time');
  }

  public getPhotoVerificationService(config: any): PhotoVerificationService {
    if (!this.services.has('photo')) {
      this.services.set('photo', new PhotoVerificationService(config));
    }
    return this.services.get('photo');
  }

  public getSecurityAnalyticsService(config: any): SecurityAnalyticsService {
    if (!this.services.has('analytics')) {
      this.services.set('analytics', new SecurityAnalyticsService(config));
    }
    return this.services.get('analytics');
  }
}

// Default Security Configuration
export const defaultSecurityConfig = {
  location: {
    enableGeofencing: true,
    maxAccuracy: 100,
    minAccuracy: 1,
    spoofingDetection: true
  },
  device: {
    enableFingerprinting: true,
    allowDeviceChanges: true,
    maxDevicesPerUser: 3
  },
  fraud: {
    locationWeight: 0.3,
    deviceWeight: 0.25,
    timeWeight: 0.2,
    behaviorWeight: 0.15,
    photoWeight: 0.1,
    thresholds: {
      low: 0.3,
      medium: 0.5,
      high: 0.7,
      critical: 0.9
    }
  },
  time: {
    gracePeriod: 5,
    timezone: 'UTC',
    serverTimeOffset: 0,
    maxTimeDrift: 300000 // 5 minutes
  },
  photo: {
    minQuality: 0.6,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['jpeg', 'jpg', 'png', 'webp'],
    requireFaceDetection: false,
    maxDimensions: { width: 4096, height: 4096 },
    minDimensions: { width: 320, height: 240 }
  },
  analytics: {
    enableRealTimeMonitoring: true,
    reportInterval: 60, // minutes
    alertThresholds: {
      fraudScore: 0.7,
      attemptRate: 10 // per hour
    }
  }
};
