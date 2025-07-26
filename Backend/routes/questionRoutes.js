// routes/questionRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRole } = require('../middleware/auth');
const questionController = require('../controllers/questionController');

// Create a new question (faculty and admin only)
router.post('/', authenticateUser, authorizeRole(['faculty', 'admin']), questionController.createQuestion);

// Get a question by ID
router.get('/:id', authenticateUser, questionController.getQuestionById);

// Update a question (owner faculty or admin only)
router.put('/:id', authenticateUser, questionController.updateQuestion);

// Delete a question (owner faculty or admin only)
router.delete('/:id', authenticateUser, questionController.deleteQuestion);

// Submit a solution for a question
router.post('/:id/submit', authenticateUser, questionController.submitSolution);

module.exports = router;
