const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const authMiddleware = require('./authMiddleware');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
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

app.use('/api/tests', testRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/questions', questionRoutes);

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

checkDatabaseConnection();

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});