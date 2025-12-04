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

const replacements = [
    // Use more aggressive regex to match the line starting with case ... return
    { regex: /case 'LOCATION_SPOOFING':\s*return\s*['"].*?['"]?;?/g, replacement: "case 'LOCATION_SPOOFING': return '📍';" },
    { regex: /case 'TIME_MANIPULATION':\s*return\s*['"].*?['"]?;?/g, replacement: "case 'TIME_MANIPULATION': return '⏰';" },
    { regex: /case 'DEVICE_SHARING':\s*return\s*['"].*?['"]?;?/g, replacement: "case 'DEVICE_SHARING': return '📱';" },
    { regex: /case 'MULTIPLE_DEVICES':\s*return\s*['"].*?['"]?;?/g, replacement: "case 'MULTIPLE_DEVICES': return '💻';" },
    { regex: /case 'SUSPICIOUS_PATTERN':\s*return\s*['"].*?['"]?;?/g, replacement: "case 'SUSPICIOUS_PATTERN': return '⚠️';" },
    { regex: /case 'QR_SHARING':\s*return\s*['"].*?['"]?;?/g, replacement: "case 'QR_SHARING': return '📸';" },

    // StudentTracking.tsx specific
    { regex: /case 'PRESENT':\s*return\s*['"].*?['"]?;?/g, replacement: "case 'PRESENT': return '✅';" },
    { regex: /case 'ABSENT':\s*return\s*['"].*?['"]?;?/g, replacement: "case 'ABSENT': return '❌';" },
    { regex: /case 'LATE':\s*return\s*['"].*?['"]?;?/g, replacement: "case 'LATE': return '⏰';" },

    // Catch-all default (be careful with this one, ensure it's in the right context or use specific file logic if needed)
    // The error showed "default: return '?;" so we match that pattern
    { regex: /default:\s*return\s*['"].*?['"]?;?/g, replacement: "default: return '❓';" }
];

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`Processing ${file}...`);
        let content = fs.readFileSync(filePath, 'utf8');

        replacements.forEach(({ regex, replacement }) => {
            // Check if the file actually contains the target case before replacing to avoid false positives on "default"
            if (regex.test(content)) {
                content = content.replace(regex, replacement);
            }
        });

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed ${file}`);
    } else {
        console.log(`File not found: ${file}`);
    }
});
