const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

// Student login endpoint - Exchange Google token for JWT
router.post('/login', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No authorization header' });
    }
    
    const googleToken = authHeader.split(' ')[1];
    
    if (!googleToken) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, sub: google_id } = payload;
    
    console.log('Student login attempt:', email);

    // Check if student exists in database
    let studentResult = await pool.query('SELECT * FROM students WHERE email = $1', [email]);
    
    if (studentResult.rows.length === 0) {
      // Student doesn't exist - create new student without batch
      const insertResult = await pool.query(
        'INSERT INTO students (name, email, google_id) VALUES ($1, $2, $3) RETURNING *',
        [name, email, google_id]
      );
      studentResult = insertResult;
      console.log('Created new student:', email);
    }

    const student = studentResult.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      {
        id: student.id,
        email: student.email,
        type: 'student'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token: token,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        batch_id: student.batch_id
      }
    });

  } catch (error) {
    console.error('Student login error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Authentication failed',
      error: error.message 
    });
  }
});

// Middleware for student authentication (updated for Google OAuth)
const studentAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Student auth - Received token:', token?.substring(0, 50) + '...');

  if (!token) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    console.log('Student auth - Attempting to verify JWT...');
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if it's a student token
    if (decoded.type !== 'student') {
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }

    // Fetch student from database
    const studentResult = await pool.query('SELECT * FROM students WHERE id = $1', [decoded.id]);
    if (studentResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Student not found' });
    }

    req.student = studentResult.rows[0];
    next();
  } catch (error) {
    console.error('Student authentication error:', error);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Get tests available for the student (based on their batches)
router.get('/tests', studentAuthMiddleware, async (req, res) => {
  try {
    const studentId = req.student.id;

    // Get student's batches
    const studentBatchesResult = await pool.query(
      'SELECT batch_id FROM student_batches WHERE student_id = $1',
      [studentId]
    );

    if (studentBatchesResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not enrolled in any batch'
      });
    }

    const batchIds = studentBatchesResult.rows.map(row => row.batch_id);

    // Get tests assigned to any of the student's batches (either directly or via assignments)
    const testsResult = await pool.query(
      `SELECT DISTINCT
        t.id,
        t.title,
        t.course_id as course,
        t.description,
        t.instructions,
        t.start_time,
        t.end_time,
        t.duration_minutes,
        t.max_attempts,
        CASE
          WHEN t.end_time AT TIME ZONE 'Asia/Kolkata' < NOW() THEN 'Completed'
          WHEN t.start_time AT TIME ZONE 'Asia/Kolkata' <= NOW() AND t.end_time AT TIME ZONE 'Asia/Kolkata' >= NOW() THEN 'Active'
          ELSE 'Upcoming'
        END as status,
        f.name as faculty_name
      FROM tests t
      JOIN faculties f ON t.faculty_id = f.id
      WHERE t.batch_id = ANY($1::int[])
      UNION
      SELECT DISTINCT
        t.id,
        t.title,
        t.course_id as course,
        t.description,
        t.instructions,
        t.start_time,
        t.end_time,
        t.duration_minutes,
        t.max_attempts,
        CASE
          WHEN t.end_time AT TIME ZONE 'Asia/Kolkata' < NOW() THEN 'Completed'
          WHEN t.start_time AT TIME ZONE 'Asia/Kolkata' <= NOW() AND t.end_time AT TIME ZONE 'Asia/Kolkata' >= NOW() THEN 'Active'
          ELSE 'Upcoming'
        END as status,
        f.name as faculty_name
      FROM tests t
      JOIN test_assignments ta ON t.id = ta.test_id
      JOIN faculties f ON t.faculty_id = f.id
      WHERE ta.batch_id = ANY($1::int[])
      ORDER BY start_time DESC`,
      [batchIds]
    );

    res.json({
      success: true,
      tests: testsResult.rows
    });
  } catch (error) {
    console.error('Error fetching student tests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tests'
    });
  }
});

// Get questions for a specific test (without correct answers and hints)
router.get('/tests/:testId/questions', studentAuthMiddleware, async (req, res) => {
  try {
    const { testId } = req.params;
    const studentId = req.student.id;

    // Verify student has access to this test
    const accessCheck = await pool.query(
      `SELECT t.id FROM tests t
       WHERE t.id = $1 AND (
         t.batch_id IN (SELECT batch_id FROM student_batches WHERE student_id = $2)
         OR EXISTS (
           SELECT 1 FROM test_assignments ta 
           WHERE ta.test_id = t.id 
           AND ta.batch_id IN (SELECT batch_id FROM student_batches WHERE student_id = $2)
         )
       )`,
      [testId, studentId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Test not available for this student'
      });
    }

    // Get questions without sensitive information
    const questionsResult = await pool.query(
      `SELECT
        id,
        question_text,
        options,
        marks,
        question_type,
        difficulty,
        programming_language,
        code_template,
        time_limit_seconds,
        memory_limit_mb
      FROM questions
      WHERE test_id = $1
      ORDER BY id`,
      [testId]
    );

    // Parse JSON fields and remove sensitive data
    const questions = questionsResult.rows.map(question => ({
      ...question,
      options: question.options && question.options.trim() ? JSON.parse(question.options) : [],
      // Remove hints and explanation for students
    }));

    res.json({
      success: true,
      questions: questions
    });
  } catch (error) {
    console.error('Error fetching test questions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching questions'
    });
  }
});

// Get student's submissions
router.get('/submissions', studentAuthMiddleware, async (req, res) => {
  try {
    const studentId = req.student.id;

    const submissionsResult = await pool.query(
      `SELECT
        s.id,
        s.test_id,
        s.question_id,
        s.submitted_answer,
        s.marks_obtained,
        t.title as test_title,
        q.question_text,
        q.marks as total_marks
      FROM submissions s
      JOIN tests t ON s.test_id = t.id
      JOIN questions q ON s.question_id = q.id
      WHERE s.student_id = $1
      ORDER BY s.id DESC`,
      [studentId]
    );

    res.json({
      success: true,
      submissions: submissionsResult.rows
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submissions'
    });
  }
});

// Submit answers for a test
router.post('/submissions', studentAuthMiddleware, async (req, res) => {
  try {
    const { testId, answers } = req.body; // answers: [{ questionId, submittedAnswer }]
    const studentId = req.student.id;

    if (!testId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: testId and answers array required'
      });
    }

    // Verify student has access to this test
    const accessCheck = await pool.query(
      `SELECT t.id FROM tests t
       WHERE t.id = $1 AND (
         t.batch_id IN (SELECT batch_id FROM student_batches WHERE student_id = $2)
         OR EXISTS (
           SELECT 1 FROM test_assignments ta 
           WHERE ta.test_id = t.id 
           AND ta.batch_id IN (SELECT batch_id FROM student_batches WHERE student_id = $2)
         )
       )`,
      [testId, studentId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Test not available for this student'
      });
    }

    // Insert submissions
    const submissionPromises = answers.map(async (answer) => {
      const { questionId, submittedAnswer } = answer;

      // Check if submission already exists
      const existingSubmission = await pool.query(
        'SELECT id FROM submissions WHERE student_id = $1 AND test_id = $2 AND question_id = $3',
        [studentId, testId, questionId]
      );

      if (existingSubmission.rows.length > 0) {
        // Update existing submission
        return pool.query(
          'UPDATE submissions SET submitted_answer = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
          [submittedAnswer, existingSubmission.rows[0].id]
        );
      } else {
        // Insert new submission
        return pool.query(
          'INSERT INTO submissions (student_id, test_id, question_id, submitted_answer, submitted_at, updated_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *',
          [studentId, testId, questionId, submittedAnswer]
        );
      }
    });

    const submissionResults = await Promise.all(submissionPromises);

    res.status(201).json({
      success: true,
      message: 'Answers submitted successfully',
      submissions: submissionResults.map(result => result.rows[0])
    });
  } catch (error) {
    console.error('Error submitting answers:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting answers'
    });
  }
});

// Verify test password
router.post('/tests/:testId/verify-password', studentAuthMiddleware, async (req, res) => {
  try {
    const { testId } = req.params;
    const { password } = req.body;
    const studentId = req.student.id;

    const testResult = await pool.query(
      `SELECT t.id, t.password FROM tests t
       WHERE t.id = $1 AND (
         t.batch_id IN (SELECT batch_id FROM student_batches WHERE student_id = $2)
         OR EXISTS (
           SELECT 1 FROM test_assignments ta 
           WHERE ta.test_id = t.id 
           AND ta.batch_id IN (SELECT batch_id FROM student_batches WHERE student_id = $2)
         )
       )`,
      [testId, studentId]
    );

    if (testResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Test not available for this student'
      });
    }

    const test = testResult.rows[0];
    if (!test.password || test.password === password) {
      res.json({ success: true });
    } else {
      res.status(403).json({
        success: false,
        message: 'Invalid password'
      });
    }
  } catch (error) {
    console.error('Error verifying test password:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying test password'
    });
  }
});

module.exports = router;