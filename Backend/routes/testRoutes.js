// routes/testRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRole } = require('../middleware/auth');
const testController = require('../controllers/testController');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Get all tests (faculty can see all their tests, admin can see all tests)
router.get('/', authenticateUser, testController.getAllTests);

// Get a specific test by ID
router.get('/:id', authenticateUser, testController.getTestById);

// Create a new test (temporarily removed authentication for testing)
router.post('/', async (req, res) => {
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
      isPasswordProtected,
      password,
      allowLateSubmission,
      latePenaltyPercent
    } = req.body;

    // Insert test into Supabase
    const { data, error } = await supabase
      .from('tests')
      .insert([
        { 
          title,
          course_id: courseId,
          description,
          instructions,
          start_time: startTime,
          end_time: endTime,
          duration_minutes: parseInt(durationMinutes),
          max_attempts: parseInt(maxAttempts),
          is_password_protected: isPasswordProtected,
          password: isPasswordProtected ? password : null,
          allow_late_submission: allowLateSubmission,
          late_penalty_percent: allowLateSubmission ? parseInt(latePenaltyPercent) : 0
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json({ 
      success: true, 
      message: 'Test created successfully', 
      data 
    });
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create test', 
      error: error.message 
    });
  }
});

// Update a test (owner faculty or admin only)
router.put('/:id', authenticateUser, testController.updateTest);

// Delete a test (owner faculty or admin only)
router.delete('/:id', authenticateUser, testController.deleteTest);

// Publish a test
router.patch('/:id/publish', authenticateUser, authorizeRole(['faculty', 'admin']), testController.publishTest);

// Get all questions for a test
router.get('/:id/questions', authenticateUser, testController.getTestQuestions);

module.exports = router;
