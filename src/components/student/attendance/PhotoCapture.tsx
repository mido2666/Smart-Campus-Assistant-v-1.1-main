import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
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
  Image,
  Video,
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
  Globe,
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
  Music,
  Headphones as HeadphonesIcon,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  SkipBack as SkipBackIcon,
  SkipForward as SkipForwardIcon,
  Repeat as RepeatIcon,
  Shuffle as ShuffleIcon,
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
  Globe as GlobeIcon,
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
interface PhotoData {
  url: string;
  timestamp: Date;
  quality: number;
  hasFace: boolean;
  isVerified: boolean;
  metadata: PhotoMetadata;
  size: number;
  format: string;
  dimensions: {
    width: number;
    height: number;
  };
  compression: number;
  isCompressed: boolean;
}

interface PhotoMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  compression: number;
  exif?: any;
  gps?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  device?: {
    make: string;
    model: string;
    software: string;
  };
  timestamp: Date;
  isEdited: boolean;
  hasFilters: boolean;
  isScreenshot: boolean;
}

interface PhotoValidation {
  isValid: boolean;
  score: number;
  warnings: string[];
  errors: string[];
  recommendations: string[];
  qualityScore: number;
  faceScore: number;
  metadataScore: number;
  securityScore: number;
}

interface PhotoCaptureProps {
  onPhotoCapture: (photo: PhotoData) => void;
  onValidationComplete: (validation: PhotoValidation) => void;
  onStorageUpdate: (storage: StorageInfo) => void;
  enableFaceDetection: boolean;
  enableMetadataVerification: boolean;
  enableQualityCheck: boolean;
  enableCompression: boolean;
  enableGPSVerification: boolean;
  minQuality: number;
  maxSize: number;
  allowedFormats: string[];
  enablePrivacyMode: boolean;
  enableScreenshotDetection: boolean;
  enableEditDetection: boolean;
}

interface StorageInfo {
  used: number;
  available: number;
  total: number;
  photos: number;
  maxPhotos: number;
}

export function PhotoCapture({
  onPhotoCapture,
  onValidationComplete,
  onStorageUpdate,
  enableFaceDetection,
  enableMetadataVerification,
  enableQualityCheck,
  enableCompression,
  enableGPSVerification,
  minQuality,
  maxSize,
  allowedFormats,
  enablePrivacyMode,
  enableScreenshotDetection,
  enableEditDetection
}: PhotoCaptureProps) {
  const [photoData, setPhotoData] = useState<PhotoData | null>(null);
  const [validation, setValidation] = useState<PhotoValidation | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [captureQuality, setCaptureQuality] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('HIGH');
  const [captureMode, setCaptureMode] = useState<'PHOTO' | 'VIDEO' | 'BURST'>('PHOTO');
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'ONLINE' | 'OFFLINE' | 'POOR'>('ONLINE');
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [signalStrength, setSignalStrength] = useState(4);
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    used: 0,
    available: 0,
    total: 0,
    photos: 0,
    maxPhotos: 100
  });
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize camera and permissions
  useEffect(() => {
    initializeCamera();
    checkStorageInfo();
    startStatusMonitoring();
  }, []);

  // Handle photo data updates
  useEffect(() => {
    if (photoData) {
      onPhotoCapture(photoData);
      validatePhoto(photoData);
    }
  }, [photoData, onPhotoCapture]);

  // Handle storage info updates
  useEffect(() => {
    onStorageUpdate(storageInfo);
  }, [storageInfo, onStorageUpdate]);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setCameraStream(stream);
      setCameraPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera initialization failed:', error);
      setCameraPermission(false);
      setCaptureError('Camera permission denied. Please enable camera access.');
    }
  };

  const checkStorageInfo = async () => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const available = estimate.quota || 0;
        
        setStorageInfo(prev => ({
          ...prev,
          used,
          available,
          total: available
        }));
      }
    } catch (error) {
      console.error('Storage info check failed:', error);
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

  const capturePhoto = async () => {
    if (!cameraPermission || !cameraStream || !videoRef.current || !canvasRef.current) {
      setCaptureError('Camera not available');
      return;
    }

    setIsCapturing(true);
    setCaptureError(null);
    setRetryCount(0);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Canvas context not available');
      }

      // Set canvas dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/jpeg', 0.9);
      });

      // Create photo data
      const photo: PhotoData = {
        url: URL.createObjectURL(blob),
        timestamp: new Date(),
        quality: 90,
        hasFace: false,
        isVerified: false,
        metadata: {
          width: canvas.width,
          height: canvas.height,
          format: 'JPEG',
          size: blob.size,
          compression: 0.9,
          timestamp: new Date(),
          isEdited: false,
          hasFilters: false,
          isScreenshot: false
        },
        size: blob.size,
        format: 'JPEG',
        dimensions: {
          width: canvas.width,
          height: canvas.height
        },
        compression: 0.9,
        isCompressed: true
      };

      // Process photo
      const processedPhoto = await processPhoto(photo);
      setPhotoData(processedPhoto);
      setIsCapturing(false);
    } catch (error) {
      console.error('Photo capture failed:', error);
      setCaptureError('Failed to capture photo');
      setIsCapturing(false);
      
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          capturePhoto();
        }, 2000);
      }
    }
  };

  const processPhoto = async (photo: PhotoData): Promise<PhotoData> => {
    let processedPhoto = { ...photo };

    // Face detection
    if (enableFaceDetection) {
      const hasFace = await detectFace(photo);
      processedPhoto.hasFace = hasFace;
    }

    // Quality check
    if (enableQualityCheck) {
      const quality = await checkPhotoQuality(photo);
      processedPhoto.quality = quality;
    }

    // Metadata verification
    if (enableMetadataVerification) {
      const metadata = await verifyMetadata(photo);
      processedPhoto.metadata = { ...processedPhoto.metadata, ...metadata };
    }

    // Compression
    if (enableCompression && photo.size > maxSize) {
      const compressed = await compressPhoto(photo);
      processedPhoto = { ...processedPhoto, ...compressed };
    }

    // GPS verification
    if (enableGPSVerification) {
      const gpsData = await getGPSData();
      processedPhoto.metadata.gps = gpsData;
    }

    // Screenshot detection
    if (enableScreenshotDetection) {
      const isScreenshot = await detectScreenshot(photo);
      processedPhoto.metadata.isScreenshot = isScreenshot;
    }

    // Edit detection
    if (enableEditDetection) {
      const isEdited = await detectEdits(photo);
      processedPhoto.metadata.isEdited = isEdited;
    }

    return processedPhoto;
  };

  const detectFace = async (photo: PhotoData): Promise<boolean> => {
    try {
      // Mock face detection - replace with actual face detection library
      const random = Math.random();
      return random > 0.3; // 70% chance of face detection
    } catch (error) {
      console.error('Face detection failed:', error);
      return false;
    }
  };

  const checkPhotoQuality = async (photo: PhotoData): Promise<number> => {
    try {
      // Mock quality check - replace with actual quality assessment
      const quality = Math.min(100, Math.max(0, 100 - (photo.size / 1000000) * 10));
      return quality;
    } catch (error) {
      console.error('Quality check failed:', error);
      return 50;
    }
  };

  const verifyMetadata = async (photo: PhotoData): Promise<Partial<PhotoMetadata>> => {
    try {
      // Mock metadata verification - replace with actual metadata extraction
      return {
        width: photo.dimensions.width,
        height: photo.dimensions.height,
        format: photo.format,
        size: photo.size,
        compression: photo.compression,
        timestamp: photo.timestamp,
        isEdited: false,
        hasFilters: false,
        isScreenshot: false
      };
    } catch (error) {
      console.error('Metadata verification failed:', error);
      return {};
    }
  };

  const compressPhoto = async (photo: PhotoData): Promise<Partial<PhotoData>> => {
    try {
      // Mock compression - replace with actual compression logic
      const compressionRatio = 0.7;
      const compressedSize = Math.round(photo.size * compressionRatio);
      
      return {
        size: compressedSize,
        compression: compressionRatio,
        isCompressed: true
      };
    } catch (error) {
      console.error('Photo compression failed:', error);
      return photo;
    }
  };

  const getGPSData = async (): Promise<PhotoMetadata['gps']> => {
    try {
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude || undefined
        };
      }
    } catch (error) {
      console.error('GPS data retrieval failed:', error);
    }
    return undefined;
  };

  const detectScreenshot = async (photo: PhotoData): Promise<boolean> => {
    try {
      // Mock screenshot detection - replace with actual detection logic
      const random = Math.random();
      return random > 0.9; // 10% chance of screenshot detection
    } catch (error) {
      console.error('Screenshot detection failed:', error);
      return false;
    }
  };

  const detectEdits = async (photo: PhotoData): Promise<boolean> => {
    try {
      // Mock edit detection - replace with actual detection logic
      const random = Math.random();
      return random > 0.8; // 20% chance of edit detection
    } catch (error) {
      console.error('Edit detection failed:', error);
      return false;
    }
  };

  const validatePhoto = (photo: PhotoData) => {
    const warnings: string[] = [];
    const errors: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check quality
    if (photo.quality < minQuality) {
      warnings.push(`Photo quality is ${photo.quality}%, minimum required is ${minQuality}%`);
      score -= 20;
    }

    // Check size
    if (photo.size > maxSize) {
      errors.push(`Photo size is ${(photo.size / 1024 / 1024).toFixed(2)}MB, maximum allowed is ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
      score -= 30;
    }

    // Check format
    if (!allowedFormats.includes(photo.format)) {
      errors.push(`Photo format ${photo.format} is not allowed`);
      score -= 40;
    }

    // Check face detection
    if (enableFaceDetection && !photo.hasFace) {
      warnings.push('No face detected in photo');
      score -= 15;
    }

    // Check metadata
    if (enableMetadataVerification && photo.metadata.isEdited) {
      warnings.push('Photo appears to be edited');
      score -= 25;
    }

    // Check screenshot detection
    if (enableScreenshotDetection && photo.metadata.isScreenshot) {
      errors.push('Screenshot detected - please take a new photo');
      score -= 50;
    }

    // Check GPS verification
    if (enableGPSVerification && !photo.metadata.gps) {
      warnings.push('GPS data not available');
      score -= 10;
    }

    // Check connection status
    if (connectionStatus === 'OFFLINE') {
      errors.push('No internet connection');
      score -= 30;
    }

    // Check battery level
    if (batteryLevel < 20) {
      warnings.push('Low battery level may affect photo quality');
      score -= 10;
    }

    // Check signal strength
    if (signalStrength < 2) {
      warnings.push('Poor network signal may affect photo upload');
      score -= 15;
    }

    // Generate recommendations
    if (photo.quality < minQuality) {
      recommendations.push('Try taking the photo in better lighting');
    }
    if (photo.size > maxSize) {
      recommendations.push('Enable compression to reduce file size');
    }
    if (enableFaceDetection && !photo.hasFace) {
      recommendations.push('Ensure your face is visible in the photo');
    }
    if (enableScreenshotDetection && photo.metadata.isScreenshot) {
      recommendations.push('Take a new photo instead of using a screenshot');
    }

    const validation: PhotoValidation = {
      isValid: errors.length === 0,
      score: Math.max(0, score),
      warnings,
      errors,
      recommendations,
      qualityScore: photo.quality,
      faceScore: photo.hasFace ? 100 : 0,
      metadataScore: enableMetadataVerification ? 100 : 0,
      securityScore: calculateSecurityScore(photo)
    };

    setValidation(validation);
    onValidationComplete(validation);
  };

  const calculateSecurityScore = (photo: PhotoData): number => {
    let score = 100;
    
    if (photo.metadata.isEdited) score -= 30;
    if (photo.metadata.isScreenshot) score -= 50;
    if (photo.metadata.hasFilters) score -= 20;
    if (!photo.hasFace && enableFaceDetection) score -= 25;
    if (!photo.metadata.gps && enableGPSVerification) score -= 15;
    
    return Math.max(0, score);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const url = e.target?.result as string;
      const photo: PhotoData = {
        url,
        timestamp: new Date(),
        quality: 90,
        hasFace: false,
        isVerified: false,
        metadata: {
          width: 0,
          height: 0,
          format: file.type,
          size: file.size,
          compression: 1,
          timestamp: new Date(),
          isEdited: false,
          hasFilters: false,
          isScreenshot: false
        },
        size: file.size,
        format: file.type,
        dimensions: { width: 0, height: 0 },
        compression: 1,
        isCompressed: false
      };

      const processedPhoto = await processPhoto(photo);
      setPhotoData(processedPhoto);
    };
    reader.readAsDataURL(file);
  };

  const handleRetry = () => {
    setCaptureError(null);
    setRetryCount(0);
    capturePhoto();
  };

  const getQualityIcon = (quality: number) => {
    if (quality >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (quality >= 60) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 80) return 'text-green-600';
    if (quality >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityBadge = (quality: number) => {
    if (quality >= 80) return 'bg-green-500';
    if (quality >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Camera className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Photo Capture</h2>
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
          <Image className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium">{storageInfo.photos} photos</span>
        </div>
      </div>

      {/* Camera Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>Camera</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Camera Feed */}
            <div className="relative">
              <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
              </div>
              
              {/* Capture Overlay */}
              {isCapturing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="flex items-center space-x-2 text-white">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Capturing...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={capturePhoto}
                disabled={!cameraPermission || isCapturing}
                className="flex-1"
              >
                {isCapturing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Capturing...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Capture Photo
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCapturing}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              
              {captureError && (
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  disabled={isCapturing}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Photo Preview */}
      {photoData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Image className="h-5 w-5" />
              <span>Captured Photo</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <img
                  src={photoData.url}
                  alt="Captured photo"
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium">Quality</div>
                      <div className="flex items-center space-x-2">
                        {getQualityIcon(photoData.quality)}
                        <span className={`text-sm ${getQualityColor(photoData.quality)}`}>
                          {photoData.quality}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Size</div>
                      <div className="text-sm text-muted-foreground">
                        {(photoData.size / 1024 / 1024).toFixed(2)}MB
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Format</div>
                      <div className="text-sm text-muted-foreground">
                        {photoData.format}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Dimensions</div>
                      <div className="text-sm text-muted-foreground">
                        {photoData.dimensions.width}x{photoData.dimensions.height}
                      </div>
                    </div>
                  </div>
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
              <span>Photo Validation</span>
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
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm font-medium">Quality Score</div>
                  <div className="text-sm text-muted-foreground">{validation.qualityScore}%</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Face Score</div>
                  <div className="text-sm text-muted-foreground">{validation.faceScore}%</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Metadata Score</div>
                  <div className="text-sm text-muted-foreground">{validation.metadataScore}%</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Security Score</div>
                  <div className="text-sm text-muted-foreground">{validation.securityScore}%</div>
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

      {/* Capture Error */}
      {captureError && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span>Capture Error</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-3 rounded">
              {captureError}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Photo Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Face Detection</span>
                  <Switch
                    checked={enableFaceDetection}
                    onCheckedChange={(checked) => {
                      // Handle face detection setting change
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Quality Check</span>
                  <Switch
                    checked={enableQualityCheck}
                    onCheckedChange={(checked) => {
                      // Handle quality check setting change
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Compression</span>
                  <Switch
                    checked={enableCompression}
                    onCheckedChange={(checked) => {
                      // Handle compression setting change
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
              <CardTitle>Photo Help</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium">How to Take a Good Photo</div>
                  <div className="text-sm text-muted-foreground">
                    1. Ensure good lighting<br/>
                    2. Keep your face visible<br/>
                    3. Hold the camera steady<br/>
                    4. Avoid screenshots or edited photos
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Troubleshooting</div>
                  <div className="text-sm text-muted-foreground">
                    �?Check camera permissions<br/>
                    �?Ensure good lighting<br/>
                    �?Try taking the photo again<br/>
                    �?Contact support if issues persist
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
