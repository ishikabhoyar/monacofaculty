const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Allowed admin users
const ADMIN_USERS = [
    { email: 'arnab.b@somaiya.edu', password: 'ARPITA00', name: 'Arnab' },
    { email: 'ishika.b@somaiya.edu', password: 'ishika@1404', name: 'Ishika' },
];

// Admin authentication middleware
const adminAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ success: false, message: 'No authorization header' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (decoded.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

// Admin login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        // Check against allowed admin users
        const adminUser = ADMIN_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        
        if (adminUser) {
            const token = jwt.sign(
                { id: 1, email: adminUser.email, role: 'admin', name: adminUser.name },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.json({
                success: true,
                token: token,
                user: {
                    id: 1,
                    name: adminUser.name,
                    email: adminUser.email,
                    role: 'admin'
                }
            });
        }

        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    } catch (error) {
        console.error('Admin login error:', error);
        return res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// Dashboard stats - students count
router.get('/students/count', adminAuthMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) as count FROM students');
        const count = parseInt(result.rows[0].count);
        
        // Calculate change from last month
        const lastMonthResult = await pool.query(
            `SELECT COUNT(*) as count FROM students WHERE created_at < NOW() - INTERVAL '30 days'`
        );
        const lastMonthCount = parseInt(lastMonthResult.rows[0].count);
        const change = lastMonthCount > 0 ? Math.round(((count - lastMonthCount) / lastMonthCount) * 100) : 0;

        res.json({ 
            success: true, 
            count: count,
            change: change > 0 ? `+${change}%` : `${change}%`
        });
    } catch (error) {
        console.error('Error getting students count:', error);
        res.status(500).json({ success: false, message: 'Failed to get students count' });
    }
});

// Dashboard stats - faculty count
router.get('/faculty/count', adminAuthMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) as count FROM faculties');
        const count = parseInt(result.rows[0].count);

        res.json({ 
            success: true, 
            count: count,
            change: '+0%'
        });
    } catch (error) {
        console.error('Error getting faculty count:', error);
        res.status(500).json({ success: false, message: 'Failed to get faculty count' });
    }
});

// Dashboard stats - batches count
router.get('/batches/count', adminAuthMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) as count FROM batches');
        const count = parseInt(result.rows[0].count);

        res.json({ 
            success: true, 
            count: count,
            change: '+0'
        });
    } catch (error) {
        console.error('Error getting batches count:', error);
        res.status(500).json({ success: false, message: 'Failed to get batches count' });
    }
});

// Dashboard stats - tests count
router.get('/tests/count', adminAuthMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) as count FROM tests');
        const count = parseInt(result.rows[0].count);

        // Get completed tests count
        const completedResult = await pool.query(
            `SELECT COUNT(*) as count FROM tests WHERE end_time < NOW()`
        );
        const completedCount = parseInt(completedResult.rows[0].count);

        res.json({ 
            success: true, 
            count: completedCount,
            change: '+0%'
        });
    } catch (error) {
        console.error('Error getting tests count:', error);
        res.status(500).json({ success: false, message: 'Failed to get tests count' });
    }
});

// Get all students (admin view)
router.get('/students', adminAuthMiddleware, async (req, res) => {
    try {
        const { batchId, search } = req.query;
        
        let query = `
            SELECT 
                s.id,
                s.roll_number,
                s.name,
                s.email,
                s.phone,
                s.created_at,
                COALESCE(
                    STRING_AGG(DISTINCT b.name, ', ' ORDER BY b.name),
                    'No Batch'
                ) as batch_names
            FROM students s
            LEFT JOIN student_batches sb ON s.id = sb.student_id
            LEFT JOIN batches b ON sb.batch_id = b.id
        `;
        
        let conditions = [];
        let params = [];
        let paramIndex = 1;

        if (batchId) {
            conditions.push(`sb.batch_id = $${paramIndex++}`);
            params.push(batchId);
        }

        if (search) {
            conditions.push(`(
                s.name ILIKE $${paramIndex} OR 
                s.email ILIKE $${paramIndex} OR 
                s.roll_number ILIKE $${paramIndex}
            )`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' GROUP BY s.id ORDER BY s.created_at DESC';

        const result = await pool.query(query, params);

        res.json({ 
            success: true, 
            students: result.rows 
        });
    } catch (error) {
        console.error('Error getting students:', error);
        res.status(500).json({ success: false, message: 'Failed to get students' });
    }
});

// Create student
router.post('/students', adminAuthMiddleware, async (req, res) => {
    try {
        const { roll_number, name, email, phone, batch_id } = req.body;

        if (!roll_number || !name || !email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Roll number, name, and email are required' 
            });
        }

        // Check for duplicate roll number or email
        const existingCheck = await pool.query(
            'SELECT id FROM students WHERE roll_number = $1 OR email = $2',
            [roll_number, email]
        );

        if (existingCheck.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Student with this roll number or email already exists' 
            });
        }

        const result = await pool.query(
            `INSERT INTO students (roll_number, name, email, phone) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [roll_number, name, email, phone || null]
        );

        const student = result.rows[0];

        // If batch_id provided, add student to batch
        if (batch_id) {
            await pool.query(
                'INSERT INTO student_batches (student_id, batch_id) VALUES ($1, $2)',
                [student.id, batch_id]
            );
        }

        res.status(201).json({ 
            success: true, 
            student: student,
            message: 'Student created successfully'
        });
    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({ success: false, message: 'Failed to create student' });
    }
});

// Update student
router.put('/students/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { roll_number, name, email, phone, batch_id } = req.body;

        const result = await pool.query(
            `UPDATE students 
             SET roll_number = COALESCE($1, roll_number),
                 name = COALESCE($2, name),
                 email = COALESCE($3, email),
                 phone = COALESCE($4, phone)
             WHERE id = $5 RETURNING *`,
            [roll_number, name, email, phone, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        res.json({ 
            success: true, 
            student: result.rows[0],
            message: 'Student updated successfully'
        });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ success: false, message: 'Failed to update student' });
    }
});

// Delete student
router.delete('/students/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // First remove from student_batches
        await pool.query('DELETE FROM student_batches WHERE student_id = $1', [id]);

        const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        res.json({ success: true, message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ success: false, message: 'Failed to delete student' });
    }
});

// Get all faculty (admin view)
router.get('/faculty', adminAuthMiddleware, async (req, res) => {
    try {
        const { search } = req.query;
        
        console.log('Fetching faculty list...');
        
        let query = `
            SELECT 
                f.id,
                f.name,
                f.email,
                f.department
            FROM faculties f
        `;
        
        let params = [];
        
        if (search) {
            query += ` WHERE f.name ILIKE $1 OR f.email ILIKE $1 OR f.department ILIKE $1`;
            params.push(`%${search}%`);
        }

        query += ' ORDER BY f.id DESC';
        
        console.log('Query:', query);

        const result = await pool.query(query, params);
        
        console.log('Faculty found:', result.rows.length);

        res.json({ 
            success: true, 
            faculty: result.rows 
        });
    } catch (error) {
        console.error('Error getting faculty:', error);
        res.status(500).json({ success: false, message: 'Failed to get faculty' });
    }
});

// Create faculty
router.post('/faculty', adminAuthMiddleware, async (req, res) => {
    try {
        const { name, email, department } = req.body;

        if (!name || !email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name and email are required' 
            });
        }

        // Check for duplicate email
        const existingCheck = await pool.query(
            'SELECT id FROM faculties WHERE email = $1',
            [email]
        );

        if (existingCheck.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Faculty with this email already exists' 
            });
        }

        const result = await pool.query(
            `INSERT INTO faculties (name, email, department) 
             VALUES ($1, $2, $3) RETURNING *`,
            [name, email, department || null]
        );

        res.status(201).json({ 
            success: true, 
            faculty: result.rows[0],
            message: 'Faculty created successfully'
        });
    } catch (error) {
        console.error('Error creating faculty:', error);
        res.status(500).json({ success: false, message: 'Failed to create faculty' });
    }
});

// Update faculty
router.put('/faculty/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, department } = req.body;

        const result = await pool.query(
            `UPDATE faculties 
             SET name = COALESCE($1, name),
                 email = COALESCE($2, email),
                 department = COALESCE($3, department)
             WHERE id = $4 RETURNING *`,
            [name, email, department, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Faculty not found' });
        }

        res.json({ 
            success: true, 
            faculty: result.rows[0],
            message: 'Faculty updated successfully'
        });
    } catch (error) {
        console.error('Error updating faculty:', error);
        res.status(500).json({ success: false, message: 'Failed to update faculty' });
    }
});

// Delete faculty
router.delete('/faculty/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM faculties WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Faculty not found' });
        }

        res.json({ success: true, message: 'Faculty deleted successfully' });
    } catch (error) {
        console.error('Error deleting faculty:', error);
        res.status(500).json({ success: false, message: 'Failed to delete faculty' });
    }
});

// Get all batches (admin view)
router.get('/batches', adminAuthMiddleware, async (req, res) => {
    try {
        const { search, facultyId } = req.query;
        
        let query = `
            SELECT 
                b.id,
                b.name,
                b.academic_year,
                b.semester,
                b.description,
                b.faculty_id,
                f.name as faculty_name,
                b.created_at,
                COUNT(DISTINCT sb.student_id) as student_count,
                COUNT(DISTINCT t.id) as test_count
            FROM batches b
            LEFT JOIN faculties f ON b.faculty_id = f.id
            LEFT JOIN student_batches sb ON b.id = sb.batch_id
            LEFT JOIN tests t ON b.id = t.batch_id
        `;
        
        let conditions = [];
        let params = [];
        let paramIndex = 1;

        if (facultyId) {
            conditions.push(`b.faculty_id = $${paramIndex++}`);
            params.push(facultyId);
        }

        if (search) {
            conditions.push(`(b.name ILIKE $${paramIndex} OR b.academic_year ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' GROUP BY b.id, f.name ORDER BY b.created_at DESC';

        const result = await pool.query(query, params);

        res.json({ 
            success: true, 
            batches: result.rows 
        });
    } catch (error) {
        console.error('Error getting batches:', error);
        res.status(500).json({ success: false, message: 'Failed to get batches' });
    }
});

// Create batch
router.post('/batches', adminAuthMiddleware, async (req, res) => {
    try {
        const { name, academic_year, semester, description, faculty_id } = req.body;

        if (!name || !academic_year || !semester) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name, academic year, and semester are required' 
            });
        }

        const result = await pool.query(
            `INSERT INTO batches (name, academic_year, semester, description, faculty_id) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, academic_year, semester, description || null, faculty_id || null]
        );

        res.status(201).json({ 
            success: true, 
            batch: result.rows[0],
            message: 'Batch created successfully'
        });
    } catch (error) {
        console.error('Error creating batch:', error);
        res.status(500).json({ success: false, message: 'Failed to create batch' });
    }
});

// Update batch
router.put('/batches/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, academic_year, semester, description, faculty_id } = req.body;

        const result = await pool.query(
            `UPDATE batches 
             SET name = COALESCE($1, name),
                 academic_year = COALESCE($2, academic_year),
                 semester = COALESCE($3, semester),
                 description = COALESCE($4, description),
                 faculty_id = COALESCE($5, faculty_id)
             WHERE id = $6 RETURNING *`,
            [name, academic_year, semester, description, faculty_id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }

        res.json({ 
            success: true, 
            batch: result.rows[0],
            message: 'Batch updated successfully'
        });
    } catch (error) {
        console.error('Error updating batch:', error);
        res.status(500).json({ success: false, message: 'Failed to update batch' });
    }
});

// Delete batch
router.delete('/batches/:id', adminAuthMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // First remove student associations
        await pool.query('DELETE FROM student_batches WHERE batch_id = $1', [id]);

        const result = await pool.query('DELETE FROM batches WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }

        res.json({ success: true, message: 'Batch deleted successfully' });
    } catch (error) {
        console.error('Error deleting batch:', error);
        res.status(500).json({ success: false, message: 'Failed to delete batch' });
    }
});

// Get all tests (admin view)
router.get('/tests', adminAuthMiddleware, async (req, res) => {
    try {
        const { batchId, status, search } = req.query;
        
        let query = `
            SELECT 
                t.id,
                t.title,
                t.course_id,
                t.description,
                t.instructions,
                t.start_time,
                t.end_time,
                t.duration_minutes,
                t.max_attempts,
                t.password,
                t.late_penalty_percent,
                t.batch_id,
                b.name as batch_name,
                t.faculty_id,
                f.name as faculty_name,
                t.created_at,
                CASE
                    WHEN t.end_time < NOW() THEN 'Completed'
                    WHEN t.start_time <= NOW() AND t.end_time >= NOW() THEN 'Active'
                    ELSE 'Draft'
                END as status
            FROM tests t
            LEFT JOIN batches b ON t.batch_id = b.id
            LEFT JOIN faculties f ON t.faculty_id = f.id
        `;
        
        let conditions = [];
        let params = [];
        let paramIndex = 1;

        if (batchId) {
            conditions.push(`t.batch_id = $${paramIndex++}`);
            params.push(batchId);
        }

        if (status) {
            if (status === 'Completed') {
                conditions.push(`t.end_time < NOW()`);
            } else if (status === 'Active') {
                conditions.push(`t.start_time <= NOW() AND t.end_time >= NOW()`);
            } else if (status === 'Draft') {
                conditions.push(`t.start_time > NOW()`);
            }
        }

        if (search) {
            conditions.push(`(t.title ILIKE $${paramIndex} OR t.course_id ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY t.created_at DESC';

        const result = await pool.query(query, params);

        res.json({ 
            success: true, 
            tests: result.rows 
        });
    } catch (error) {
        console.error('Error getting tests:', error);
        res.status(500).json({ success: false, message: 'Failed to get tests' });
    }
});

// Get upcoming tests
router.get('/tests/upcoming', adminAuthMiddleware, async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        
        const result = await pool.query(`
            SELECT 
                t.id,
                t.title,
                t.course_id,
                t.start_time,
                t.end_time,
                t.duration_minutes,
                b.name as batch_name,
                f.name as faculty_name,
                CASE
                    WHEN t.end_time < NOW() THEN 'Completed'
                    WHEN t.start_time <= NOW() AND t.end_time >= NOW() THEN 'Active'
                    ELSE 'Upcoming'
                END as status
            FROM tests t
            LEFT JOIN batches b ON t.batch_id = b.id
            LEFT JOIN faculties f ON t.faculty_id = f.id
            WHERE t.start_time > NOW()
            ORDER BY t.start_time ASC
            LIMIT $1
        `, [parseInt(limit)]);

        res.json({ 
            success: true, 
            tests: result.rows 
        });
    } catch (error) {
        console.error('Error getting upcoming tests:', error);
        res.status(500).json({ success: false, message: 'Failed to get upcoming tests' });
    }
});

// Get recent activity
router.get('/activity', adminAuthMiddleware, async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        // Get recent activities from various sources
        const activities = [];

        // Recent student registrations
        const recentStudents = await pool.query(`
            SELECT 
                id, name, 'registration' as type,
                'registered as a new student' as action,
                'Students' as target,
                created_at as time
            FROM students
            ORDER BY created_at DESC
            LIMIT 3
        `);
        
        recentStudents.rows.forEach((row, index) => {
            activities.push({
                id: index + 1,
                user: row.name,
                action: row.action,
                target: row.target,
                time: row.time,
                type: row.type
            });
        });

        // Recent tests created
        const recentTests = await pool.query(`
            SELECT 
                t.id, f.name, 'test' as type,
                'created a new test:' as action,
                t.title as target,
                t.created_at as time
            FROM tests t
            JOIN faculties f ON t.faculty_id = f.id
            ORDER BY t.created_at DESC
            LIMIT 3
        `);
        
        recentTests.rows.forEach((row, index) => {
            activities.push({
                id: activities.length + index + 1,
                user: row.name,
                action: row.action,
                target: row.target,
                time: row.time,
                type: row.type
            });
        });

        // Recent batches
        const recentBatches = await pool.query(`
            SELECT 
                b.id, COALESCE(f.name, 'Admin') as name, 'batch' as type,
                'created batch' as action,
                b.name as target,
                b.created_at as time
            FROM batches b
            LEFT JOIN faculties f ON b.faculty_id = f.id
            ORDER BY b.created_at DESC
            LIMIT 3
        `);
        
        recentBatches.rows.forEach((row, index) => {
            activities.push({
                id: activities.length + index + 1,
                user: row.name,
                action: row.action,
                target: row.target,
                time: row.time,
                type: row.type
            });
        });

        // Sort by time and limit
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));
        const limitedActivities = activities.slice(0, parseInt(limit));

        // Format time as relative
        limitedActivities.forEach(activity => {
            const now = new Date();
            const activityTime = new Date(activity.time);
            const diffMs = now - activityTime;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) {
                activity.time = 'Just now';
            } else if (diffMins < 60) {
                activity.time = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
            } else if (diffHours < 24) {
                activity.time = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
            } else {
                activity.time = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
            }
        });

        res.json({ 
            success: true, 
            activities: limitedActivities 
        });
    } catch (error) {
        console.error('Error getting activity:', error);
        res.status(500).json({ success: false, message: 'Failed to get activity' });
    }
});

module.exports = router;
