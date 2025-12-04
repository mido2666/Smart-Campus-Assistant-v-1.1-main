import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Shield,
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
interface FraudWarning {
  id: string;
  type: 'LOCATION_FRAUD' | 'DEVICE_FRAUD' | 'PHOTO_FRAUD' | 'BEHAVIOR_FRAUD' | 'NETWORK_FRAUD';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  timestamp: Date;
  isResolved: boolean;
  isAcknowledged: boolean;
  riskScore: number;
  evidence: FraudEvidence[];
  actions: FraudAction[];
  recommendations: FraudRecommendation[];
  status: 'ACTIVE' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
}

interface FraudEvidence {
  id: string;
  type: 'LOCATION' | 'DEVICE' | 'PHOTO' | 'BEHAVIOR' | 'NETWORK';
  description: string;
  value: string;
  confidence: number;
  timestamp: Date;
  isVerified: boolean;
}

interface FraudAction {
  id: string;
  title: string;
  description: string;
  type: 'ACKNOWLEDGE' | 'DISMISS' | 'APPEAL' | 'CONTACT_SUPPORT';
  isEnabled: boolean;
  isCompleted: boolean;
  result?: string;
}

interface FraudRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  isImplemented: boolean;
  impact: string;
}

interface FraudWarningProps {
  onWarningUpdate: (warning: FraudWarning) => void;
  onActionComplete: (warningId: string, actionId: string) => void;
  onRecommendationAction: (warningId: string, recommendationId: string) => void;
  enableRealTimeUpdates: boolean;
  updateInterval: number;
  enableNotifications: boolean;
  enableAutoResolution: boolean;
  riskThreshold: number;
  severityFilter: string[];
  typeFilter: string[];
}

export function FraudWarning({
  onWarningUpdate,
  onActionComplete,
  onRecommendationAction,
  enableRealTimeUpdates,
  updateInterval,
  enableNotifications,
  enableAutoResolution,
  riskThreshold,
  severityFilter,
  typeFilter
}: FraudWarningProps) {
  const [fraudWarnings, setFraudWarnings] = useState<FraudWarning[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'ONLINE' | 'OFFLINE' | 'POOR'>('ONLINE');
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [signalStrength, setSignalStrength] = useState(4);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedWarning, setSelectedWarning] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);

  // Initialize fraud warnings
  useEffect(() => {
    loadFraudWarnings();
    startStatusMonitoring();
    
    if (enableRealTimeUpdates) {
      startRealTimeUpdates();
    }
  }, [enableRealTimeUpdates, updateInterval]);

  // Handle warning updates
  useEffect(() => {
    fraudWarnings.forEach(warning => {
      onWarningUpdate(warning);
    });
  }, [fraudWarnings, onWarningUpdate]);

  const loadFraudWarnings = async () => {
    setIsLoading(true);
    try {
      // Mock fraud warnings data
      const warnings: FraudWarning[] = [
        {
          id: 'warning-1',
          type: 'LOCATION_FRAUD',
          severity: 'HIGH',
          title: 'Suspicious Location Activity',
          description: 'Your location appears to be outside the expected area for this attendance session',
          timestamp: new Date(),
          isResolved: false,
          isAcknowledged: false,
          riskScore: 85,
          evidence: [
            {
              id: 'evidence-1',
              type: 'LOCATION',
              description: 'Location coordinates',
              value: '40.7128, -74.0060',
              confidence: 95,
              timestamp: new Date(),
              isVerified: true
            },
            {
              id: 'evidence-2',
              type: 'LOCATION',
              description: 'Distance from expected location',
              value: '2.5 km',
              confidence: 90,
              timestamp: new Date(),
              isVerified: true
            }
          ],
          actions: [
            {
              id: 'action-1',
              title: 'Acknowledge Warning',
              description: 'Acknowledge that you understand the warning',
              type: 'ACKNOWLEDGE',
              isEnabled: true,
              isCompleted: false
            },
            {
              id: 'action-2',
              title: 'Appeal Decision',
              description: 'Appeal the fraud detection decision',
              type: 'APPEAL',
              isEnabled: true,
              isCompleted: false
            },
            {
              id: 'action-3',
              title: 'Contact Support',
              description: 'Contact support for assistance',
              type: 'CONTACT_SUPPORT',
              isEnabled: true,
              isCompleted: false
            }
          ],
          recommendations: [
            {
              id: 'rec-1',
              title: 'Verify Location',
              description: 'Double-check your current location and ensure you are in the correct area',
              priority: 'HIGH',
              category: 'Location',
              isImplemented: false,
              impact: 'Reduces location fraud risk by 30%'
            },
            {
              id: 'rec-2',
              title: 'Enable High Accuracy GPS',
              description: 'Enable high accuracy GPS mode for better location precision',
              priority: 'MEDIUM',
              category: 'Location',
              isImplemented: false,
              impact: 'Improves location accuracy by 20%'
            }
          ],
          status: 'ACTIVE'
        },
        {
          id: 'warning-2',
          type: 'DEVICE_FRAUD',
          severity: 'MEDIUM',
          title: 'Device Fingerprint Mismatch',
          description: 'Your device fingerprint does not match the registered device',
          timestamp: new Date(),
          isResolved: false,
          isAcknowledged: false,
          riskScore: 65,
          evidence: [
            {
              id: 'evidence-3',
              type: 'DEVICE',
              description: 'Device fingerprint',
              value: 'fp-123456789',
              confidence: 85,
              timestamp: new Date(),
              isVerified: true
            },
            {
              id: 'evidence-4',
              type: 'DEVICE',
              description: 'Browser information',
              value: 'Chrome 120.0.0.0',
              confidence: 80,
              timestamp: new Date(),
              isVerified: true
            }
          ],
          actions: [
            {
              id: 'action-4',
              title: 'Acknowledge Warning',
              description: 'Acknowledge that you understand the warning',
              type: 'ACKNOWLEDGE',
              isEnabled: true,
              isCompleted: false
            },
            {
              id: 'action-5',
              title: 'Update Device Registration',
              description: 'Update your device registration',
              type: 'CONTACT_SUPPORT',
              isEnabled: true,
              isCompleted: false
            }
          ],
          recommendations: [
            {
              id: 'rec-3',
              title: 'Update Device Registration',
              description: 'Update your device registration to match your current device',
              priority: 'HIGH',
              category: 'Device',
              isImplemented: false,
              impact: 'Reduces device fraud risk by 40%'
            }
          ],
          status: 'ACTIVE'
        }
      ];

      setFraudWarnings(warnings);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load fraud warnings:', error);
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
      loadFraudWarnings();
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

  const handleActionComplete = (warningId: string, actionId: string) => {
    onActionComplete(warningId, actionId);
    
    // Update warning status
    setFraudWarnings(prev => prev.map(warning => 
      warning.id === warningId ? {
        ...warning,
        actions: warning.actions.map(action => 
          action.id === actionId ? { ...action, isCompleted: true } : action
        ),
        isAcknowledged: actionId === 'action-1' || warning.isAcknowledged,
        status: actionId === 'action-2' ? 'INVESTIGATING' : warning.status
      } : warning
    ));
  };

  const handleRecommendationAction = (warningId: string, recommendationId: string) => {
    onRecommendationAction(warningId, recommendationId);
    
    // Update recommendation status
    setFraudWarnings(prev => prev.map(warning => 
      warning.id === warningId ? {
        ...warning,
        recommendations: warning.recommendations.map(rec => 
          rec.id === recommendationId ? { ...rec, isImplemented: true } : rec
        )
      } : warning
    ));
  };

  const handleDismissWarning = (warningId: string) => {
    setFraudWarnings(prev => prev.map(warning => 
      warning.id === warningId ? {
        ...warning,
        status: 'DISMISSED',
        isResolved: true
      } : warning
    ));
  };

  const handleResolveWarning = (warningId: string) => {
    setFraudWarnings(prev => prev.map(warning => 
      warning.id === warningId ? {
        ...warning,
        status: 'RESOLVED',
        isResolved: true
      } : warning
    ));
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'LOW': return <Info className="h-4 w-4 text-blue-600" />;
      case 'MEDIUM': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'HIGH': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'CRITICAL': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'text-blue-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'HIGH': return 'text-orange-600';
      case 'CRITICAL': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'bg-blue-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'HIGH': return 'bg-orange-500';
      case 'CRITICAL': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'LOCATION_FRAUD': return <MapPin className="h-4 w-4 text-blue-600" />;
      case 'DEVICE_FRAUD': return <Smartphone className="h-4 w-4 text-green-600" />;
      case 'PHOTO_FRAUD': return <Camera className="h-4 w-4 text-purple-600" />;
      case 'BEHAVIOR_FRAUD': return <Activity className="h-4 w-4 text-orange-600" />;
      case 'NETWORK_FRAUD': return <Wifi className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'LOCATION_FRAUD': return 'text-blue-600';
      case 'DEVICE_FRAUD': return 'text-green-600';
      case 'PHOTO_FRAUD': return 'text-purple-600';
      case 'BEHAVIOR_FRAUD': return 'text-orange-600';
      case 'NETWORK_FRAUD': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'LOCATION_FRAUD': return 'bg-blue-500';
      case 'DEVICE_FRAUD': return 'bg-green-500';
      case 'PHOTO_FRAUD': return 'bg-purple-500';
      case 'BEHAVIOR_FRAUD': return 'bg-orange-500';
      case 'NETWORK_FRAUD': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'INVESTIGATING': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'RESOLVED': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'DISMISSED': return <XCircle className="h-4 w-4 text-gray-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-red-600';
      case 'INVESTIGATING': return 'text-yellow-600';
      case 'RESOLVED': return 'text-green-600';
      case 'DISMISSED': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-red-500';
      case 'INVESTIGATING': return 'bg-yellow-500';
      case 'RESOLVED': return 'bg-green-500';
      case 'DISMISSED': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'HIGH': return 'text-orange-600';
      case 'CRITICAL': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-green-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'HIGH': return 'bg-orange-500';
      case 'CRITICAL': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading fraud warnings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <h2 className="text-xl font-semibold">Fraud Warnings</h2>
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
          <Shield className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium">{fraudWarnings.length} warnings</span>
        </div>
      </div>

      {/* Fraud Warnings List */}
      {fraudWarnings.length > 0 ? (
        <div className="space-y-4">
          {fraudWarnings.map((warning) => (
            <Card key={warning.id}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getSeverityIcon(warning.severity)}
                  <span>{warning.title}</span>
                </CardTitle>
                <CardDescription>
                  {warning.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Warning Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-medium">Type</div>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(warning.type)}
                        <Badge className={getTypeBadge(warning.type)}>
                          {warning.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Severity</div>
                      <div className="flex items-center space-x-2">
                        {getSeverityIcon(warning.severity)}
                        <Badge className={getSeverityBadge(warning.severity)}>
                          {warning.severity}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Status</div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(warning.status)}
                        <Badge className={getStatusBadge(warning.status)}>
                          {warning.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Risk Score */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Risk Score</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={warning.riskScore} className="w-20 h-2" />
                      <span className="text-sm font-medium">{warning.riskScore}%</span>
                    </div>
                  </div>

                  {/* Evidence */}
                  {warning.evidence.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Evidence</div>
                      <div className="space-y-2">
                        {warning.evidence.map((evidence) => (
                          <div key={evidence.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              <span className="text-sm font-medium">{evidence.description}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-muted-foreground">{evidence.value}</span>
                              <Badge variant="outline">{evidence.confidence}%</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {warning.actions.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Actions</div>
                      <div className="flex flex-wrap gap-2">
                        {warning.actions.map((action) => (
                          <Button
                            key={action.id}
                            size="sm"
                            variant={action.type === 'ACKNOWLEDGE' ? 'default' : 'outline'}
                            onClick={() => handleActionComplete(warning.id, action.id)}
                            disabled={action.isCompleted || !action.isEnabled}
                          >
                            {action.isCompleted ? 'Completed' : action.title}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {warning.recommendations.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Recommendations</div>
                      <div className="space-y-2">
                        {warning.recommendations.map((recommendation) => (
                          <div key={recommendation.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                            <div className="flex-1">
                              <div className="font-medium">{recommendation.title}</div>
                              <div className="text-sm text-muted-foreground">{recommendation.description}</div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getPriorityBadge(recommendation.priority)}>
                                {recommendation.priority}
                              </Badge>
                              <Button
                                size="sm"
                                onClick={() => handleRecommendationAction(warning.id, recommendation.id)}
                                disabled={recommendation.isImplemented}
                              >
                                {recommendation.isImplemented ? 'Implemented' : 'Implement'}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warning Actions */}
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDismissWarning(warning.id)}
                      disabled={warning.status === 'DISMISSED'}
                    >
                      Dismiss
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveWarning(warning.id)}
                      disabled={warning.status === 'RESOLVED'}
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Fraud Warnings</h3>
            <p className="text-muted-foreground">
              Your attendance security is currently secure. No fraud warnings detected.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Fraud Warning Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Real-time Updates</span>
                  <Switch
                    checked={enableRealTimeUpdates}
                    onCheckedChange={(checked) => {
                      // Handle real-time updates setting change
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Notifications</span>
                  <Switch
                    checked={enableNotifications}
                    onCheckedChange={(checked) => {
                      // Handle notifications setting change
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Auto Resolution</span>
                  <Switch
                    checked={enableAutoResolution}
                    onCheckedChange={(checked) => {
                      // Handle auto resolution setting change
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
              <CardTitle>Fraud Warning Help</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium">What are Fraud Warnings?</div>
                  <div className="text-sm text-muted-foreground">
                    Fraud warnings alert you to suspicious activity that may indicate fraudulent attendance attempts.
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">How to Respond</div>
                  <div className="text-sm text-muted-foreground">
                    �?Acknowledge warnings you understand<br/>
                    �?Appeal decisions you believe are incorrect<br/>
                    �?Contact support for assistance<br/>
                    �?Follow recommendations to improve security
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Troubleshooting</div>
                  <div className="text-sm text-muted-foreground">
                    �?Check your location and device settings<br/>
                    �?Ensure you are in the correct area<br/>
                    �?Contact support if warnings persist<br/>
                    �?Follow security recommendations
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
