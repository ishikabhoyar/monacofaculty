const pool = require('../db');

/**
 * Question Allocator - Ensures consecutive roll numbers don't get the same questions
 * 
 * Algorithm:
 * - Extracts numeric portion from roll number (e.g., 16010125001 -> last 3 digits: 001)
 * - Uses this as a seed to determine question allocation
 * - Consecutive roll numbers will have different allocation patterns
 */

class QuestionAllocator {
  /**
   * Extract the numeric seed from roll number
   * For roll numbers like 16010125001, 16010125002, etc.
   * We use the last few digits to create variation
   */
  static extractRollNumberSeed(rollNumber) {
    // Remove any non-numeric characters
    const numericPart = rollNumber.toString().replace(/\D/g, '');
    
    // Use last 3 digits as seed to ensure consecutive numbers are different
    const seed = parseInt(numericPart.slice(-3)) || 0;
    
    return seed;
  }

  /**
   * Shuffle array using a seeded random number generator
   * This ensures the same seed produces the same shuffle every time
   */
  static seededShuffle(array, seed) {
    const shuffled = [...array];
    
    // Simple seeded random number generator (Linear Congruential Generator)
    let random = seed;
    const next = () => {
      random = (random * 9301 + 49297) % 233280;
      return random / 233280;
    };
    
    // Fisher-Yates shuffle with seeded random
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  /**
   * Allocate questions to a student for a test
   * Ensures consecutive roll numbers get different question sets
   */
  static async allocateQuestionsToStudent(testId, studentId) {
    try {
      // Get student roll number
      const studentResult = await pool.query(
        'SELECT roll_number FROM students WHERE id = $1',
        [studentId]
      );
      
      if (studentResult.rows.length === 0) {
        throw new Error('Student not found');
      }
      
      const rollNumber = studentResult.rows[0].roll_number;
      const seed = this.extractRollNumberSeed(rollNumber);
      
      // Get test configuration
      const testResult = await pool.query(
        'SELECT enable_question_randomization, questions_per_student FROM tests WHERE id = $1',
        [testId]
      );
      
      if (testResult.rows.length === 0) {
        throw new Error('Test not found');
      }
      
      const test = testResult.rows[0];
      
      // Check if allocation already exists
      const existingAllocation = await pool.query(
        'SELECT COUNT(*) as count FROM student_question_allocations WHERE test_id = $1 AND student_id = $2',
        [testId, studentId]
      );
      
      if (parseInt(existingAllocation.rows[0].count) > 0) {
        // Allocation already exists, return existing allocation
        return await this.getStudentQuestions(testId, studentId);
      }
      
      // Get all questions for this test
      const questionsResult = await pool.query(
        'SELECT id FROM questions WHERE test_id = $1 ORDER BY id',
        [testId]
      );
      
      let questionIds = questionsResult.rows.map(q => q.id);
      
      if (questionIds.length === 0) {
        return [];
      }
      
      // If randomization is enabled, shuffle questions based on roll number seed
      if (test.enable_question_randomization) {
        questionIds = this.seededShuffle(questionIds, seed);
      }
      
      // Limit questions if questions_per_student is set
      if (test.questions_per_student && test.questions_per_student < questionIds.length) {
        questionIds = questionIds.slice(0, test.questions_per_student);
      }
      
      // Insert allocations
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        for (const questionId of questionIds) {
          await client.query(
            `INSERT INTO student_question_allocations (test_id, student_id, question_id, allocation_seed)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (test_id, student_id, question_id) DO NOTHING`,
            [testId, studentId, questionId, seed]
          );
        }
        
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      
      return await this.getStudentQuestions(testId, studentId);
      
    } catch (error) {
      console.error('Error allocating questions:', error);
      throw error;
    }
  }

  /**
   * Get allocated questions for a student
   */
  static async getStudentQuestions(testId, studentId) {
    const result = await pool.query(
      `SELECT q.*, sqa.allocation_seed
       FROM questions q
       JOIN student_question_allocations sqa ON q.id = sqa.question_id
       WHERE sqa.test_id = $1 AND sqa.student_id = $2
       ORDER BY sqa.id`,
      [testId, studentId]
    );
    
    return result.rows;
  }

  /**
   * Get all questions for a test (when randomization is disabled)
   */
  static async getAllTestQuestions(testId) {
    const result = await pool.query(
      'SELECT * FROM questions WHERE test_id = $1 ORDER BY id',
      [testId]
    );
    
    return result.rows;
  }

  /**
   * Check if a test has question randomization enabled
   */
  static async isRandomizationEnabled(testId) {
    const result = await pool.query(
      'SELECT enable_question_randomization FROM tests WHERE id = $1',
      [testId]
    );
    
    if (result.rows.length === 0) {
      return false;
    }
    
    return result.rows[0].enable_question_randomization || false;
  }

  /**
   * Allocate questions to all students in a batch for a test
   * Useful for pre-allocating before test starts
   */
  static async allocateQuestionsToAllStudents(testId, batchId) {
    try {
      // Get all students in the batch
      const studentsResult = await pool.query(
        `SELECT DISTINCT s.id, s.roll_number
         FROM students s
         JOIN student_batches sb ON s.id = sb.student_id
         WHERE sb.batch_id = $1
         ORDER BY s.roll_number`,
        [batchId]
      );
      
      const results = [];
      
      for (const student of studentsResult.rows) {
        try {
          await this.allocateQuestionsToStudent(testId, student.id);
          results.push({
            studentId: student.id,
            rollNumber: student.roll_number,
            success: true
          });
        } catch (error) {
          results.push({
            studentId: student.id,
            rollNumber: student.roll_number,
            success: false,
            error: error.message
          });
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('Error allocating questions to all students:', error);
      throw error;
    }
  }

  /**
   * Get allocation statistics for a test
   */
  static async getAllocationStats(testId) {
    try {
      const stats = await pool.query(
        `SELECT 
          COUNT(DISTINCT student_id) as total_students_allocated,
          COUNT(*) as total_allocations,
          COUNT(DISTINCT question_id) as unique_questions_used,
          AVG(questions_per_student)::INTEGER as avg_questions_per_student
         FROM (
           SELECT student_id, COUNT(question_id) as questions_per_student
           FROM student_question_allocations
           WHERE test_id = $1
           GROUP BY student_id
         ) as student_counts`,
        [testId]
      );
      
      // Get total questions available
      const totalQuestionsResult = await pool.query(
        'SELECT COUNT(*) as total_questions FROM questions WHERE test_id = $1',
        [testId]
      );
      
      return {
        ...stats.rows[0],
        total_questions_available: parseInt(totalQuestionsResult.rows[0].total_questions)
      };
      
    } catch (error) {
      console.error('Error getting allocation stats:', error);
      throw error;
    }
  }

  /**
   * Verify that consecutive roll numbers have different questions
   */
  static async verifyConsecutiveRollNumbersDifferent(testId, batchId) {
    try {
      // Get all students ordered by roll number
      const studentsResult = await pool.query(
        `SELECT DISTINCT s.id, s.roll_number
         FROM students s
         JOIN student_batches sb ON s.id = sb.student_id
         WHERE sb.batch_id = $1
         ORDER BY s.roll_number`,
        [batchId]
      );
      
      const students = studentsResult.rows;
      const violations = [];
      
      for (let i = 0; i < students.length - 1; i++) {
        const student1 = students[i];
        const student2 = students[i + 1];
        
        // Get questions for both students
        const questions1Result = await pool.query(
          `SELECT question_id FROM student_question_allocations 
           WHERE test_id = $1 AND student_id = $2 
           ORDER BY question_id`,
          [testId, student1.id]
        );
        
        const questions2Result = await pool.query(
          `SELECT question_id FROM student_question_allocations 
           WHERE test_id = $1 AND student_id = $2 
           ORDER BY question_id`,
          [testId, student2.id]
        );
        
        const q1 = questions1Result.rows.map(r => r.question_id);
        const q2 = questions2Result.rows.map(r => r.question_id);
        
        // Check if question sets are identical
        const identical = q1.length === q2.length && 
                         q1.every((val, idx) => val === q2[idx]);
        
        if (identical && q1.length > 0) {
          violations.push({
            student1: student1.roll_number,
            student2: student2.roll_number,
            questions: q1
          });
        }
      }
      
      return {
        valid: violations.length === 0,
        violations: violations,
        message: violations.length === 0 
          ? 'All consecutive roll numbers have different question sets'
          : `Found ${violations.length} violations where consecutive roll numbers have identical questions`
      };
      
    } catch (error) {
      console.error('Error verifying allocations:', error);
      throw error;
    }
  }
}

module.exports = QuestionAllocator;
