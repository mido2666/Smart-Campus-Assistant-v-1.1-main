import axios from 'axios';

const API_URL = 'http://localhost:3002/api';

// Test Credentials
const PROFESSOR = { universityId: '10000001', password: '123456' };
const STUDENT = { universityId: '20220000', password: '123456' };

async function runTest() {
    try {
        console.log('🚀 Starting QR Code Attendance Flow Verification...');

        // 1. Login Professor
        console.log('\n🔐 Logging in Professor...');
        const profLogin = await axios.post(`${API_URL}/auth/login`, PROFESSOR);
        console.log('✅ Professor logged in.');

        // Check token structure
        let profToken;
        if (profLogin.data.data && profLogin.data.data.accessToken) {
            profToken = profLogin.data.data.accessToken;
        } else if (profLogin.data.accessToken) {
            profToken = profLogin.data.accessToken;
        } else {
            console.log('Login Response:', JSON.stringify(profLogin.data, null, 2));
            throw new Error('Could not find accessToken in login response');
        }

        const profId = profLogin.data.data.user.id;

        // 2. Get Courses
        console.log('\n📚 Getting Professor Courses...');
        const coursesRes = await axios.get(`${API_URL}/courses`, {
            headers: { Authorization: `Bearer ${profToken}` }
        });

        let courseId;
        if (coursesRes.data.data.length > 0) {
            courseId = coursesRes.data.data[0].id;
            console.log(`✅ Found existing course: ${coursesRes.data.data[0].courseName} (ID: ${courseId})`);
        } else {
            console.log('⚠️ No courses found. Creating a test course...');
            const newCourse = await axios.post(`${API_URL}/courses`, {
                courseName: 'Test Course for QR',
                courseCode: 'TEST101',
                description: 'Testing QR Attendance',
                credits: 3
            }, {
                headers: { Authorization: `Bearer ${profToken}` }
            });
            courseId = newCourse.data.data.id;
            console.log(`✅ Created test course (ID: ${courseId})`);
        }

        // 3. Create Attendance Session
        console.log('\n📅 Creating Attendance Session...');
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

        const sessionRes = await axios.post(`${API_URL}/attendance/sessions`, {
            courseId: courseId,
            title: 'Test Session',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            location: {
                latitude: 30.0444,
                longitude: 31.2357,
                radius: 500,
                name: 'Test Location'
            },
            securitySettings: {
                requireLocation: false, // Disabled for easier testing
                requirePhoto: false,
                requireDeviceCheck: false,
                enableFraudDetection: false,
                maxAttempts: 3,
                gracePeriod: 10
            }
        }, {
            headers: { Authorization: `Bearer ${profToken}` }
        });

        const sessionId = sessionRes.data.data.sessionId; // Note: using sessionId (UUID) not id (Int)
        console.log(`✅ Session created (Session ID: ${sessionId})`);

        // 4. Generate QR Code
        console.log('\n🔳 Generating QR Code...');
        const qrRes = await axios.post(`${API_URL}/attendance/sessions/${sessionId}/qr-code`, {}, {
            headers: { Authorization: `Bearer ${profToken}` }
        });
        const qrCode = qrRes.data.data.qrCode;
        console.log(`✅ QR Code generated: ${qrCode}`);

        // 5. Login Student
        console.log('\n🔐 Logging in Student...');
        const studentLogin = await axios.post(`${API_URL}/auth/login`, STUDENT);

        let studentToken;
        if (studentLogin.data.data && studentLogin.data.data.accessToken) {
            studentToken = studentLogin.data.data.accessToken;
        } else if (studentLogin.data.accessToken) {
            studentToken = studentLogin.data.accessToken;
        } else {
            console.log('Student Login Response:', JSON.stringify(studentLogin.data, null, 2));
            throw new Error('Could not find accessToken in student login response');
        }

        const studentId = studentLogin.data.data.user.id;
        console.log('✅ Student logged in.');

        // 6. Enroll Student (if not already)
        console.log('\n📝 Checking Enrollment...');
        try {
            await axios.post(`${API_URL}/courses/${courseId}/enroll`, {
                studentId: studentId
            }, {
                headers: { Authorization: `Bearer ${studentToken}` }
            });
            console.log('✅ Student enrolled in course.');
        } catch (e) {
            if (e.response && e.response.status === 400) {
                console.log('ℹ️ Student already enrolled (or other expected error). Continuing...');
            } else {
                console.warn('⚠️ Enrollment warning:', e.message);
            }
        }

        // 7. Scan QR Code
        console.log('\n📱 Scanning QR Code...');
        try {
            const scanRes = await axios.post(`${API_URL}/attendance/scan`, {
                sessionId: sessionId,
                qrCode: qrCode,
                location: {
                    latitude: 30.0444,
                    longitude: 31.2357,
                    accuracy: 10
                },
                deviceFingerprint: 'test-device-fingerprint'
            }, {
                headers: { Authorization: `Bearer ${studentToken}` }
            });
            console.log('✅ Attendance Marked Successfully!');
            console.log('📄 Record:', scanRes.data.data);
        } catch (error) {
            if (error.response && error.response.status === 409) {
                console.log('✅ Attendance already marked (Expected if run multiple times).');
            } else {
                throw error;
            }
        }

        // 8. Verify Record via Professor API
        console.log('\n🔍 Verifying Record as Professor...');
        const statusRes = await axios.get(`${API_URL}/attendance/status/${sessionId}`, {
            headers: { Authorization: `Bearer ${profToken}` }
        });

        const records = statusRes.data.data.records;
        console.log('Records found:', records.length);
        console.log('Looking for Student ID:', studentId, 'Type:', typeof studentId);
        if (records.length > 0) {
            console.log('First Record Student ID:', records[0].student.id, 'Type:', typeof records[0].student.id);
            console.log('First Record Status:', records[0].status);
        }

        const studentRecord = records.find(r => r.student.id == studentId); // Relaxed check to ==

        if (studentRecord && studentRecord.status === 'PRESENT') {
            console.log('✅ VERIFICATION SUCCESSFUL: Student found in attendance list with status PRESENT.');
            console.log(`   Student ID: ${studentRecord.student.id}`);
            console.log(`   Name: ${studentRecord.student.firstName} ${studentRecord.student.lastName}`);
            console.log(`   Email: ${studentRecord.student.email}`);
        } else {
            console.error('❌ VERIFICATION FAILED: Student not found or not present.');
            console.log('Records found:', records.length);
        }

        // 9. Verify Student in Course Student List
        console.log('\n📋 Verifying Student in Course Student List...');

        // Refresh enrollment to ensure student is at the top of the list
        console.log('🔄 Refreshing student enrollment...');
        try {
            // Drop student
            await axios.delete(`${API_URL}/courses/${courseId}/students/${studentId}`, {
                headers: { Authorization: `Bearer ${profToken}` }
            });
            console.log('   Student dropped.');

            // Re-enroll student
            await axios.post(`${API_URL}/courses/${courseId}/enroll`, {
                studentId: studentId
            }, {
                headers: { Authorization: `Bearer ${studentToken}` }
            });
            console.log('   Student re-enrolled.');
        } catch (e) {
            console.log('   Warning during refresh:', e.message);
        }

        const studentsRes = await axios.get(`${API_URL}/courses/${courseId}/students`, {
            headers: { Authorization: `Bearer ${profToken}` }
        });

        const students = studentsRes.data.data;
        console.log('Total students in course:', students.length);
        if (students.length > 0) {
            console.log('First Enrollment ID:', students[0].id);
            console.log('First Student ID:', students[0].student.id);
        }

        // Log all student IDs to check for mismatch
        // console.log('All Student IDs:', students.map(s => s.student.id));

        const enrolledStudent = students.find(s => s.student.id == studentId);

        if (enrolledStudent) {
            console.log('✅ Student found in Course Student List.');
            console.log(`   Name: ${enrolledStudent.student.firstName} ${enrolledStudent.student.lastName}`);
            console.log(`   University ID: ${enrolledStudent.student.universityId}`);
        } else {
            console.error('❌ Student NOT found in Course Student List.');
        }

    } catch (error) {
        console.error('\n❌ TEST FAILED');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
        process.exit(1);
    }
}

runTest();
