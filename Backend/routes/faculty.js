const express = require('express');
const db = require('../db');
const authenticateToken = require('../authMiddleware');

const router = express.Router();

// GET /api/faculty/:id - Get faculty data by ID
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const facultyIdFromToken = req.user.id;

    // Authorization check
    if (parseInt(id) !== facultyIdFromToken) {
        return res.status(403).json({ success: false, message: 'Unauthorized: You can only view your own faculty data.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        const [rows] = await connection.execute(
            'SELECT faculty_id, name, email, department FROM faculties WHERE faculty_id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Faculty not found.' });
        }

        res.status(200).json({ success: true, faculty: rows[0] });

    } catch (error) {
        console.error('Error fetching faculty data:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch faculty data.', error: error.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// PUT /api/faculty/:id - Update faculty data
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, email, department } = req.body;
    const facultyIdFromToken = req.user.id; // Assuming req.user.id is populated by authenticateToken

    // Authorization check: Ensure faculty can only update their own data
    if (parseInt(id) !== facultyIdFromToken) {
        return res.status(403).json({ success: false, message: 'Unauthorized: You can only update your own faculty data.' });
    }

    // Basic validation
    if (!name && !email && !department) {
        return res.status(400).json({ success: false, message: 'No data provided for update.' });
    }

    let updateFields = [];
    let updateValues = [];

    if (name) {
        updateFields.push('name = ?');
        updateValues.push(name);
    }
    if (email) {
        // Basic email format validation
        if (!/^[^\\]+@[^\\]+\\\.[^\\]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format.' });
        }
        updateFields.push('email = ?');
        updateValues.push(email);
    }
    if (department) {
        updateFields.push('department = ?');
        updateValues.push(department);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
    }

    const query = `UPDATE faculties SET ${updateFields.join(', ')} WHERE faculty_id = ?`;
    updateValues.push(id);

    let connection;
    try {
        connection = await db.getConnection();
        const [result] = await connection.execute(query, updateValues);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Faculty not found or no changes made.' });
        }

        res.status(200).json({ success: true, message: 'Faculty data updated successfully.' });

    } catch (error) {
        console.error('Error updating faculty data:', error);
        // Handle specific MySQL errors (e.g., duplicate email)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Email already in use by another faculty member.', error: error.message });
        }
        res.status(500).json({ success: false, message: 'Failed to update faculty data.', error: error.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

module.exports = router;

