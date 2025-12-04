import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Navigation, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Zap,
  Target,
  Activity,
  Clock,
  Wifi,
  Battery,
  Signal,
  AlertCircle,
  Info,
  ExternalLink,
  Download,
  Upload,
  Settings,
  HelpCircle,
  Phone,
  Mail,
  MessageCircle,
  Compass,
  Globe,
  Map,
  Route,
  Navigation2,
  Crosshair,
  Locate,
  MapIcon,
  Navigation,
  MapPin,
  Target,
  Search,
  Eye,
  Compass,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Move,
  Hand,
  MousePointer,
  Keyboard,
  Monitor,
  Laptop,
  Tablet,
  Smartphone,
  Watch,
  Headphones,
  Speaker,
  Tv,
  Radio,
  Wifi as WifiIcon,
  Bluetooth,
  Usb,
  HardDrive,
  Database,
  Server,
  Cloud,
  Globe as GlobeIcon,
  Lock as LockIcon,
  Unlock,
  Key,
  Fingerprint,
  Scan,
  QrCode,
  Barcode,
  Tag,
  Tag,
  Ticket,
  CreditCard,
  Wallet,
  Banknote,
  Coins,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Activity as ActivityIcon,
  Target as TargetIcon,
  Zap as ZapIcon,
  Shield as ShieldIcon,
  AlertTriangle as AlertTriangleIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  AlertCircle as AlertCircleIcon,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Edit,
  Trash2,
  Copy,
  ExternalLink as ExternalLinkIcon,
  Share,
  Bookmark,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Flag,
  FileText,
  Bug,
  Lightbulb,
  Book,
  FileText,
  Video,
  Image,
  Music,
  Headphones as HeadphonesIcon,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Maximize as MaximizeIcon,
  Minimize as MinimizeIcon,
  RotateCcw as RotateCcwIcon,
  RotateCw as RotateCwIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Move as MoveIcon,
  Hand as HandIcon,
  MousePointer as MousePointerIcon,
  Keyboard as KeyboardIcon,
  Monitor as MonitorIcon,
  Laptop as LaptopIcon,
  Tablet as TabletIcon,
  Watch as WatchIcon,
  Speaker as SpeakerIcon,
  Tv as TvIcon,
  Radio as RadioIcon,
  Bluetooth as BluetoothIcon,
  Usb as UsbIcon,
  HardDrive as HardDriveIcon,
  Database as DatabaseIcon,
  Server as ServerIcon,
  Cloud as CloudIcon,
  Key as KeyIcon,
  Scan as ScanIcon,
  Barcode as BarcodeIcon,
  Tag as TagIcon,
  Tag as TagIcon,
  Ticket as TicketIcon,
  CreditCard as CreditCardIcon,
  Wallet as WalletIcon,
  Banknote as BanknoteIcon,
  Coins as CoinsIcon,
  PiggyBank as PiggyBankIcon,
  BarChart3 as BarChart3Icon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

// Types
interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
  source: 'GPS' | 'NETWORK' | 'PASSIVE';
  isVerified: boolean;
  isWithinRadius: boolean;
  distance?: number;
  timezone: string;
  address?: string;
  city?: string;
  country?: string;
}

interface GeofenceData {
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  name: string;
  type: 'CIRCLE' | 'POLYGON' | 'RECTANGLE';
  isActive: boolean;
  tolerance: number;
}

interface LocationValidation {
  isValid: boolean;
  score: number;
  warnings: string[];
  errors: string[];
  recommendations: string[];
  distance: number;
  isWithinRadius: boolean;
  accuracyScore: number;
  timeScore: number;
  sourceScore: number;
}

interface LocationPermission {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
  canAskAgain: boolean;
  level: 'NONE' | 'COARSE' | 'FINE';
}

interface LocationVerificationProps {
  onLocationUpdate: (location: LocationData) => void;
  onValidationComplete: (validation: LocationValidation) => void;
  onPermissionChange: (permission: LocationPermission) => void;
  geofence: GeofenceData;
  requiredAccuracy: number;
  maxDistance: number;
  enableHighAccuracy: boolean;
  timeout: number;
  enableGeofencing: boolean;
  enableAddressLookup: boolean;
  enableTimezoneDetection: boolean;
}

export function LocationVerification({
  onLocationUpdate,
  onValidationComplete,
  onPermissionChange,
  geofence,
  requiredAccuracy,
  maxDistance,
  enableHighAccuracy,
  timeout,
  enableGeofencing,
  enableAddressLookup,
  enableTimezoneDetection
}: LocationVerificationProps) {
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locationPermission, setLocationPermission] = useState<LocationPermission>({
    granted: false,
    denied: false,
    prompt: true,
    canAskAgain: true,
    level: 'NONE'
  });
  const [isTracking, setIsTracking] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [validation, setValidation] = useState<LocationValidation | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'ONLINE' | 'OFFLINE' | 'POOR'>('ONLINE');
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [signalStrength, setSignalStrength] = useState(4);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);

  // Initialize location tracking
  useEffect(() => {
    checkLocationPermission();
    startStatusMonitoring();
  }, []);

  // Handle location permission changes
  useEffect(() => {
    onPermissionChange(locationPermission);
  }, [locationPermission, onPermissionChange]);

  // Handle location data updates
  useEffect(() => {
    if (locationData) {
      onLocationUpdate(locationData);
      validateLocation(locationData);
    }
  }, [locationData, onLocationUpdate]);

  const checkLocationPermission = async () => {
    try {
      if (!navigator.geolocation) {
        setLocationPermission({
          granted: false,
          denied: true,
          prompt: false,
          canAskAgain: false,
          level: 'NONE'
        });
        return;
      }

      // Check permission status
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        
        setLocationPermission({
          granted: permission.state === 'granted',
          denied: permission.state === 'denied',
          prompt: permission.state === 'prompt',
          canAskAgain: permission.state !== 'denied',
          level: 'FINE'
        });

        // Listen for permission changes
        permission.addEventListener('change', () => {
          setLocationPermission({
            granted: permission.state === 'granted',
            denied: permission.state === 'denied',
            prompt: permission.state === 'prompt',
            canAskAgain: permission.state !== 'denied',
            level: 'FINE'
          });
        });
      } else {
        // Fallback for browsers without permissions API
        setLocationPermission({
          granted: false,
          denied: false,
          prompt: true,
          canAskAgain: true,
          level: 'FINE'
        });
      }
    } catch (error) {
      console.error('Permission check failed:', error);
      setLocationPermission({
        granted: false,
        denied: true,
        prompt: false,
        canAskAgain: false,
        level: 'NONE'
      });
    }
  };

  const startStatusMonitoring = () => {
    const interval = setInterval(() => {
      updateConnectionStatus();
      updateBatteryLevel();
      updateSignalStrength();
    }, 5000);

    return () => clearInterval(interval);
  };

  const updateConnectionStatus = () => {
    if (navigator.onLine) {
      setConnectionStatus('ONLINE');
    } else {
      setConnectionStatus('OFFLINE');
    }
  };

  const updateBatteryLevel = () => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
      });
    }
  };

  const updateSignalStrength = () => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const strength = Math.round((connection.downlink / 10) * 4);
        setSignalStrength(Math.min(4, Math.max(1, strength)));
      }
    }
  };

  const requestLocationPermission = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: enableHighAccuracy,
            timeout: timeout,
            maximumAge: 30000
          }
        );
      });

      setLocationPermission({
        granted: true,
        denied: false,
        prompt: false,
        canAskAgain: true,
        level: 'FINE'
      });

      handleLocationSuccess(position);
    } catch (error) {
      console.error('Location permission request failed:', error);
      setLocationPermission({
        granted: false,
        denied: true,
        prompt: false,
        canAskAgain: true,
        level: 'NONE'
      });
      handleLocationError(error as GeolocationPositionError);
    }
  };

  const startLocationTracking = () => {
    if (!locationPermission.granted) {
      requestLocationPermission();
      return;
    }

    setIsTracking(true);
    setTrackingError(null);
    setRetryCount(0);

    const watchId = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        enableHighAccuracy: enableHighAccuracy,
        timeout: timeout,
        maximumAge: 10000
      }
    );

    setWatchId(watchId);
  };

  const SquareLocationTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  };

  const handleLocationSuccess = (position: GeolocationPosition) => {
    const location: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || undefined,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
      timestamp: new Date(),
      source: 'GPS',
      isVerified: true,
      isWithinRadius: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    // Calculate distance to geofence center
    if (enableGeofencing) {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        geofence.center.latitude,
        geofence.center.longitude
      );
      
      location.distance = distance;
      location.isWithinRadius = distance <= geofence.radius;
    }

    // Address lookup
    if (enableAddressLookup) {
      lookupAddress(location.latitude, location.longitude)
        .then(address => {
          setLocationData(prev => prev ? { ...prev, ...address } : null);
        })
        .catch(error => {
          console.error('Address lookup failed:', error);
        });
    }

    setLocationData(location);
    setLastUpdate(new Date());
    setTrackingError(null);
    setRetryCount(0);
  };

  const handleLocationError = (error: GeolocationPositionError) => {
    console.error('Location tracking error:', error);
    
    let errorMessage = 'Location tracking failed';
    let canRetry = true;

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location permission denied';
        canRetry = false;
        setLocationPermission(prev => ({ ...prev, denied: true, granted: false }));
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out';
        break;
    }

    setTrackingError(errorMessage);
    setIsTracking(false);

    if (canRetry && retryCount < maxRetries) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        startLocationTracking();
      }, 2000);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const lookupAddress = async (latitude: number, longitude: number) => {
    try {
      // Mock address lookup - replace with actual geocoding service
      const response = await fetch(
        `https://api.example.com/geocode?lat=${latitude}&lng=${longitude}`
      );
      const data = await response.json();
      
      return {
        address: data.address,
        city: data.city,
        country: data.country
      };
    } catch (error) {
      console.error('Address lookup failed:', error);
      return {};
    }
  };

  const validateLocation = (location: LocationData) => {
    const warnings: string[] = [];
    const errors: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check accuracy
    if (location.accuracy > requiredAccuracy) {
      warnings.push(`Location accuracy is ${location.accuracy}m, required is ${requiredAccuracy}m`);
      score -= 20;
    }

    // Check distance
    if (enableGeofencing && location.distance) {
      if (location.distance > geofence.radius) {
        errors.push(`You are ${Math.round(location.distance)}m away from the allowed area`);
        score -= 50;
      } else if (location.distance > geofence.radius * 0.8) {
        warnings.push(`You are close to the boundary (${Math.round(location.distance)}m away)`);
        score -= 10;
      }
    }

    // Check connection status
    if (connectionStatus === 'OFFLINE') {
      errors.push('No internet connection');
      score -= 30;
    }

    // Check battery level
    if (batteryLevel < 20) {
      warnings.push('Low battery level may affect GPS accuracy');
      score -= 10;
    }

    // Check signal strength
    if (signalStrength < 2) {
      warnings.push('Poor network signal may affect location accuracy');
      score -= 15;
    }

    // Generate recommendations
    if (location.accuracy > requiredAccuracy) {
      recommendations.push('Move to an area with better GPS signal');
    }
    if (enableGeofencing && location.distance && location.distance > geofence.radius) {
      recommendations.push('Move closer to the designated area');
    }
    if (batteryLevel < 20) {
      recommendations.push('Charge your device for better GPS performance');
    }

    const validation: LocationValidation = {
      isValid: errors.length === 0,
      score: Math.max(0, score),
      warnings,
      errors,
      recommendations,
      distance: location.distance || 0,
      isWithinRadius: location.isWithinRadius,
      accuracyScore: Math.max(0, 100 - (location.accuracy / requiredAccuracy) * 100),
      timeScore: 100, // Could be based on time since last update
      sourceScore: location.source === 'GPS' ? 100 : 80
    };

    setValidation(validation);
    onValidationComplete(validation);
  };

  const handleRetry = () => {
    setTrackingError(null);
    setRetryCount(0);
    startLocationTracking();
  };

  const getPermissionIcon = () => {
    if (locationPermission.granted) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (locationPermission.denied) return <XCircle className="h-5 w-5 text-red-600" />;
    return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
  };

  const getPermissionColor = () => {
    if (locationPermission.granted) return 'text-green-600';
    if (locationPermission.denied) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getPermissionBadge = () => {
    if (locationPermission.granted) return 'bg-green-500';
    if (locationPermission.denied) return 'bg-red-500';
    return 'bg-yellow-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MapPin className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Location Verification</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp(true)}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center space-x-2">
          <Wifi className={`h-4 w-4 ${connectionStatus === 'ONLINE' ? 'text-green-600' : 'text-red-600'}`} />
          <span className="text-sm font-medium">{connectionStatus}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Battery className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">{batteryLevel}%</span>
        </div>
        <div className="flex items-center space-x-2">
          <Signal className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">{signalStrength}/4</span>
        </div>
        <div className="flex items-center space-x-2">
          <Navigation className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium">{locationData ? 'Active' : 'Inactive'}</span>
        </div>
      </div>

      {/* Permission Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getPermissionIcon()}
            <span>Location Permission</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Permission Status</div>
                <div className="text-sm text-muted-foreground">
                  {locationPermission.granted ? 'Granted' : 
                   locationPermission.denied ? 'Denied' : 'Not Requested'}
                </div>
              </div>
              <Badge className={getPermissionBadge()}>
                {locationPermission.granted ? 'Granted' : 
                 locationPermission.denied ? 'Denied' : 'Pending'}
              </Badge>
            </div>
            
            {!locationPermission.granted && (
              <Button
                onClick={requestLocationPermission}
                disabled={locationPermission.denied}
                className="w-full"
              >
                {locationPermission.denied ? 'Permission Denied' : 'Request Permission'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Location Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Navigation className="h-5 w-5" />
            <span>Location Tracking</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={isTracking ? SquareLocationTracking : startLocationTracking}
                disabled={!locationPermission.granted}
                className="flex-1"
              >
                {isTracking ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Square Tracking
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4 mr-2" />
                    Start Tracking
                  </>
                )}
              </Button>
              
              {trackingError && (
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  disabled={isTracking}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              )}
            </div>

            {/* Location Data */}
            {locationData && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">Latitude</div>
                    <div className="text-sm text-muted-foreground">
                      {locationData.latitude.toFixed(6)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Longitude</div>
                    <div className="text-sm text-muted-foreground">
                      {locationData.longitude.toFixed(6)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Accuracy</div>
                    <div className="text-sm text-muted-foreground">
                      {locationData.accuracy.toFixed(1)}m
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Source</div>
                    <div className="text-sm text-muted-foreground">
                      {locationData.source}
                    </div>
                  </div>
                </div>

                {locationData.address && (
                  <div>
                    <div className="text-sm font-medium">Address</div>
                    <div className="text-sm text-muted-foreground">
                      {locationData.address}
                    </div>
                  </div>
                )}

                {enableGeofencing && locationData.distance !== undefined && (
                  <div>
                    <div className="text-sm font-medium">Distance to Center</div>
                    <div className="text-sm text-muted-foreground">
                      {locationData.distance.toFixed(1)}m
                    </div>
                  </div>
                )}

                {lastUpdate && (
                  <div>
                    <div className="text-sm font-medium">Last Update</div>
                    <div className="text-sm text-muted-foreground">
                      {lastUpdate.toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tracking Error */}
            {trackingError && (
              <div className="text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                {trackingError}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Geofence Information */}
      {enableGeofencing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Geofence</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Center</div>
                  <div className="text-sm text-muted-foreground">
                    {geofence.center.latitude.toFixed(6)}, {geofence.center.longitude.toFixed(6)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Radius</div>
                  <div className="text-sm text-muted-foreground">
                    {geofence.radius}m
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Name</div>
                  <div className="text-sm text-muted-foreground">
                    {geofence.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Status</div>
                  <Badge className={geofence.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                    {geofence.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      {validation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <span>Location Validation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Validation Score</span>
                <div className="flex items-center space-x-2">
                  <Progress value={validation.score} className="w-20 h-2" />
                  <span className="text-sm font-medium">{validation.score}%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-medium">Accuracy Score</div>
                  <div className="text-sm text-muted-foreground">{validation.accuracyScore}%</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Time Score</div>
                  <div className="text-sm text-muted-foreground">{validation.timeScore}%</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Source Score</div>
                  <div className="text-sm text-muted-foreground">{validation.sourceScore}%</div>
                </div>
              </div>
              
              {validation.warnings.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-yellow-600 mb-2">Warnings</div>
                  <div className="space-y-1">
                    {validation.warnings.map((warning, index) => (
                      <div key={index} className="text-sm text-yellow-600 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {validation.errors.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-red-600 mb-2">Errors</div>
                  <div className="space-y-1">
                    {validation.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {validation.recommendations.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-blue-600 mb-2">Recommendations</div>
                  <div className="space-y-1">
                    {validation.recommendations.map((recommendation, index) => (
                      <div key={index} className="text-sm text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                        {recommendation}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Location Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">High Accuracy</span>
                  <Switch
                    checked={enableHighAccuracy}
                    onCheckedChange={(checked) => {
                      // Handle high accuracy setting change
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Geofencing</span>
                  <Switch
                    checked={enableGeofencing}
                    onCheckedChange={(checked) => {
                      // Handle geofencing setting change
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Address Lookup</span>
                  <Switch
                    checked={enableAddressLookup}
                    onCheckedChange={(checked) => {
                      // Handle address lookup setting change
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Location Help</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium">How to Enable Location</div>
                  <div className="text-sm text-muted-foreground">
                    1. Grant location permission when prompted<br/>
                    2. Ensure GPS is enabled on your device<br/>
                    3. Move to an area with good GPS signal<br/>
                    4. Wait for location to be detected
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Troubleshooting</div>
                  <div className="text-sm text-muted-foreground">
                    �?Check location permissions in browser settings<br/>
                    �?Ensure GPS is enabled on your device<br/>
                    �?Move to an area with better GPS signal<br/>
                    �?Restart the app if needed
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
