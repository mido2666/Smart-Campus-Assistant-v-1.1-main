import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Shield, 
  Lock, 
  Eye, 
  EyeOff,
  RefreshCw,
  CheckCircle, 
  XCircle, 
  AlertTriangle,
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
  HelpCircle,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Smartphone,
  Camera,
  QrCode,
  Fingerprint,
  Scan,
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
interface SecuritySettings {
  id: string;
  userId: string;
  lastUpdated: Date;
  privacy: PrivacySettings;
  permissions: PermissionSettings;
  security: SecurityPreferences;
  device: DeviceSettings;
  notifications: NotificationSettings;
  data: DataSettings;
}

interface PrivacySettings {
  enableLocation: boolean;
  enableDeviceTracking: boolean;
  enablePhotoCapture: boolean;
  enableBiometricData: boolean;
  enableAnalytics: boolean;
  enableCrashFileTexting: boolean;
  dataRetentionDays: number;
  allowDataSharing: boolean;
  allowThirdPartyAccess: boolean;
}

interface PermissionSettings {
  locationPermission: 'GRANTED' | 'DENIED' | 'PROMPT';
  cameraPermission: 'GRANTED' | 'DENIED' | 'PROMPT';
  microphonePermission: 'GRANTED' | 'DENIED' | 'PROMPT';
  storagePermission: 'GRANTED' | 'DENIED' | 'PROMPT';
  notificationPermission: 'GRANTED' | 'DENIED' | 'PROMPT';
  autoGrantPermissions: boolean;
  permissionTimeout: number;
}

interface SecurityPreferences {
  securityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'MAXIMUM';
  enableTwoFactor: boolean;
  enableBiometricAuth: boolean;
  enableDeviceLock: boolean;
  enableAutoLock: boolean;
  autoLockTimeout: number;
  enableFraudDetection: boolean;
  enableRiskAssessment: boolean;
  riskThreshold: number;
  enableEncryption: boolean;
  enableSecureStorage: boolean;
}

interface DeviceSettings {
  enableDeviceRegistration: boolean;
  enableDeviceFingerprinting: boolean;
  enableHardwareFingerprinting: boolean;
  enableBrowserFingerprinting: boolean;
  enableNetworkFingerprinting: boolean;
  enableCanvasFingerprinting: boolean;
  enableWebGLFingerprinting: boolean;
  enableAudioFingerprinting: boolean;
  enableFontFingerprinting: boolean;
  maxDevices: number;
  deviceTimeout: number;
}

interface NotificationSettings {
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  enableInAppNotifications: boolean;
  notificationFrequency: 'IMMEDIATE' | 'HOURLY' | 'DAILY' | 'WEEKLY';
  enableSecurityAlerts: boolean;
  enableFraudWarnings: boolean;
  enableSystemUpdates: boolean;
  enableMarketingEmails: boolean;
}

interface DataSettings {
  enableDataSync: boolean;
  enableCloudBackup: boolean;
  enableLocalBackup: boolean;
  backupFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  enableDataCompression: boolean;
  enableDataEncryption: boolean;
  maxStorageSize: number;
  enableDataExport: boolean;
  enableDataImport: boolean;
}

interface SecuritySettingsProps {
  onSettingsUpdate: (settings: SecuritySettings) => void;
  onPermissionChange: (permission: string, granted: boolean) => void;
  onSecurityChange: (setting: string, value: any) => void;
  enableRealTimeUpdates: boolean;
  updateInterval: number;
  enableNotifications: boolean;
  enableAutoSave: boolean;
  userId: string;
}

export function SecuritySettings({
  onSettingsUpdate,
  onPermissionChange,
  onSecurityChange,
  enableRealTimeUpdates,
  updateInterval,
  enableNotifications,
  enableAutoSave,
  userId
}: SecuritySettingsProps) {
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'ONLINE' | 'OFFLINE' | 'POOR'>('ONLINE');
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [signalStrength, setSignalStrength] = useState(4);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('privacy');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize settings
  useEffect(() => {
    loadSettings();
    startStatusMonitoring();
    
    if (enableRealTimeUpdates) {
      startRealTimeUpdates();
    }
  }, [enableRealTimeUpdates, updateInterval]);

  // Handle settings updates
  useEffect(() => {
    if (settings) {
      onSettingsUpdate(settings);
    }
  }, [settings, onSettingsUpdate]);

  // Track changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [settings]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Mock settings data
      const settingsData: SecuritySettings = {
        id: 'settings-' + Date.now(),
        userId,
        lastUpdated: new Date(),
        privacy: {
          enableLocation: true,
          enableDeviceTracking: true,
          enablePhotoCapture: false,
          enableBiometricData: false,
          enableAnalytics: true,
          enableCrashFileTexting: true,
          dataRetentionDays: 365,
          allowDataSharing: false,
          allowThirdPartyAccess: false
        },
        permissions: {
          locationPermission: 'GRANTED',
          cameraPermission: 'GRANTED',
          microphonePermission: 'DENIED',
          storagePermission: 'GRANTED',
          notificationPermission: 'GRANTED',
          autoGrantPermissions: false,
          permissionTimeout: 30
        },
        security: {
          securityLevel: 'HIGH',
          enableTwoFactor: false,
          enableBiometricAuth: false,
          enableDeviceLock: true,
          enableAutoLock: true,
          autoLockTimeout: 15,
          enableFraudDetection: true,
          enableRiskAssessment: true,
          riskThreshold: 70,
          enableEncryption: true,
          enableSecureStorage: true
        },
        device: {
          enableDeviceRegistration: true,
          enableDeviceFingerprinting: true,
          enableHardwareFingerprinting: true,
          enableBrowserFingerprinting: true,
          enableNetworkFingerprinting: false,
          enableCanvasFingerprinting: true,
          enableWebGLFingerprinting: true,
          enableAudioFingerprinting: false,
          enableFontFingerprinting: true,
          maxDevices: 3,
          deviceTimeout: 30
        },
        notifications: {
          enablePushNotifications: true,
          enableEmailNotifications: true,
          enableSMSNotifications: false,
          enableInAppNotifications: true,
          notificationFrequency: 'IMMEDIATE',
          enableSecurityAlerts: true,
          enableFraudWarnings: true,
          enableSystemUpdates: true,
          enableMarketingEmails: false
        },
        data: {
          enableDataSync: true,
          enableCloudBackup: false,
          enableLocalBackup: true,
          backupFrequency: 'WEEKLY',
          enableDataCompression: true,
          enableDataEncryption: true,
          maxStorageSize: 1000,
          enableDataExport: true,
          enableDataImport: false
        }
      };

      setSettings(settingsData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
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

  const startRealTimeUpdates = () => {
    const interval = setInterval(() => {
      loadSettings();
    }, updateInterval);

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

  const handleSettingChange = (category: string, setting: string, value: any) => {
    if (!settings) return;

    setSettings(prev => {
      if (!prev) return null;
      
      const updatedSettings = { ...prev };
      
      switch (category) {
        case 'privacy':
          updatedSettings.privacy = { ...prev.privacy, [setting]: value };
          break;
        case 'permissions':
          updatedSettings.permissions = { ...prev.permissions, [setting]: value };
          break;
        case 'security':
          updatedSettings.security = { ...prev.security, [setting]: value };
          break;
        case 'device':
          updatedSettings.device = { ...prev.device, [setting]: value };
          break;
        case 'notifications':
          updatedSettings.notifications = { ...prev.notifications, [setting]: value };
          break;
        case 'data':
          updatedSettings.data = { ...prev.data, [setting]: value };
          break;
      }
      
      updatedSettings.lastUpdated = new Date();
      return updatedSettings;
    });

    onSecurityChange(setting, value);
  };

  const handlePermissionChange = async (permission: string, granted: boolean) => {
    onPermissionChange(permission, granted);
    
    if (settings) {
      const updatedPermissions = { ...settings.permissions };
      updatedPermissions[permission as keyof PermissionSettings] = granted ? 'GRANTED' : 'DENIED';
      
      setSettings(prev => prev ? {
        ...prev,
        permissions: updatedPermissions,
        lastUpdated: new Date()
      } : null);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Mock save operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (settings) {
        setSettings(prev => prev ? {
          ...prev,
          lastUpdated: new Date()
        } : null);
      }
      
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (settings) {
      setSettings(prev => prev ? {
        ...prev,
        lastUpdated: new Date()
      } : null);
    }
  };

  const handleExportSettings = () => {
    if (settings) {
      const dataStr = JSON.stringify(settings, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = 'security-settings.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings(importedSettings);
      } catch (error) {
        console.error('Failed to import settings:', error);
      }
    };
    reader.readAsText(file);
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'GRANTED': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'DENIED': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'PROMPT': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'GRANTED': return 'text-green-600';
      case 'DENIED': return 'text-red-600';
      case 'PROMPT': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getPermissionBadge = (permission: string) => {
    switch (permission) {
      case 'GRANTED': return 'bg-green-500';
      case 'DENIED': return 'bg-red-500';
      case 'PROMPT': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'HIGH': return 'text-orange-600';
      case 'MAXIMUM': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSecurityLevelBadge = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-green-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MAXIMUM': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading security settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Security Settings</h2>
        </div>
        <div className="flex items-center space-x-2">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-orange-600">
              Unsaved Changes
            </Badge>
          )}
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
          <Shield className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium">{settings?.security.securityLevel}</span>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="flex items-center space-x-2 overflow-x-auto">
        {[
          { id: 'privacy', Tag: 'Privacy', icon: Eye },
          { id: 'permissions', Tag: 'Permissions', icon: Lock },
          { id: 'security', Tag: 'Security', icon: Shield },
          { id: 'device', Tag: 'Device', icon: Smartphone },
          { id: 'notifications', Tag: 'Notifications', icon: Bell },
          { id: 'data', Tag: 'Data', icon: Database }
        ].map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="flex items-center space-x-2"
          >
            <category.icon className="h-4 w-4" />
            <span>{category.Tag}</span>
          </Button>
        ))}
      </div>

      {/* Settings Content */}
      {settings && (
        <div className="space-y-6">
          {/* Privacy Settings */}
          {selectedCategory === 'privacy' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Privacy Settings</span>
                </CardTitle>
                <CardDescription>
                  Control your privacy and data collection preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Location Tracking</div>
                      <div className="text-sm text-muted-foreground">
                        Allow the app to track your location
                      </div>
                    </div>
                    <Switch
                      checked={settings.privacy.enableLocation}
                      onCheckedChange={(checked) => handleSettingChange('privacy', 'enableLocation', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Device Tracking</div>
                      <div className="text-sm text-muted-foreground">
                        Allow the app to track your device
                      </div>
                    </div>
                    <Switch
                      checked={settings.privacy.enableDeviceTracking}
                      onCheckedChange={(checked) => handleSettingChange('privacy', 'enableDeviceTracking', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Photo Capture</div>
                      <div className="text-sm text-muted-foreground">
                        Allow the app to capture photos
                      </div>
                    </div>
                    <Switch
                      checked={settings.privacy.enablePhotoCapture}
                      onCheckedChange={(checked) => handleSettingChange('privacy', 'enablePhotoCapture', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Biometric Data</div>
                      <div className="text-sm text-muted-foreground">
                        Allow the app to use biometric data
                      </div>
                    </div>
                    <Switch
                      checked={settings.privacy.enableBiometricData}
                      onCheckedChange={(checked) => handleSettingChange('privacy', 'enableBiometricData', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Analytics</div>
                      <div className="text-sm text-muted-foreground">
                        Allow the app to collect analytics data
                      </div>
                    </div>
                    <Switch
                      checked={settings.privacy.enableAnalytics}
                      onCheckedChange={(checked) => handleSettingChange('privacy', 'enableAnalytics', checked)}
                    />
                  </div>
                  
                  <div>
                    <Tag className="text-sm font-medium">Data Retention (Days)</Tag>
                    <Slider
                      value={[settings.privacy.dataRetentionDays]}
                      onValueChange={([value]) => handleSettingChange('privacy', 'dataRetentionDays', value)}
                      min={30}
                      max={365}
                      step={30}
                      className="mt-2"
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      Current: {settings.privacy.dataRetentionDays} days
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Permission Settings */}
          {selectedCategory === 'permissions' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5" />
                  <span>Permission Settings</span>
                </CardTitle>
                <CardDescription>
                  Manage app permissions and access controls
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(settings.permissions).map(([key, value]) => {
                    if (key === 'autoGrantPermissions' || key === 'permissionTimeout') return null;
                    
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {key.replace('Permission', '').replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {value === 'GRANTED' ? 'Permission granted' : 
                             value === 'DENIED' ? 'Permission denied' : 'Permission not requested'}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getPermissionIcon(value)}
                          <Badge className={getPermissionBadge(value)}>
                            {value}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Auto Grant Permissions</div>
                      <div className="text-sm text-muted-foreground">
                        Automatically grant permissions when requested
                      </div>
                    </div>
                    <Switch
                      checked={settings.permissions.autoGrantPermissions}
                      onCheckedChange={(checked) => handleSettingChange('permissions', 'autoGrantPermissions', checked)}
                    />
                  </div>
                  
                  <div>
                    <Tag className="text-sm font-medium">Permission Timeout (seconds)</Tag>
                    <Slider
                      value={[settings.permissions.permissionTimeout]}
                      onValueChange={([value]) => handleSettingChange('permissions', 'permissionTimeout', value)}
                      min={5}
                      max={60}
                      step={5}
                      className="mt-2"
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      Current: {settings.permissions.permissionTimeout} seconds
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Settings */}
          {selectedCategory === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure security preferences and authentication
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Tag className="text-sm font-medium">Security Level</Tag>
                    <Select
                      value={settings.security.securityLevel}
                      onValueChange={(value) => handleSettingChange('security', 'securityLevel', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="MAXIMUM">Maximum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Two-Factor Authentication</div>
                      <div className="text-sm text-muted-foreground">
                        Enable two-factor authentication
                      </div>
                    </div>
                    <Switch
                      checked={settings.security.enableTwoFactor}
                      onCheckedChange={(checked) => handleSettingChange('security', 'enableTwoFactor', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Biometric Authentication</div>
                      <div className="text-sm text-muted-foreground">
                        Use biometric authentication
                      </div>
                    </div>
                    <Switch
                      checked={settings.security.enableBiometricAuth}
                      onCheckedChange={(checked) => handleSettingChange('security', 'enableBiometricAuth', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Device Lock</div>
                      <div className="text-sm text-muted-foreground">
                        Enable device lock
                      </div>
                    </div>
                    <Switch
                      checked={settings.security.enableDeviceLock}
                      onCheckedChange={(checked) => handleSettingChange('security', 'enableDeviceLock', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Auto Lock</div>
                      <div className="text-sm text-muted-foreground">
                        Automatically lock device
                      </div>
                    </div>
                    <Switch
                      checked={settings.security.enableAutoLock}
                      onCheckedChange={(checked) => handleSettingChange('security', 'enableAutoLock', checked)}
                    />
                  </div>
                  
                  <div>
                    <Tag className="text-sm font-medium">Auto Lock Timeout (minutes)</Tag>
                    <Slider
                      value={[settings.security.autoLockTimeout]}
                      onValueChange={([value]) => handleSettingChange('security', 'autoLockTimeout', value)}
                      min={1}
                      max={60}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      Current: {settings.security.autoLockTimeout} minutes
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Fraud Detection</div>
                      <div className="text-sm text-muted-foreground">
                        Enable fraud detection
                      </div>
                    </div>
                    <Switch
                      checked={settings.security.enableFraudDetection}
                      onCheckedChange={(checked) => handleSettingChange('security', 'enableFraudDetection', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Risk Assessment</div>
                      <div className="text-sm text-muted-foreground">
                        Enable risk assessment
                      </div>
                    </div>
                    <Switch
                      checked={settings.security.enableRiskAssessment}
                      onCheckedChange={(checked) => handleSettingChange('security', 'enableRiskAssessment', checked)}
                    />
                  </div>
                  
                  <div>
                    <Tag className="text-sm font-medium">Risk Threshold (%)</Tag>
                    <Slider
                      value={[settings.security.riskThreshold]}
                      onValueChange={([value]) => handleSettingChange('security', 'riskThreshold', value)}
                      min={0}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      Current: {settings.security.riskThreshold}%
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Encryption</div>
                      <div className="text-sm text-muted-foreground">
                        Enable data encryption
                      </div>
                    </div>
                    <Switch
                      checked={settings.security.enableEncryption}
                      onCheckedChange={(checked) => handleSettingChange('security', 'enableEncryption', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Secure Storage</div>
                      <div className="text-sm text-muted-foreground">
                        Enable secure storage
                      </div>
                    </div>
                    <Switch
                      checked={settings.security.enableSecureStorage}
                      onCheckedChange={(checked) => handleSettingChange('security', 'enableSecureStorage', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Device Settings */}
          {selectedCategory === 'device' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5" />
                  <span>Device Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure device-related security settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Device Registration</div>
                      <div className="text-sm text-muted-foreground">
                        Enable device registration
                      </div>
                    </div>
                    <Switch
                      checked={settings.device.enableDeviceRegistration}
                      onCheckedChange={(checked) => handleSettingChange('device', 'enableDeviceRegistration', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Device Fingerprinting</div>
                      <div className="text-sm text-muted-foreground">
                        Enable device fingerprinting
                      </div>
                    </div>
                    <Switch
                      checked={settings.device.enableDeviceFingerprinting}
                      onCheckedChange={(checked) => handleSettingChange('device', 'enableDeviceFingerprinting', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Hardware Fingerprinting</div>
                      <div className="text-sm text-muted-foreground">
                        Enable hardware fingerprinting
                      </div>
                    </div>
                    <Switch
                      checked={settings.device.enableHardwareFingerprinting}
                      onCheckedChange={(checked) => handleSettingChange('device', 'enableHardwareFingerprinting', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Browser Fingerprinting</div>
                      <div className="text-sm text-muted-foreground">
                        Enable browser fingerprinting
                      </div>
                    </div>
                    <Switch
                      checked={settings.device.enableBrowserFingerprinting}
                      onCheckedChange={(checked) => handleSettingChange('device', 'enableBrowserFingerprinting', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Network Fingerprinting</div>
                      <div className="text-sm text-muted-foreground">
                        Enable network fingerprinting
                      </div>
                    </div>
                    <Switch
                      checked={settings.device.enableNetworkFingerprinting}
                      onCheckedChange={(checked) => handleSettingChange('device', 'enableNetworkFingerprinting', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Canvas Fingerprinting</div>
                      <div className="text-sm text-muted-foreground">
                        Enable canvas fingerprinting
                      </div>
                    </div>
                    <Switch
                      checked={settings.device.enableCanvasFingerprinting}
                      onCheckedChange={(checked) => handleSettingChange('device', 'enableCanvasFingerprinting', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">WebGL Fingerprinting</div>
                      <div className="text-sm text-muted-foreground">
                        Enable WebGL fingerprinting
                      </div>
                    </div>
                    <Switch
                      checked={settings.device.enableWebGLFingerprinting}
                      onCheckedChange={(checked) => handleSettingChange('device', 'enableWebGLFingerprinting', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Audio Fingerprinting</div>
                      <div className="text-sm text-muted-foreground">
                        Enable audio fingerprinting
                      </div>
                    </div>
                    <Switch
                      checked={settings.device.enableAudioFingerprinting}
                      onCheckedChange={(checked) => handleSettingChange('device', 'enableAudioFingerprinting', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Font Fingerprinting</div>
                      <div className="text-sm text-muted-foreground">
                        Enable font fingerprinting
                      </div>
                    </div>
                    <Switch
                      checked={settings.device.enableFontFingerprinting}
                      onCheckedChange={(checked) => handleSettingChange('device', 'enableFontFingerprinting', checked)}
                    />
                  </div>
                  
                  <div>
                    <Tag className="text-sm font-medium">Max Devices</Tag>
                    <Slider
                      value={[settings.device.maxDevices]}
                      onValueChange={([value]) => handleSettingChange('device', 'maxDevices', value)}
                      min={1}
                      max={10}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      Current: {settings.device.maxDevices} devices
                    </div>
                  </div>
                  
                  <div>
                    <Tag className="text-sm font-medium">Device Timeout (minutes)</Tag>
                    <Slider
                      value={[settings.device.deviceTimeout]}
                      onValueChange={([value]) => handleSettingChange('device', 'deviceTimeout', value)}
                      min={5}
                      max={120}
                      step={5}
                      className="mt-2"
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      Current: {settings.device.deviceTimeout} minutes
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notification Settings */}
          {selectedCategory === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notification Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Push Notifications</div>
                      <div className="text-sm text-muted-foreground">
                        Enable push notifications
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.enablePushNotifications}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'enablePushNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Email Notifications</div>
                      <div className="text-sm text-muted-foreground">
                        Enable email notifications
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.enableEmailNotifications}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'enableEmailNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">SMS Notifications</div>
                      <div className="text-sm text-muted-foreground">
                        Enable SMS notifications
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.enableSMSNotifications}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'enableSMSNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">In-App Notifications</div>
                      <div className="text-sm text-muted-foreground">
                        Enable in-app notifications
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.enableInAppNotifications}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'enableInAppNotifications', checked)}
                    />
                  </div>
                  
                  <div>
                    <Tag className="text-sm font-medium">Notification Frequency</Tag>
                    <Select
                      value={settings.notifications.notificationFrequency}
                      onValueChange={(value) => handleSettingChange('notifications', 'notificationFrequency', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IMMEDIATE">Immediate</SelectItem>
                        <SelectItem value="HOURLY">Hourly</SelectItem>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Security Alerts</div>
                      <div className="text-sm text-muted-foreground">
                        Enable security alerts
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.enableSecurityAlerts}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'enableSecurityAlerts', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Fraud Warnings</div>
                      <div className="text-sm text-muted-foreground">
                        Enable fraud warnings
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.enableFraudWarnings}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'enableFraudWarnings', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">System Updates</div>
                      <div className="text-sm text-muted-foreground">
                        Enable system update notifications
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.enableSystemUpdates}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'enableSystemUpdates', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Marketing Emails</div>
                      <div className="text-sm text-muted-foreground">
                        Enable marketing emails
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.enableMarketingEmails}
                      onCheckedChange={(checked) => handleSettingChange('notifications', 'enableMarketingEmails', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Settings */}
          {selectedCategory === 'data' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Data Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure data management and storage preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Data Sync</div>
                      <div className="text-sm text-muted-foreground">
                        Enable data synchronization
                      </div>
                    </div>
                    <Switch
                      checked={settings.data.enableDataSync}
                      onCheckedChange={(checked) => handleSettingChange('data', 'enableDataSync', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Cloud Backup</div>
                      <div className="text-sm text-muted-foreground">
                        Enable cloud backup
                      </div>
                    </div>
                    <Switch
                      checked={settings.data.enableCloudBackup}
                      onCheckedChange={(checked) => handleSettingChange('data', 'enableCloudBackup', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Local Backup</div>
                      <div className="text-sm text-muted-foreground">
                        Enable local backup
                      </div>
                    </div>
                    <Switch
                      checked={settings.data.enableLocalBackup}
                      onCheckedChange={(checked) => handleSettingChange('data', 'enableLocalBackup', checked)}
                    />
                  </div>
                  
                  <div>
                    <Tag className="text-sm font-medium">Backup Frequency</Tag>
                    <Select
                      value={settings.data.backupFrequency}
                      onValueChange={(value) => handleSettingChange('data', 'backupFrequency', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Data Compression</div>
                      <div className="text-sm text-muted-foreground">
                        Enable data compression
                      </div>
                    </div>
                    <Switch
                      checked={settings.data.enableDataCompression}
                      onCheckedChange={(checked) => handleSettingChange('data', 'enableDataCompression', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Data Encryption</div>
                      <div className="text-sm text-muted-foreground">
                        Enable data encryption
                      </div>
                    </div>
                    <Switch
                      checked={settings.data.enableDataEncryption}
                      onCheckedChange={(checked) => handleSettingChange('data', 'enableDataEncryption', checked)}
                    />
                  </div>
                  
                  <div>
                    <Tag className="text-sm font-medium">Max Storage Size (MB)</Tag>
                    <Slider
                      value={[settings.data.maxStorageSize]}
                      onValueChange={([value]) => handleSettingChange('data', 'maxStorageSize', value)}
                      min={100}
                      max={10000}
                      step={100}
                      className="mt-2"
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      Current: {settings.data.maxStorageSize} MB
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Data Export</div>
                      <div className="text-sm text-muted-foreground">
                        Enable data export
                      </div>
                    </div>
                    <Switch
                      checked={settings.data.enableDataExport}
                      onCheckedChange={(checked) => handleSettingChange('data', 'enableDataExport', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Data Import</div>
                      <div className="text-sm text-muted-foreground">
                        Enable data import
                      </div>
                    </div>
                    <Switch
                      checked={settings.data.enableDataImport}
                      onCheckedChange={(checked) => handleSettingChange('data', 'enableDataImport', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleResetSettings}
            disabled={isSaving}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExportSettings}
            disabled={isSaving}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button
            variant="outline"
            onClick={() => document.getElementById('import-settings')?.click()}
            disabled={isSaving}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          
          <input
            id="import-settings"
            type="file"
            accept=".json"
            onChange={handleImportSettings}
            className="hidden"
          />
        </div>
        
        <Button
          onClick={handleSaveSettings}
          disabled={isSaving || !hasUnsavedChanges}
        >
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* Save Error */}
      {saveError && (
        <div className="text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-3 rounded">
          {saveError}
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Security Settings Help</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium">What are Security Settings?</div>
                  <div className="text-sm text-muted-foreground">
                    Security settings allow you to configure privacy, permissions, security, device, notifications, and data preferences.
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">How to Configure Settings</div>
                  <div className="text-sm text-muted-foreground">
                    �?Use the category tabs to navigate between different settings<br/>
                    �?Toggle switches to enable/disable features<br/>
                    �?Use sliders to adjust values<br/>
                    �?Save your changes when done
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Troubleshooting</div>
                  <div className="text-sm text-muted-foreground">
                    �?Check your internet connection<br/>
                    �?Ensure all permissions are granted<br/>
                    �?Restart the app if needed<br/>
                    �?Contact support for persistent issues
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
