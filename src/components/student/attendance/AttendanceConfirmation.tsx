import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
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
interface AttendanceConfirmation {
  id: string;
  sessionId: string;
  courseId: number;
  courseName: string;
  studentId: string;
  studentName: string;
  timestamp: Date;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'REVIEW';
  securityScore: number;
  verificationSteps: VerificationStep[];
  securitySummary: SecuritySummary;
  nextSteps: NextStep[];
  feedback: AttendanceFeedback;
}

interface VerificationStep {
  id: string;
  name: string;
  status: 'COMPLETED' | 'FAILED' | 'PENDING' | 'SKIPPED';
  score: number;
  details: string;
  timestamp: Date;
  icon: string;
  isRequired: boolean;
}

interface SecuritySummary {
  overallScore: number;
  locationScore: number;
  deviceScore: number;
  photoScore: number;
  networkScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

interface NextStep {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  isCompleted: boolean;
  action?: () => void;
}

interface AttendanceFeedback {
  message: string;
  type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  suggestions: string[];
  contactInfo?: {
    email: string;
    phone: string;
    supportHours: string;
  };
}

interface AttendanceConfirmationProps {
  onConfirmationComplete: (confirmation: AttendanceConfirmation) => void;
  onNextStepAction: (stepId: string) => void;
  onFeedbackAction: (action: string) => void;
  enableRealTimeUpdates: boolean;
  updateInterval: number;
  enableNotifications: boolean;
  enableAutoSave: boolean;
  securityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'MAXIMUM';
  sessionId: string;
  courseId: number;
  courseName: string;
  studentId: string;
  studentName: string;
}

export function AttendanceConfirmation({
  onConfirmationComplete,
  onNextStepAction,
  onFeedbackAction,
  enableRealTimeUpdates,
  updateInterval,
  enableNotifications,
  enableAutoSave,
  securityLevel,
  sessionId,
  courseId,
  courseName,
  studentId,
  studentName
}: AttendanceConfirmationProps) {
  const [confirmation, setConfirmation] = useState<AttendanceConfirmation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'ONLINE' | 'OFFLINE' | 'POOR'>('ONLINE');
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [signalStrength, setSignalStrength] = useState(4);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [selectedNextStep, setSelectedNextStep] = useState<string | null>(null);

  // Initialize confirmation
  useEffect(() => {
    loadConfirmation();
    startStatusMonitoring();
    
    if (enableRealTimeUpdates) {
      startRealTimeUpdates();
    }
  }, [enableRealTimeUpdates, updateInterval]);

  // Handle confirmation updates
  useEffect(() => {
    if (confirmation) {
      onConfirmationComplete(confirmation);
    }
  }, [confirmation, onConfirmationComplete]);

  const loadConfirmation = async () => {
    setIsLoading(true);
    try {
      // Mock confirmation data
      const confirmationData: AttendanceConfirmation = {
        id: 'confirmation-' + Date.now(),
        sessionId,
        courseId,
        courseName,
        studentId,
        studentName,
        timestamp: new Date(),
        status: 'SUCCESS',
        securityScore: 85,
        verificationSteps: [
          {
            id: 'step-1',
            name: 'QR Code Verification',
            status: 'COMPLETED',
            score: 95,
            details: 'QR code scanned successfully',
            timestamp: new Date(),
            icon: 'QrCode',
            isRequired: true
          },
          {
            id: 'step-2',
            name: 'Location Verification',
            status: 'COMPLETED',
            score: 80,
            details: 'Location verified within allowed radius',
            timestamp: new Date(),
            icon: 'MapPin',
            isRequired: true
          },
          {
            id: 'step-3',
            name: 'Device Verification',
            status: 'COMPLETED',
            score: 90,
            details: 'Device fingerprint verified',
            timestamp: new Date(),
            icon: 'Smartphone',
            isRequired: true
          },
          {
            id: 'step-4',
            name: 'Photo Verification',
            status: 'COMPLETED',
            score: 85,
            details: 'Photo captured and verified',
            timestamp: new Date(),
            icon: 'Camera',
            isRequired: false
          },
          {
            id: 'step-5',
            name: 'Final Confirmation',
            status: 'COMPLETED',
            score: 90,
            details: 'All verification steps completed',
            timestamp: new Date(),
            icon: 'CheckCircle',
            isRequired: true
          }
        ],
        securitySummary: {
          overallScore: 85,
          locationScore: 80,
          deviceScore: 90,
          photoScore: 85,
          networkScore: 75,
          riskLevel: 'LOW',
          warnings: [
            'Location accuracy could be improved',
            'Network signal is weak'
          ],
          errors: [],
          recommendations: [
            'Enable high accuracy GPS mode',
            'Move to an area with better network signal'
          ]
        },
        nextSteps: [
          {
            id: 'next-1',
            title: 'Review Attendance Record',
            description: 'Check your attendance record in the system',
            priority: 'HIGH',
            category: 'Attendance',
            isCompleted: false
          },
          {
            id: 'next-2',
            title: 'Update Device Registration',
            description: 'Update your device registration for better security',
            priority: 'MEDIUM',
            category: 'Security',
            isCompleted: false
          },
          {
            id: 'next-3',
            title: 'Contact Support',
            description: 'Contact support if you have any questions',
            priority: 'LOW',
            category: 'Support',
            isCompleted: false
          }
        ],
        feedback: {
          message: 'Attendance recorded successfully! Your attendance has been verified and recorded.',
          type: 'SUCCESS',
          suggestions: [
            'Keep your device charged for future attendance',
            'Ensure you are in the correct location',
            'Contact support if you have any questions'
          ],
          contactInfo: {
            email: 'support@university.edu',
            phone: '+1 (555) 123-4567',
            supportHours: '9 AM - 5 PM, Monday - Friday'
          }
        }
      };

      setConfirmation(confirmationData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load confirmation:', error);
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
      loadConfirmation();
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

  const handleNextStepAction = (stepId: string) => {
    onNextStepAction(stepId);
    
    // Update step status
    if (confirmation) {
      const updatedNextSteps = confirmation.nextSteps.map(step => 
        step.id === stepId ? { ...step, isCompleted: true } : step
      );
      
      setConfirmation(prev => prev ? {
        ...prev,
        nextSteps: updatedNextSteps
      } : null);
    }
  };

  const handleFeedbackAction = (action: string) => {
    onFeedbackAction(action);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Mock submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (confirmation) {
        setConfirmation(prev => prev ? {
          ...prev,
          status: 'SUCCESS'
        } : null);
      }
    } catch (error) {
      console.error('Submission failed:', error);
      setSubmitError('Failed to submit attendance confirmation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'FAILED': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'REVIEW': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'text-green-600';
      case 'FAILED': return 'text-red-600';
      case 'PENDING': return 'text-yellow-600';
      case 'REVIEW': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-green-500';
      case 'FAILED': return 'bg-red-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'REVIEW': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStepIcon = (icon: string) => {
    switch (icon) {
      case 'QrCode': return <QrCode className="h-4 w-4 text-blue-600" />;
      case 'MapPin': return <MapPin className="h-4 w-4 text-green-600" />;
      case 'Smartphone': return <Smartphone className="h-4 w-4 text-purple-600" />;
      case 'Camera': return <Camera className="h-4 w-4 text-orange-600" />;
      case 'CheckCircle': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'FAILED': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'SKIPPED': return <Minus className="h-4 w-4 text-gray-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600';
      case 'FAILED': return 'text-red-600';
      case 'PENDING': return 'text-yellow-600';
      case 'SKIPPED': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStepStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500';
      case 'FAILED': return 'bg-red-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'SKIPPED': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
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
          <span>Loading confirmation...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-semibold">Attendance Confirmation</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
            aria-label="Open confirmation settings"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp(true)}
            aria-label="Open help and information"
          >
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
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
          <span className="text-sm font-medium">{securityLevel}</span>
        </div>
      </div>

      {/* Confirmation Status */}
      {confirmation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {getStatusIcon(confirmation.status)}
              <span>Confirmation Status</span>
            </CardTitle>
            <CardDescription>
              {confirmation.courseName} - {confirmation.timestamp.toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Security Score</div>
                  <div className="text-sm text-muted-foreground">
                    Last updated: {confirmation.timestamp.toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={confirmation.securityScore} className="w-20 h-2" />
                  <span className="text-sm font-medium">{confirmation.securityScore}%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Student ID</div>
                  <div className="text-sm text-muted-foreground">{confirmation.studentId}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Course</div>
                  <div className="text-sm text-muted-foreground">{confirmation.courseName}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Steps */}
      {confirmation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Verification Steps</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {confirmation.verificationSteps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:border-gray-300"
                  onClick={() => setSelectedStep(step.id)}
                  aria-label={`View details for ${step.name}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {getStepIcon(step.icon)}
                    </div>
                    <div>
                      <div className="font-medium">{step.name}</div>
                      <div className="text-sm text-muted-foreground">{step.details}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStepStatusBadge(step.status)}>
                      {step.status}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      {getStepStatusIcon(step.status)}
                      <span className="text-sm font-medium">{step.score}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Summary */}
      {confirmation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <span>Security Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Score</span>
                <div className="flex items-center space-x-2">
                  <Progress value={confirmation.securitySummary.overallScore} className="w-20 h-2" />
                  <span className="text-sm font-medium">{confirmation.securitySummary.overallScore}%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm font-medium">Location Score</div>
                  <div className="text-sm text-muted-foreground">{confirmation.securitySummary.locationScore}%</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Device Score</div>
                  <div className="text-sm text-muted-foreground">{confirmation.securitySummary.deviceScore}%</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Photo Score</div>
                  <div className="text-sm text-muted-foreground">{confirmation.securitySummary.photoScore}%</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Network Score</div>
                  <div className="text-sm text-muted-foreground">{confirmation.securitySummary.networkScore}%</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Risk Level</span>
                <div className="flex items-center space-x-2">
                  {getRiskIcon(confirmation.securitySummary.riskLevel)}
                  <Badge className={getRiskBadge(confirmation.securitySummary.riskLevel)}>
                    {confirmation.securitySummary.riskLevel}
                  </Badge>
                </div>
              </div>
              
              {confirmation.securitySummary.warnings.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-yellow-600 mb-2">Warnings</div>
                  <div className="space-y-1">
                    {confirmation.securitySummary.warnings.map((warning, index) => (
                      <div key={index} className="text-sm text-yellow-600 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {confirmation.securitySummary.errors.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-red-600 mb-2">Errors</div>
                  <div className="space-y-1">
                    {confirmation.securitySummary.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {confirmation.securitySummary.recommendations.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-blue-600 mb-2">Recommendations</div>
                  <div className="space-y-1">
                    {confirmation.securitySummary.recommendations.map((recommendation, index) => (
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

      {/* Next Steps */}
      {confirmation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Next Steps</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {confirmation.nextSteps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:border-gray-300"
                  onClick={() => setSelectedNextStep(step.id)}
                  aria-label={`View details for ${step.title}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Target className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">{step.title}</div>
                      <div className="text-sm text-muted-foreground">{step.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityBadge(step.priority)}>
                      {step.priority}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.SquarePropagation();
                        handleNextStepAction(step.id);
                      }}
                      disabled={step.isCompleted}
                    >
                      {step.isCompleted ? 'Completed' : 'Complete'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback */}
      {confirmation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-600" />
              <span>Feedback</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm font-medium">{confirmation.feedback.message}</div>
              
              {confirmation.feedback.suggestions.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Suggestions</div>
                  <div className="space-y-1">
                    {confirmation.feedback.suggestions.map((suggestion, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        �?{suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {confirmation.feedback.contactInfo && (
                <div>
                  <div className="text-sm font-medium mb-2">Contact Information</div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                      Email: {confirmation.feedback.contactInfo.email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Phone: {confirmation.feedback.contactInfo.phone}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Hours: {confirmation.feedback.contactInfo.supportHours}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex items-center space-x-2">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || confirmation?.status === 'SUCCESS'}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Confirmation
            </>
          )}
        </Button>
        
        {submitError && (
          <Button
            variant="outline"
            onClick={() => setSubmitError(null)}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Dismiss Error
          </Button>
        )}
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-3 rounded">
          {submitError}
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Confirmation Settings</CardTitle>
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
                  <span className="text-sm font-medium">Auto Save</span>
                  <Switch
                    checked={enableAutoSave}
                    onCheckedChange={(checked) => {
                      // Handle auto save setting change
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
              <CardTitle>Confirmation Help</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium">What is Attendance Confirmation?</div>
                  <div className="text-sm text-muted-foreground">
                    Attendance confirmation shows the results of your attendance verification and provides next steps.
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">How to Complete Next Steps</div>
                  <div className="text-sm text-muted-foreground">
                    �?Review your attendance record<br/>
                    �?Update device registration if needed<br/>
                    �?Contact support for assistance<br/>
                    �?Follow security recommendations
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium">Troubleshooting</div>
                  <div className="text-sm text-muted-foreground">
                    �?Check your internet connection<br/>
                    �?Ensure all verification steps are completed<br/>
                    �?Contact support if issues persist<br/>
                    �?Follow the provided recommendations
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
