const fs = require('fs');
const path = require('path');

const files = [
  'src/components/dashboard/analytics/FraudReports.tsx',
  'src/components/dashboard/attendance/FraudAlerts.tsx',
  'src/components/dashboard/monitoring/StudentTracking.tsx',
  'src/components/dashboard/security/FraudHandling.tsx',
  'src/components/dashboard/security/IncidentManagement.tsx',
  'src/components/dashboard/security/SecurityManagement.tsx',
  'src/components/professor/attendance/FraudAlertPanel.tsx',
  'src/components/professor/attendance/SecurityDashboard.tsx'
];

const lineReplacements = {
  "case 'LOCATION_SPOOFING'": "      case 'LOCATION_SPOOFING': return '📍';",
  "case 'TIME_MANIPULATION'": "      case 'TIME_MANIPULATION': return '⏰';",
  "case 'DEVICE_SHARING'": "      case 'DEVICE_SHARING': return '📱';",
  "case 'MULTIPLE_DEVICES'": "      case 'MULTIPLE_DEVICES': return '💻';",
  "case 'SUSPICIOUS_PATTERN'": "      case 'SUSPICIOUS_PATTERN': return '⚠️';",
  "case 'QR_SHARING'": "      case 'QR_SHARING': return '📸';",
  "case 'PRESENT'": "      case 'PRESENT': return '✅';",
  "case 'ABSENT'": "      case 'ABSENT': return '❌';",
  "case 'LATE'": "      case 'LATE': return '⏰';",
};

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`Processing ${file}...`);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split(/\r?\n/);
      const newLines = lines.map(line => {
        for (const [key, replacement] of Object.entries(lineReplacements)) {
          if (line.includes(key) && line.includes('return')) {
            return replacement;
          }
        }
        // Handle default case specifically if it looks like the corrupted one
        if (line.trim().startsWith('default:') && line.includes('return')) {
          // Only replace if it looks suspicious (contains non-ascii or just to be safe for these specific files)
          // The corrupted default was "default: return '...';"
          return "      default: return '❓';";
        }
        return line;
      });

      fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
      console.log(`Fixed ${file}`);
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  } else {
    console.log(`File not found: ${file}`);
  }
});
