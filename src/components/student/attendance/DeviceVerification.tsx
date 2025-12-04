import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
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
  Headphones,
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
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move,
  Hand,
  MousePointer,
  Keyboard,
  Monitor,
  Laptop,
  Tablet,
  Watch,
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
  Globe,
  Lock as LockIcon,
  Unlock,
  Key,
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
interface DeviceFingerprint {
  fingerprint: string;
  deviceInfo: string;
  browserInfo: string;
  hardwareInfo: string;
  networkInfo: string;
  screenInfo: string;
  timezoneInfo: string;
  languageInfo: string;
  isVerified: boolean;
  isNewDevice: boolean;
  lastUsed: Date;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  components: DeviceComponent[];
}

interface DeviceComponent {
  name: string;
  value: string;
  weight: number;
  isStable: boolean;
  lastChanged: Date;
}

interface DeviceValidation {
  isValid: boolean;
  score: number;
  warnings: string[];
  errors: string[];
  recommendations: string[];
  stabilityScore: number;
  uniquenessScore: number;
  riskScore: number;
}

interface DeviceRegistration {
  isRegistered: boolean;
  registrationDate: Date;
  deviceCount: number;
  maxDevices: number;
  allowedDevices: string[];
  blockedDevices: string[];
}

interface DeviceVerificationProps {
  onFingerprintUpdate: (fingerprint: DeviceFingerprint) => void;
  onValidationComplete: (validation: DeviceValidation) => void;
  onRegistrationChange: (registration: DeviceRegistration) => void;
  enableHardwareFingerprinting: boolean;
  enableBrowserFingerprinting: boolean;
  enableNetworkFingerprinting: boolean;
  enableCanvasFingerprinting: boolean;
  enableWebGLFingerprinting: boolean;
  enableAudioFingerprinting: boolean;
  enableFontFingerprinting: boolean;
  maxDevices: number;
  riskThreshold: number;
  stabilityThreshold: number;
}

export function DeviceVerification({
  onFingerprintUpdate,
  onValidationComplete,
  onRegistrationChange,
  enableHardwareFingerprinting,
  enableBrowserFingerprinting,
  enableNetworkFingerprinting,
  enableCanvasFingerprinting,
  enableWebGLFingerprinting,
  enableAudioFingerprinting,
  enableFontFingerprinting,
  maxDevices,
  riskThreshold,
  stabilityThreshold
}: DeviceVerificationProps) {
  const [deviceFingerprint, setDeviceFingerprint] = useState<DeviceFingerprint | null>(null);
  const [deviceRegistration, setDeviceRegistration] = useState<DeviceRegistration>({
    isRegistered: false,
    registrationDate: new Date(),
    deviceCount: 0,
    maxDevices: maxDevices,
    allowedDevices: [],
    blockedDevices: []
  });
  const [validation, setValidation] = useState<DeviceValidation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'ONLINE' | 'OFFLINE' | 'POOR'>('ONLINE');
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [signalStrength, setSignalStrength] = useState(4);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);

  // Initialize device verification
  useEffect(() => {
    generateDeviceFingerprint();
    checkDeviceRegistration();
    startStatusMonitoring();
  }, []);

  // Handle fingerprint updates
  useEffect(() => {
    if (deviceFingerprint) {
      onFingerprintUpdate(deviceFingerprint);
      validateDevice(deviceFingerprint);
    }
  }, [deviceFingerprint, onFingerprintUpdate]);

  // Handle registration changes
  useEffect(() => {
    onRegistrationChange(deviceRegistration);
  }, [deviceRegistration, onRegistrationChange]);

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

  const generateDeviceFingerprint = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setRetryCount(0);

    try {
      const components: DeviceComponent[] = [];
      let fingerprint = '';

      // Browser fingerprinting
      if (enableBrowserFingerprinting) {
        const browserInfo = getBrowserInfo();
        const browserComponent: DeviceComponent = {
          name: 'browser',
          value: browserInfo,
          weight: 0.3,
          isStable: true,
          lastChanged: new Date()
        };
        components.push(browserComponent);
        fingerprint += browserInfo;
      }

      // Hardware fingerprinting
      if (enableHardwareFingerprinting) {
        const hardwareInfo = getHardwareInfo();
        const hardwareComponent: DeviceComponent = {
          name: 'hardware',
          value: hardwareInfo,
          weight: 0.4,
          isStable: true,
          lastChanged: new Date()
        };
        components.push(hardwareComponent);
        fingerprint += hardwareInfo;
      }

      // Network fingerprinting
      if (enableNetworkFingerprinting) {
        const networkInfo = getNetworkInfo();
        const networkComponent: DeviceComponent = {
          name: 'network',
          value: networkInfo,
          weight: 0.2,
          isStable: false,
          lastChanged: new Date()
        };
        components.push(networkComponent);
        fingerprint += networkInfo;
      }

      // Canvas fingerprinting
      if (enableCanvasFingerprinting) {
        const canvasInfo = getCanvasFingerprint();
        const canvasComponent: DeviceComponent = {
          name: 'canvas',
          value: canvasInfo,
          weight: 0.1,
          isStable: true,
          lastChanged: new Date()
        };
        components.push(canvasComponent);
        fingerprint += canvasInfo;
      }

      // WebGL fingerprinting
      if (enableWebGLFingerprinting) {
        const webglInfo = getWebGLFingerprint();
        const webglComponent: DeviceComponent = {
          name: 'webgl',
          value: webglInfo,
          weight: 0.1,
          isStable: true,
          lastChanged: new Date()
        };
        components.push(webglComponent);
        fingerprint += webglInfo;
      }

      // Audio fingerprinting
      if (enableAudioFingerprinting) {
        const audioInfo = await getAudioFingerprint();
        const audioComponent: DeviceComponent = {
          name: 'audio',
          value: audioInfo,
          weight: 0.1,
          isStable: true,
          lastChanged: new Date()
        };
        components.push(audioComponent);
        fingerprint += audioInfo;
      }

      // Font fingerprinting
      if (enableFontFingerprinting) {
        const fontInfo = getFontFingerprint();
        const fontComponent: DeviceComponent = {
          name: 'font',
          value: fontInfo,
          weight: 0.1,
          isStable: true,
          lastChanged: new Date()
        };
        components.push(fontComponent);
        fingerprint += fontInfo;
      }

      // Generate final fingerprint
      const finalFingerprint = generateHash(fingerprint);

      const fingerprintData: DeviceFingerprint = {
        fingerprint: finalFingerprint,
        deviceInfo: navigator.userAgent,
        browserInfo: getBrowserInfo(),
        hardwareInfo: getHardwareInfo(),
        networkInfo: getNetworkInfo(),
        screenInfo: getScreenInfo(),
        timezoneInfo: getTimezoneInfo(),
        languageInfo: getLanguageInfo(),
        isVerified: true,
        isNewDevice: false,
        lastUsed: new Date(),
        riskLevel: 'LOW',
        confidence: 95,
        components
      };

      setDeviceFingerprint(fingerprintData);
      setIsGenerating(false);
    } catch (error) {
      console.error('Device fingerprint generation failed:', error);
      setGenerationError('Failed to generate device fingerprint');
      setIsGenerating(false);
      
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          generateDeviceFingerprint();
        }, 2000);
      }
    }
  };

  const getBrowserInfo = (): string => {
    const browser = navigator.userAgent;
    const language = navigator.language;
    const platform = navigator.platform;
    const cookieEnabled = navigator.cookieEnabled;
    const doNotTrack = navigator.doNotTrack;
    
    return `${browser}-${language}-${platform}-${cookieEnabled}-${doNotTrack}`;
  };

  const getHardwareInfo = (): string => {
    const screen = `${screen.width}x${screen.height}x${screen.colorDepth}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    const platform = navigator.platform;
    const hardwareConcurrency = navigator.hardwareConcurrency || 0;
    
    return `${screen}-${timezone}-${language}-${platform}-${hardwareConcurrency}`;
  };

  const getNetworkInfo = (): string => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return `${connection.type}-${connection.effectiveType}-${connection.downlink}`;
    }
    return 'unknown';
  };

  const getScreenInfo = (): string => {
    return `${screen.width}x${screen.height}x${screen.colorDepth}x${screen.pixelDepth}`;
  };

  const getTimezoneInfo = (): string => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  const getLanguageInfo = (): string => {
    return navigator.language;
  };

  const getCanvasFingerprint = (): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'canvas-not-supported';
    
    canvas.width = 200;
    canvas.height = 50;
    
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Canvas fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Canvas fingerprint', 4, 17);
    
    return canvas.toDataURL();
  };

  const getWebGLFingerprint = (): string => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'webgl-not-supported';
    
    const renderer = gl.getParameter(gl.RENDERER);
    const vendor = gl.getParameter(gl.VENDOR);
    const version = gl.getParameter(gl.VERSION);
    const shadingLanguageVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
    
    return `${renderer}-${vendor}-${version}-${shadingLanguageVersion}`;
  };

  const getAudioFingerprint = async (): Promise<string> => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start(0);
      
      return new Promise((resolve) => {
        scriptProcessor.onaudioprocess = (event) => {
          const buffer = event.inputBuffer.getChannelData(0);
          const fingerprint = Array.from(buffer).slice(0, 30).join(',');
          oscillator.Square();
          audioContext.close();
          resolve(fingerprint);
        };
      });
    } catch (error) {
      return 'audio-not-supported';
    }
  };

  const getFontFingerprint = (): string => {
    const fonts = [
      'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
      'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
      'Trebuchet MS', 'Arial Black', 'Impact'
    ];
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'canvas-not-supported';
    
    const availableFonts: string[] = [];
    
    fonts.forEach(font => {
      ctx.font = `12px ${font}`;
      const metrics = ctx.measureText('test');
      if (metrics.width > 0) {
        availableFonts.push(font);
      }
    });
    
    return availableFonts.join(',');
  };

  const generateHash = (input: string): string => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  };

  const validateDevice = (fingerprint: DeviceFingerprint) => {
    const warnings: string[] = [];
    const errors: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check if device is registered
    if (!deviceRegistration.isRegistered) {
      warnings.push('Device is not registered');
      score -= 20;
    }

    // Check device count
    if (deviceRegistration.deviceCount >= deviceRegistration.maxDevices) {
      errors.push('Maximum number of devices reached');
      score -= 50;
    }

    // Check if device is blocked
    if (deviceRegistration.blockedDevices.includes(fingerprint.fingerprint)) {
      errors.push('Device is blocked');
      score -= 100;
    }

    // Check risk level
    if (fingerprint.riskLevel === 'HIGH' || fingerprint.riskLevel === 'CRITICAL') {
      warnings.push(`High risk device detected: ${fingerprint.riskLevel}`);
      score -= 30;
    }

    // Check confidence level
    if (fingerprint.confidence < 80) {
      warnings.push('Low confidence in device fingerprint');
      score -= 15;
    }

    // Check connection status
    if (connectionStatus === 'OFFLINE') {
      errors.push('No internet connection');
      score -= 30;
    }

    // Check battery level
    if (batteryLevel < 20) {
      warnings.push('Low battery level may affect device performance');
      score -= 10;
    }

    // Check signal strength
    if (signalStrength < 2) {
      warnings.push('Poor network signal may affect device verification');
      score -= 15;
    }

    // Generate recommendations
    if (!deviceRegistration.isRegistered) {
      recommendations.push('Register this device for better security');
    }
    if (fingerprint.riskLevel === 'HIGH' || fingerprint.riskLevel === 'CRITICAL') {
      recommendations.push('Contact support if you believe this is an error');
    }
    if (fingerprint.confidence < 80) {
      recommendations.push('Try refreshing the page or restarting the app');
    }

    const validation: DeviceValidation = {
      isValid: errors.length === 0,
      score: Math.max(0, score),
      warnings,
      errors,
      recommendations,
      stabilityScore: calculateStabilityScore(fingerprint),
      uniquenessScore: calculateUniquenessScore(fingerprint),
      riskScore: calculateRiskScore(fingerprint)
    };

    setValidation(validation);
    onValidationComplete(validation);
  };

  const calculateStabilityScore = (fingerprint: DeviceFingerprint): number => {
    const stableComponents = fingerprint.components.filter(comp => comp.isStable);
    return (stableComponents.length / fingerprint.components.length) * 100;
  };

  const calculateUniquenessScore = (fingerprint: DeviceFingerprint): number => {
    // Mock uniqueness calculation
    return Math.random() * 100;
  };

  const calculateRiskScore = (fingerprint: DeviceFingerprint): number => {
    switch (fingerprint.riskLevel) {
      case 'LOW': return 20;
      case 'MEDIUM': return 40;
      case 'HIGH': return 70;
      case 'CRITICAL': return 90;
      default: return 50;
    }
  };

  const checkDeviceRegistration = async () => {
    try {
      // Mock device registration check
      const isRegistered = Math.random() > 0.5;
      const deviceCount = Math.floor(Math.random() * 3);
      
      setDeviceRegistration(prev => ({
        ...prev,
        isRegistered,
        deviceCount,
        registrationDate: isRegistered ? new Date() : prev.registrationDate
      }));
    } catch (error) {
      console.error('Device registration check failed:', error);
    }
  };

  const registerDevice = async () => {
    try {
      if (deviceFingerprint) {
        // Mock device registration
        setDeviceRegistration(prev => ({
          ...prev,
          isRegistered: true,
          deviceCount: prev.deviceCount + 1,
          registrationDate: new Date(),
          allowedDevices: [...prev.allowedDevices, deviceFingerprint.fingerprint]
        }));
      }
    } catch (error) {
      console.error('Device registration failed:', error);
    }
  };

  const handleRetry = () => {
    setGenerationError(null);
    setRetryCount(0);
    generateDeviceFingerprint();
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'MEDIUM': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'HIGH': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'CRITICAL': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'HIGH': return 'text-orange-600';
      case 'CRITICAL': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return 'bg-green-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'HIGH': return 'bg-orange-500';
      case 'CRITICAL': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Smartphone className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Device Verification</h2>
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
          <Fingerprint className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium">{deviceFingerprint ? 'Active' : 'Inactive'}</span>
        </div>
      </div>

      {/* Device Registration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Device Registration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Registration Status</div>
                <div className="text-sm text-muted-foreground">
                  {deviceRegistration.isRegistered ? 'Registered' : 'Not Registered'}
                </div>
              </div>
              <Badge className={deviceRegistration.isRegistered ? 'bg-green-500' : 'bg-red-500'}>
                {deviceRegistration.isRegistered ? 'Registered' : 'Not Registered'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium">Device Count</div>
                <div className="text-sm text-muted-foreground">
                  {deviceRegistration.deviceCount} / {deviceRegistration.maxDevices}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Registration Date</div>
                <div className="text-sm text-muted-foreground">
                  {deviceRegistration.registrationDate.toLocaleDateString()}
                </div>
              </div>
            </div>
            
            {!deviceRegistration.isRegistered && (
              <Button
                onClick={registerDevice}
                disabled={!deviceFingerprint}
                className="w-full"
              >
                Register Device
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Device Fingerprint */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Fingerprint className="h-5 w-5" />
            <span>Device Fingerprint</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Generation Controls */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={generateDeviceFingerprint}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-4 w-4 mr-2" />
                    Generate Fingerprint
                  </>
                )}
              </Button>
              
              {generationError && (
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  disabled={isGenerating}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              )}
            </div>

            {/* Fingerprint Data */}
            {deviceFingerprint && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">Fingerprint</div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {deviceFingerprint.fingerprint}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Risk Level</div>
                    <div className="flex items-center space-x-2">
                      {getRiskIcon(deviceFingerprint.riskLevel)}
                      <Badge className={getRiskBadge(deviceFingerprint.riskLevel)}>
                        {deviceFingerprint.riskLevel}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Confidence</div>
                    <div className="text-sm text-muted-foreground">
                      {deviceFingerprint.confidence}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Last Used</div>
                    <div className="text-sm text-muted-foreground">
                      {deviceFingerprint.lastUsed.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Device Components */}
                <div>
                  <div className="text-sm font-medium mb-2">Fingerprint Components</div>
                  <div className="space-y-2">
                    {deviceFingerprint.components.map((component, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          <span className="text-sm font-medium">{component.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{component.weight}</Badge>
                          <Badge className={component.isStable ? 'bg-green-500' : 'bg-yellow-500'}>
                            {component.isStable ? 'Stable' : 'Variable'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Generation Error */}
            {generationError && (
              <div className="text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                {generationError}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <span>Device Validation</span>
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
                  <div className="text-sm font-medium">Stability Score</div>
                  <div className="text-sm text-muted-foreground">{validation.stabilityScore}%</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Uniqueness Score</div>
                  <div className="text-sm text-muted-foreground">{validation.uniquenessScore}%</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Risk Score</div>
                  <div className="text-sm text-muted-foreground">{validation.riskScore}%</div>
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
              <CardTitle>Device Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Hardware Fingerprinting</span>
                  <Switch
                    checked={enableHardwareFingerprinting}
                    onCheckedChange={(checked) => {
                      // Handle hardware fingerprinting setting change
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Browser Fingerprinting</span>
                  <Switch
                    checked={enableBrowserFingerprinting}
                    onCheckedChange={(checked) => {
                      // Handle browser fingerprinting setting change
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Canvas Fingerprinting</span>
                  <Switch
                    checked={enableCanvasFingerprinting}
                    onCheckedChange={(checked) => {
                      // Handle canvas fingerprinting setting change
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
              <CardTitle>Device Help</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium">What is Device Fingerprinting?</div>
                  <div className="text-sm text-muted-foreground">
                    Device fingerprinting creates a unique identifier for your device using hardware and software characteristics.
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Why is it needed?</div>
                  <div className="text-sm text-muted-foreground">
                    It helps prevent fraud and ensures attendance is taken from the correct device.
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Privacy</div>
                  <div className="text-sm text-muted-foreground">
                    Your device fingerprint is encrypted and only used for security purposes.
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
