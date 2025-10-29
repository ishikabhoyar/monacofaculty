const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../authMiddleware');

// Create a new test
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { 
      title, 
      courseId, 
      description, 
      instructions, 
      startTime, 
      endTime, 
      durationMinutes, 
      maxAttempts, 
      password, 
      latePenaltyPercent,
      batchId
    } = req.body;
    
    const faculty_id = req.user.id;

    // Validate the batch belongs to this faculty
    const batchCheck = await pool.query(
      'SELECT id FROM batches WHERE id = $1 AND faculty_id = $2',
      [batchId, faculty_id]
    );
    
    if (batchCheck.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to create a test for this batch' 
      });
    }

    // Insert the test
    const testResult = await pool.query(
      `INSERT INTO tests (
        title, course_id, description, instructions, start_time, end_time, 
        duration_minutes, max_attempts, password, late_penalty_percent, faculty_id, batch_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [
        title, courseId, description, instructions, startTime, endTime, 
        durationMinutes, maxAttempts, password, latePenaltyPercent, faculty_id, batchId
      ]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Test created successfully',
      testId: testResult.rows[0].id
    });
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({ success: false, message: 'Error creating test', error: error.message });
  }
});

// Get all tests for a faculty
router.get('/', authMiddleware, async (req, res) => {
  try {
    const faculty_id = req.user.id;
    const { batchId } = req.query;
    
    let query = `
      SELECT 
        t.id,
        t.title,
        t.course_id as course,
        t.description,
        t.instructions,
        t.start_time,
        t.end_time,
        t.duration_minutes,
        t.max_attempts,
        t.password,
        t.late_penalty_percent,
        t.created_at,
        t.updated_at,
        b.name as batch_name,
        CASE
          WHEN t.end_time < NOW() THEN 'Completed'
          WHEN t.start_time <= NOW() AND t.end_time >= NOW() THEN 'Active'
          ELSE 'Draft'
        END as status
      FROM tests t 
      JOIN batches b ON t.batch_id = b.id 
      WHERE t.faculty_id = $1
    `;
    let params = [faculty_id];
    
    if (batchId) {
      query += ' AND t.batch_id = $2';
      params.push(batchId);
    }
    
    query += ' ORDER BY t.created_at DESC';
    
    const testsResult = await pool.query(query, params);
    
    res.json({ success: true, tests: testsResult.rows });
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ success: false, message: 'Error fetching tests', error: error.message });
  }
});

// Get all submissions for faculty's tests
router.get('/submissions', authMiddleware, async (req, res) => {
  try {
    const faculty_id = req.user.id;
    const { testId, batchId } = req.query;
    
    let query = `
      SELECT 
        s.id as submission_id,
        s.submitted_answer,
        s.marks_obtained,
        s.submitted_at,
        s.updated_at,
        st.id as student_id,
        st.name as student_name,
        st.roll_number as student_roll,
        st.email as student_email,
        t.id as test_id,
        t.title as test_title,
        q.id as question_id,
        q.question_text,
        q.marks as total_marks,
        q.question_type,
        q.programming_language,
        b.id as batch_id,
        b.name as batch_name
      FROM submissions s
      JOIN students st ON s.student_id = st.id
      JOIN tests t ON s.test_id = t.id
      JOIN questions q ON s.question_id = q.id
      JOIN batches b ON st.batch_id = b.id
      WHERE t.faculty_id = $1
    `;
    
    let params = [faculty_id];
    let paramCount = 1;
    
    if (testId) {
      paramCount++;
      query += ` AND t.id = $${paramCount}`;
      params.push(testId);
    }
    
    if (batchId) {
      paramCount++;
      query += ` AND b.id = $${paramCount}`;
      params.push(batchId);
    }
    
    query += ' ORDER BY s.submitted_at DESC';
    
    const submissionsResult = await pool.query(query, params);
    
    res.json({
      success: true,
      submissions: submissionsResult.rows
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submissions',
      error: error.message
    });
  }
});

// Get submission statistics for faculty
router.get('/submissions/stats', authMiddleware, async (req, res) => {
  try {
    const faculty_id = req.user.id;
    
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT s.id) as total_submissions,
        COUNT(DISTINCT s.student_id) as unique_students,
        COUNT(DISTINCT s.test_id) as tests_with_submissions,
        ROUND(AVG(CASE WHEN s.marks_obtained IS NOT NULL AND q.marks > 0 
                  THEN (s.marks_obtained::float / q.marks) * 100 
                  ELSE NULL END), 2) as average_score_percent
      FROM submissions s
      JOIN tests t ON s.test_id = t.id
      JOIN questions q ON s.question_id = q.id
      WHERE t.faculty_id = $1
    `;
    
    const statsResult = await pool.query(statsQuery, [faculty_id]);
    
    res.json({
      success: true,
      stats: statsResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching submission stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submission statistics'
    });
  }
});

// Get a specific test by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const faculty_id = req.user.id;
    
    const testResult = await pool.query(
      `
      SELECT 
        t.id,
        t.title,
        t.course_id as course,
        t.description,
        t.instructions,
        t.start_time,
        t.end_time,
        t.duration_minutes,
        t.max_attempts,
        t.password,
        t.late_penalty_percent,
        t.created_at,
        t.updated_at,
        b.name as batch_name,
        CASE
          WHEN t.end_time < NOW() THEN 'Completed'
          WHEN t.start_time <= NOW() AND t.end_time >= NOW() THEN 'Active'
          ELSE 'Draft'
        END as status
      FROM tests t 
      JOIN batches b ON t.batch_id = b.id 
      WHERE t.id = $1 AND t.faculty_id = $2
      `,
      [id, faculty_id]
    );
    
    if (testResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }
    
    res.json({
      success: true,
      test: testResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching test'
    });
  }
});

// Update a test
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const faculty_id = req.user.id;
    const {
      title,
      courseId,
      description,
      instructions,
      startTime,
      endTime,
      durationMinutes,
      maxAttempts,
      password,
      latePenaltyPercent
    } = req.body;
    
    // Check if test exists and belongs to faculty
    const existingTest = await pool.query(
      'SELECT id FROM tests WHERE id = $1 AND faculty_id = $2',
      [id, faculty_id]
    );
    
    if (existingTest.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }
    
    // Update test
    const result = await pool.query(
      `UPDATE tests SET
        title = $1, course_id = $2, description = $3, instructions = $4,
        start_time = $5, end_time = $6, duration_minutes = $7, max_attempts = $8,
        password = $9, late_penalty_percent = $10, updated_at = NOW()
       WHERE id = $11 AND faculty_id = $12
       RETURNING *`,
      [
        title, courseId, description, instructions, startTime, endTime,
        durationMinutes, maxAttempts, password, latePenaltyPercent, id, faculty_id
      ]
    );
    
    res.json({
      success: true,
      message: 'Test updated successfully',
      test: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating test:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating test'
    });
  }
});

// Delete a test
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const faculty_id = req.user.id;
    
    // Check if test exists and belongs to faculty
    const existingTest = await pool.query(
      'SELECT id FROM tests WHERE id = $1 AND faculty_id = $2',
      [id, faculty_id]
    );
    
    if (existingTest.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }
    
    // Delete test (questions will be deleted via CASCADE)
    await pool.query('DELETE FROM tests WHERE id = $1 AND faculty_id = $2', [id, faculty_id]);
    
    res.json({
      success: true,
      message: 'Test deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting test:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting test'
    });
  }
});

module.exports = router;