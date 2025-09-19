const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../authMiddleware');

// GET /api/faculty/:id - Get faculty data by ID
router.get('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const facultyIdFromToken = req.user.id;

    // Authorization check
    if (parseInt(id) !== facultyIdFromToken) {
        return res.status(403).json({ success: false, message: 'Unauthorized: You can only view your own faculty data.' });
    }

    try {
        const result = await pool.query(
            'SELECT id, name, email, department FROM faculties WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Faculty not found.' });
        }

        res.status(200).json({ success: true, faculty: result.rows[0] });

    } catch (error) {
        console.error('Error fetching faculty data:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch faculty data.', error: error.message });
    }
});

// PUT /api/faculty/:id - Update faculty data
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { name, email, department } = req.body;
    const facultyIdFromToken = req.user.id;

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
    let paramIndex = 1;

    if (name) {
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(name);
    }
    if (email) {
        // Basic email format validation
        if (!/^[^\\]+@[^\\]+\\\.[^\\]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format.' });
        }
        updateFields.push(`email = $${paramIndex++}`);
        updateValues.push(email);
    }
    if (department) {
        updateFields.push(`department = $${paramIndex++}`);
        updateValues.push(department);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
    }

    const query = `UPDATE faculties SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
    updateValues.push(id);

    try {
        const result = await pool.query(query, updateValues);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Faculty not found or no changes made.' });
        }

        res.status(200).json({ success: true, message: 'Faculty data updated successfully.' });

    } catch (error) {
        console.error('Error updating faculty data:', error);
        // Handle specific PostgreSQL errors (e.g., duplicate email)
        if (error.code === '23505') {
            return res.status(409).json({ success: false, message: 'Email already in use by another faculty member.', error: error.message });
        }
        res.status(500).json({ success: false, message: 'Failed to update faculty data.', error: error.message });
    }
});

module.exports = router;

