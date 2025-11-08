const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../authMiddleware');

// Get all questions for a test
router.get('/test/:testId', authMiddleware, async (req, res) => {
  try {
    const { testId } = req.params;
    const faculty_id = req.user.id;
    
    // First verify the test belongs to the faculty
    const testCheck = await pool.query(
      'SELECT id FROM tests WHERE id = $1 AND faculty_id = $2',
      [testId, faculty_id]
    );
    
    if (testCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Test not found or access denied'
      });
    }
    
    const questionsResult = await pool.query(
      'SELECT * FROM questions WHERE test_id = $1 ORDER BY id',
      [testId]
    );
    
    // Parse JSON fields and fetch tags for each question
    const questions = await Promise.all(questionsResult.rows.map(async (question) => {
      // Fetch tags for this question
      const tagsResult = await pool.query(
        `SELECT t.id, t.name, t.color 
         FROM tags t
         JOIN question_tags qt ON t.id = qt.tag_id
         WHERE qt.question_id = $1`,
        [question.id]
      );
      
      // Safely parse options
      let options = [];
      if (question.options) {
        try {
          options = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
        } catch (e) {
          console.error(`Error parsing options for question ${question.id}:`, e);
          options = [];
        }
      }
      
      // Safely parse hints
      let hints = [];
      if (question.hints) {
        try {
          hints = typeof question.hints === 'string' ? JSON.parse(question.hints) : question.hints;
        } catch (e) {
          console.error(`Error parsing hints for question ${question.id}:`, e);
          hints = [];
        }
      }
      
      return {
        ...question,
        options,
        hints,
        tags: tagsResult.rows
      };
    }));
    
    res.json({
      success: true,
      questions: questions
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching questions',
      error: error.message
    });
  }
});

// Get a specific question
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const faculty_id = req.user.id;
    
    const questionResult = await pool.query(
      `SELECT q.*, t.faculty_id
       FROM questions q
       JOIN tests t ON q.test_id = t.id
       WHERE q.id = $1 AND t.faculty_id = $2`,
      [id, faculty_id]
    );
    
    if (questionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    // Parse JSON fields
    const question = {
      ...questionResult.rows[0],
      options: questionResult.rows[0].options ? JSON.parse(questionResult.rows[0].options) : [],
      hints: questionResult.rows[0].hints ? JSON.parse(questionResult.rows[0].hints) : []
    };
    
    res.json({
      success: true,
      question: question
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching question'
    });
  }
});

// Create a new question
router.post('/', authMiddleware, async (req, res) => {
  try {
    const faculty_id = req.user.id;
    const {
      testId,
      questionText,
      options,
      correctAnswer,
      marks,
      questionType = 'multiple_choice',
      difficulty = 'easy',
      programmingLanguage,
      codeTemplate,
      timeLimitSeconds,
      memoryLimitMb,
      hints,
      explanation,
      tags = []
    } = req.body;
    
    // Verify the test belongs to the faculty
    const testCheck = await pool.query(
      'SELECT id FROM tests WHERE id = $1 AND faculty_id = $2',
      [testId, faculty_id]
    );
    
    if (testCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Test not found or access denied'
      });
    }
    
    const result = await pool.query(
      `INSERT INTO questions (test_id, question_text, options, correct_answer, marks,
                             question_type, difficulty, programming_language, code_template,
                             time_limit_seconds, memory_limit_mb, hints, explanation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [testId, questionText, JSON.stringify(options), correctAnswer, marks,
       questionType, difficulty, programmingLanguage, codeTemplate,
       timeLimitSeconds, memoryLimitMb, JSON.stringify(hints || []), explanation]
    );
    
    const question = result.rows[0];
    
    // Handle tags if provided
    let questionTags = [];
    if (tags && tags.length > 0) {
      const tagValues = tags.map(tagId => `(${question.id}, ${tagId})`).join(', ');
      await pool.query(`INSERT INTO question_tags (question_id, tag_id) VALUES ${tagValues}`);
      
      // Fetch the tags for the response
      const tagsResult = await pool.query(
        `SELECT t.id, t.name, t.color 
         FROM tags t
         JOIN question_tags qt ON t.id = qt.tag_id
         WHERE qt.question_id = $1`,
        [question.id]
      );
      questionTags = tagsResult.rows;
    }
    
    // Safely parse options and hints for response
    let parsedOptions = [];
    if (question.options) {
      try {
        parsedOptions = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
      } catch (e) {
        console.error(`Error parsing options for question ${question.id}:`, e);
      }
    }
    
    let parsedHints = [];
    if (question.hints) {
      try {
        parsedHints = typeof question.hints === 'string' ? JSON.parse(question.hints) : question.hints;
      } catch (e) {
        console.error(`Error parsing hints for question ${question.id}:`, e);
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      question: {
        ...question,
        options: parsedOptions,
        hints: parsedHints,
        tags: questionTags
      }
    });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating question'
    });
  }
});

// Update a question
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const faculty_id = req.user.id;
    const {
      questionText,
      options,
      correctAnswer,
      marks,
      questionType,
      difficulty,
      programmingLanguage,
      codeTemplate,
      timeLimitSeconds,
      memoryLimitMb,
      hints,
      explanation,
      tags = []
    } = req.body;
    
    // Verify the question belongs to the faculty
    const questionCheck = await pool.query(
      `SELECT q.id FROM questions q
       JOIN tests t ON q.test_id = t.id
       WHERE q.id = $1 AND t.faculty_id = $2`,
      [id, faculty_id]
    );
    
    if (questionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found or access denied'
      });
    }
    
    const result = await pool.query(
      `UPDATE questions SET
        question_text = $1, options = $2, correct_answer = $3, marks = $4,
        question_type = $5, difficulty = $6, programming_language = $7,
        code_template = $8, time_limit_seconds = $9, memory_limit_mb = $10,
        hints = $11, explanation = $12, updated_at = NOW()
       WHERE id = $13
       RETURNING *`,
      [questionText, JSON.stringify(options), correctAnswer, marks,
       questionType, difficulty, programmingLanguage, codeTemplate,
       timeLimitSeconds, memoryLimitMb, JSON.stringify(hints || []), explanation, id]
    );
    
    const question = result.rows[0];
    
    // Update tags if provided
    let questionTags = [];
    if (tags !== undefined) {
      // Remove existing tags
      await pool.query('DELETE FROM question_tags WHERE question_id = $1', [id]);
      
      // Add new tags
      if (tags.length > 0) {
        const tagValues = tags.map(tagId => `(${id}, ${tagId})`).join(', ');
        await pool.query(`INSERT INTO question_tags (question_id, tag_id) VALUES ${tagValues}`);
      }
    }
    
    // Fetch tags for response
    const tagsResult = await pool.query(
      `SELECT t.id, t.name, t.color 
       FROM tags t
       JOIN question_tags qt ON t.id = qt.tag_id
       WHERE qt.question_id = $1`,
      [id]
    );
    questionTags = tagsResult.rows;
    
    // Safely parse options and hints for response
    let parsedOptions = [];
    if (question.options) {
      try {
        parsedOptions = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
      } catch (e) {
        console.error(`Error parsing options for question ${question.id}:`, e);
      }
    }
    
    let parsedHints = [];
    if (question.hints) {
      try {
        parsedHints = typeof question.hints === 'string' ? JSON.parse(question.hints) : question.hints;
      } catch (e) {
        console.error(`Error parsing hints for question ${question.id}:`, e);
      }
    }
    
    res.json({
      success: true,
      message: 'Question updated successfully',
      question: {
        ...question,
        options: parsedOptions,
        hints: parsedHints,
        tags: questionTags
      }
    });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating question'
    });
  }
});

// Delete a question
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const faculty_id = req.user.id;
    
    // Verify the question belongs to the faculty
    const questionCheck = await pool.query(
      `SELECT q.id FROM questions q
       JOIN tests t ON q.test_id = t.id
       WHERE q.id = $1 AND t.faculty_id = $2`,
      [id, faculty_id]
    );
    
    if (questionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found or access denied'
      });
    }
    
    await pool.query('DELETE FROM questions WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting question'
    });
  }
});

// Bulk create questions
router.post('/bulk', authMiddleware, async (req, res) => {
  try {
    const faculty_id = req.user.id;
    const { testId, questions } = req.body;
    
    // Verify the test belongs to the faculty
    const testCheck = await pool.query(
      'SELECT id FROM tests WHERE id = $1 AND faculty_id = $2',
      [testId, faculty_id]
    );
    
    if (testCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Test not found or access denied'
      });
    }
    
    const values = questions.map(q => 
      `(${testId}, '${q.questionText.replace(/'/g, "''")}', '${JSON.stringify(q.options).replace(/'/g, "''")}', '${q.correctAnswer}', ${q.marks})`
    ).join(', ');
    
    const query = `INSERT INTO questions (test_id, question_text, options, correct_answer, marks) VALUES ${values} RETURNING *`;
    const result = await pool.query(query);
    
    res.status(201).json({
      success: true,
      message: `${questions.length} questions created successfully`,
      questions: result.rows
    });
  } catch (error) {
    console.error('Error bulk creating questions:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating questions'
    });
  }
});

// Test Cases Routes

// Get test cases for a question
router.get('/:questionId/test-cases', authMiddleware, async (req, res) => {
  try {
    const { questionId } = req.params;
    const faculty_id = req.user.id;
    
    // Verify the question belongs to the faculty
    const questionCheck = await pool.query(
      `SELECT q.id FROM questions q
       JOIN tests t ON q.test_id = t.id
       WHERE q.id = $1 AND t.faculty_id = $2`,
      [questionId, faculty_id]
    );
    
    if (questionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found or access denied'
      });
    }
    
    const testCasesResult = await pool.query(
      'SELECT * FROM test_cases WHERE question_id = $1 ORDER BY id',
      [questionId]
    );
    
    res.json({
      success: true,
      testCases: testCasesResult.rows
    });
  } catch (error) {
    console.error('Error fetching test cases:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching test cases'
    });
  }
});

// Add test case to a question
router.post('/:questionId/test-cases', authMiddleware, async (req, res) => {
  try {
    const { questionId } = req.params;
    const faculty_id = req.user.id;
    const { input, expectedOutput, isSample = true, isHidden = false, timeLimitSeconds = 1, memoryLimitMb = 256 } = req.body;
    
    // Verify the question belongs to the faculty
    const questionCheck = await pool.query(
      `SELECT q.id FROM questions q
       JOIN tests t ON q.test_id = t.id
       WHERE q.id = $1 AND t.faculty_id = $2`,
      [questionId, faculty_id]
    );
    
    if (questionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found or access denied'
      });
    }
    
    const result = await pool.query(
      `INSERT INTO test_cases (question_id, input, expected_output, is_sample, is_hidden, time_limit_seconds, memory_limit_mb)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [questionId, input, expectedOutput, isSample, isHidden, timeLimitSeconds, memoryLimitMb]
    );
    
    res.status(201).json({
      success: true,
      message: 'Test case added successfully',
      testCase: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding test case:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding test case'
    });
  }
});

// Update test case
router.put('/test-cases/:testCaseId', authMiddleware, async (req, res) => {
  try {
    const { testCaseId } = req.params;
    const faculty_id = req.user.id;
    const { input, expectedOutput, isSample, isHidden, timeLimitSeconds, memoryLimitMb } = req.body;
    
    // Verify the test case belongs to the faculty's question
    const testCaseCheck = await pool.query(
      `SELECT tc.id FROM test_cases tc
       JOIN questions q ON tc.question_id = q.id
       JOIN tests t ON q.test_id = t.id
       WHERE tc.id = $1 AND t.faculty_id = $2`,
      [testCaseId, faculty_id]
    );
    
    if (testCaseCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Test case not found or access denied'
      });
    }
    
    const result = await pool.query(
      `UPDATE test_cases SET
        input = $1, expected_output = $2, is_sample = $3, is_hidden = $4,
        time_limit_seconds = $5, memory_limit_mb = $6
       WHERE id = $7 RETURNING *`,
      [input, expectedOutput, isSample, isHidden, timeLimitSeconds, memoryLimitMb, testCaseId]
    );
    
    res.json({
      success: true,
      message: 'Test case updated successfully',
      testCase: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating test case:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating test case'
    });
  }
});

// Delete test case
router.delete('/test-cases/:testCaseId', authMiddleware, async (req, res) => {
  try {
    const { testCaseId } = req.params;
    const faculty_id = req.user.id;
    
    // Verify the test case belongs to the faculty's question
    const testCaseCheck = await pool.query(
      `SELECT tc.id FROM test_cases tc
       JOIN questions q ON tc.question_id = q.id
       JOIN tests t ON q.test_id = t.id
       WHERE tc.id = $1 AND t.faculty_id = $2`,
      [testCaseId, faculty_id]
    );
    
    if (testCaseCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Test case not found or access denied'
      });
    }
    
    await pool.query('DELETE FROM test_cases WHERE id = $1', [testCaseId]);
    
    res.json({
      success: true,
      message: 'Test case deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting test case:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting test case'
    });
  }
});

// Tags Routes

// Get all available tags
router.get('/tags/all', authMiddleware, async (req, res) => {
  try {
    const tagsResult = await pool.query('SELECT * FROM tags ORDER BY name');
    
    res.json({
      success: true,
      tags: tagsResult.rows
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tags'
    });
  }
});

// Get tags for a specific question
router.get('/:questionId/tags', authMiddleware, async (req, res) => {
  try {
    const { questionId } = req.params;
    const faculty_id = req.user.id;
    
    // Verify the question belongs to the faculty
    const questionCheck = await pool.query(
      `SELECT q.id FROM questions q
       JOIN tests t ON q.test_id = t.id
       WHERE q.id = $1 AND t.faculty_id = $2`,
      [questionId, faculty_id]
    );
    
    if (questionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found or access denied'
      });
    }
    
    const tagsResult = await pool.query(
      `SELECT t.* FROM tags t
       JOIN question_tags qt ON t.id = qt.tag_id
       WHERE qt.question_id = $1 ORDER BY t.name`,
      [questionId]
    );
    
    res.json({
      success: true,
      tags: tagsResult.rows
    });
  } catch (error) {
    console.error('Error fetching question tags:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching question tags'
    });
  }
});

module.exports = router;