const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const authMiddleware = require('./authMiddleware');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'https://monacofaculty.pages.dev', 'https://monaco-ckg.pages.dev'], // Add your frontend URLs
  credentials: true
}));
app.use(express.json());

// Add multer for file uploads
const multer = require('multer');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// API routes
const testRoutes = require('./routes/tests');
const facultyRoutes = require('./routes/faculty');
const batchRoutes = require('./routes/batches');
const questionRoutes = require('./routes/questions');
const studentRoutes = require('./routes/students');
const adminRoutes = require('./routes/admin');

app.use('/api/tests', testRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

async function checkDatabaseConnection() {
    try {
        const client = await pool.connect();
        console.log('Database connected successfully!');
        const result = await client.query('SELECT NOW()');
        console.log('Sample query result:', result.rows[0]);
        client.release();
    } catch (error) {
        console.error('Error connecting to the database:', error);
    }
}

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

app.post('/api/login', authMiddleware, (req, res) => {
    // Generate JWT token for the authenticated user
    const token = jwt.sign(
        { id: req.user.id, email: req.user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.json({
        success: true,
        user: req.user,
        token: token,
        facultyId: req.user.id
    });
});

// Student Google OAuth login endpoint
// Student Google OAuth login endpoint
app.post('/api/student/login', authMiddleware, async (req, res) => {
    try {
        const { email, name, sub: google_id } = req.user;
        
        console.log('Student Google login attempt for:', email);
        
        // Check if student exists in the database by email
        const studentResult = await pool.query('SELECT * FROM students WHERE email = $1', [email]);
        
        if (studentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found. Please contact your administrator to register your account.'
            });
        }

        const student = studentResult.rows[0];
        
        // Update google_id if not set
        if (!student.google_id) {
            await pool.query('UPDATE students SET google_id = $1 WHERE id = $2', [google_id, student.id]);
        }

        // Generate JWT token for student
        const token = jwt.sign(
            { 
                id: student.id, 
                email: student.email,
                type: 'student',
                batchId: student.batch_id
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            student: {
                id: student.id,
                name: student.name,
                email: student.email,
                rollNumber: student.roll_number,
                batchId: student.batch_id
            },
            token: token
        });

    } catch (error) {
        console.error('Student login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during student login'
        });
    }
});

checkDatabaseConnection();

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});