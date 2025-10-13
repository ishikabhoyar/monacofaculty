/**
 * Test script to verify duplicate student error handling
 * Run this after starting the server to test the improvements
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let authToken = '';

// Replace with valid faculty credentials
const TEST_CREDENTIALS = {
    email: 'faculty@example.com',
    // Add Google OAuth token or use existing session
};

async function login() {
    try {
        console.log('🔐 Logging in...');
        // Implement your login logic here
        console.log('✅ Login successful');
    } catch (error) {
        console.error('❌ Login failed:', error.message);
        process.exit(1);
    }
}

async function testDuplicateRollNumber() {
    try {
        console.log('\n📝 Test 1: Duplicate Roll Number in Different Batches');
        
        // Create first batch
        const batch1 = await axios.post(
            `${API_URL}/batches`,
            {
                batchName: 'Test Batch A',
                academicYear: '2024-25',
                semester: 'Fall',
                students: [
                    {
                        rollNumber: 'TEST001',
                        name: 'John Doe',
                        email: 'john@test.com',
                        phoneNumber: '1234567890'
                    }
                ]
            },
            {
                headers: { Authorization: `Bearer ${authToken}` }
            }
        );
        console.log('✅ First batch created successfully');
        
        // Try to create second batch with same roll number
        try {
            await axios.post(
                `${API_URL}/batches`,
                {
                    batchName: 'Test Batch B',
                    academicYear: '2024-25',
                    semester: 'Fall',
                    students: [
                        {
                            rollNumber: 'TEST001', // Duplicate!
                            name: 'Jane Doe',
                            email: 'jane@test.com',
                            phoneNumber: '0987654321'
                        }
                    ]
                },
                {
                    headers: { Authorization: `Bearer ${authToken}` }
                }
            );
            console.log('❌ Test failed: Should have caught duplicate roll number');
        } catch (error) {
            if (error.response && error.response.status === 409) {
                console.log('✅ Duplicate detected correctly:', error.response.data.message);
                console.log('   Errors:', error.response.data.errors);
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }
        
        // Cleanup
        await axios.delete(`${API_URL}/batches/${batch1.data.batch.id}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('🧹 Cleanup completed');
        
    } catch (error) {
        console.error('❌ Test 1 failed:', error.message);
    }
}

async function testDuplicateInSubmission() {
    try {
        console.log('\n📝 Test 2: Duplicate Roll Number Within Same Submission');
        
        try {
            await axios.post(
                `${API_URL}/batches`,
                {
                    batchName: 'Test Batch C',
                    academicYear: '2024-25',
                    semester: 'Fall',
                    students: [
                        {
                            rollNumber: 'TEST002',
                            name: 'Student 1',
                            email: 'student1@test.com'
                        },
                        {
                            rollNumber: 'TEST002', // Duplicate in same submission!
                            name: 'Student 2',
                            email: 'student2@test.com'
                        }
                    ]
                },
                {
                    headers: { Authorization: `Bearer ${authToken}` }
                }
            );
            console.log('❌ Test failed: Should have caught duplicate in submission');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Duplicate in submission detected correctly:', error.response.data.message);
                console.log('   Errors:', error.response.data.errors);
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Test 2 failed:', error.message);
    }
}

async function testDuplicateEmail() {
    try {
        console.log('\n📝 Test 3: Duplicate Email');
        
        try {
            await axios.post(
                `${API_URL}/batches`,
                {
                    batchName: 'Test Batch D',
                    academicYear: '2024-25',
                    semester: 'Fall',
                    students: [
                        {
                            rollNumber: 'TEST003',
                            name: 'Student 1',
                            email: 'duplicate@test.com'
                        },
                        {
                            rollNumber: 'TEST004',
                            name: 'Student 2',
                            email: 'duplicate@test.com' // Duplicate email!
                        }
                    ]
                },
                {
                    headers: { Authorization: `Bearer ${authToken}` }
                }
            );
            console.log('❌ Test failed: Should have caught duplicate email');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Duplicate email detected correctly:', error.response.data.message);
                console.log('   Errors:', error.response.data.errors);
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Test 3 failed:', error.message);
    }
}

async function testValidBatch() {
    try {
        console.log('\n📝 Test 4: Valid Batch Creation (Should Succeed)');
        
        const batch = await axios.post(
            `${API_URL}/batches`,
            {
                batchName: 'Valid Test Batch',
                academicYear: '2024-25',
                semester: 'Fall',
                students: [
                    {
                        rollNumber: 'VALID001',
                        name: 'Valid Student 1',
                        email: 'valid1@test.com'
                    },
                    {
                        rollNumber: 'VALID002',
                        name: 'Valid Student 2',
                        email: 'valid2@test.com'
                    }
                ]
            },
            {
                headers: { Authorization: `Bearer ${authToken}` }
            }
        );
        
        console.log('✅ Valid batch created successfully');
        console.log('   Batch ID:', batch.data.batch.id);
        console.log('   Students added:', batch.data.batch.students.length);
        
        // Cleanup
        await axios.delete(`${API_URL}/batches/${batch.data.batch.id}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('🧹 Cleanup completed');
        
    } catch (error) {
        console.error('❌ Test 4 failed:', error.response?.data || error.message);
    }
}

async function runTests() {
    console.log('🚀 Starting Duplicate Student Error Handling Tests\n');
    console.log('=' .repeat(60));
    
    await login();
    await testDuplicateRollNumber();
    await testDuplicateInSubmission();
    await testDuplicateEmail();
    await testValidBatch();
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ All tests completed!');
}

// Run tests if executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests };
