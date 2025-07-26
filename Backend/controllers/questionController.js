// controllers/questionController.js
const supabase = require('../config/supabase');

// Create a new question
exports.createQuestion = async (req, res, next) => {
  try {
    const {
      test_id,
      question_number,
      title,
      problem_statement,
      sample_input,
      sample_output,
      constraints_info,
      max_score,
      time_limit_seconds,
      memory_limit_mb,
      allowed_languages,
      starter_code
    } = req.body;
    
    // Validate required fields
    if (!test_id || !title || !problem_statement) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['test_id', 'title', 'problem_statement'] 
      });
    }

    // Check if the user has permission to add questions to this test
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('faculty_id')
      .eq('test_id', test_id)
      .single();
    
    if (testError) throw testError;
    
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    
    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();
    
    // Check permissions (only test owner or admin can add questions)
    if (userData?.role === 'faculty' && test.faculty_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to add questions to this test' });
    }
    
    // Determine question number if not provided
    let finalQuestionNumber = question_number;
    
    if (!finalQuestionNumber) {
      // Get the highest question number and increment by 1
      const { data: maxQuestion, error: maxError } = await supabase
        .from('questions')
        .select('question_number')
        .eq('test_id', test_id)
        .order('question_number', { ascending: false })
        .limit(1);
      
      if (maxError) throw maxError;
      
      finalQuestionNumber = maxQuestion.length > 0 ? maxQuestion[0].question_number + 1 : 1;
    }
    
    // Create the question
    const { data, error } = await supabase
      .from('questions')
      .insert({
        test_id,
        question_number: finalQuestionNumber,
        title,
        problem_statement,
        sample_input,
        sample_output,
        constraints_info,
        max_score: max_score || 10.00,
        time_limit_seconds: time_limit_seconds || 30,
        memory_limit_mb: memory_limit_mb || 128,
        allowed_languages: allowed_languages || null,
        starter_code: starter_code || null,
        is_active: true
      })
      .select();
    
    if (error) throw error;
    
    res.status(201).json(data[0]);
  } catch (error) {
    next(error);
  }
};

// Get a question by ID
exports.getQuestionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { data: question, error } = await supabase
      .from('questions')
      .select(`
        *,
        tests:test_id (
          faculty_id,
          is_published
        )
      `)
      .eq('question_id', id)
      .single();
    
    if (error) throw error;
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();
    
    // Faculty can only see questions from their tests
    if (userData?.role === 'faculty' && question.tests.faculty_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Students can only see questions from published tests
    if (userData?.role === 'student' && !question.tests.is_published) {
      return res.status(403).json({ error: 'This test is not published yet' });
    }
    
    res.status(200).json(question);
  } catch (error) {
    next(error);
  }
};

// Update a question
exports.updateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if question exists and get the test_id
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select(`
        test_id,
        tests:test_id (
          faculty_id,
          is_published
        )
      `)
      .eq('question_id', id)
      .single();
    
    if (questionError) throw questionError;
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();
    
    // Only test owner or admin can update
    if (userData?.role === 'faculty' && question.tests.faculty_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to update this question' });
    }
    
    // Don't allow updating questions in published tests
    if (question.tests.is_published && userData?.role !== 'admin') {
      return res.status(403).json({ error: 'Cannot update questions in a published test' });
    }
    
    // Remove fields that shouldn't be updated directly
    const {
      question_id,
      test_id,
      created_at,
      updated_at,
      ...updateData
    } = req.body;
    
    // Update the question
    const { data, error } = await supabase
      .from('questions')
      .update(updateData)
      .eq('question_id', id)
      .select();
    
    if (error) throw error;
    
    res.status(200).json(data[0]);
  } catch (error) {
    next(error);
  }
};

// Delete a question
exports.deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if question exists and get the test_id
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select(`
        test_id,
        tests:test_id (
          faculty_id,
          is_published
        )
      `)
      .eq('question_id', id)
      .single();
    
    if (questionError) throw questionError;
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();
    
    // Only test owner or admin can delete
    if (userData?.role === 'faculty' && question.tests.faculty_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this question' });
    }
    
    // Don't allow deleting questions in published tests
    if (question.tests.is_published && userData?.role !== 'admin') {
      return res.status(403).json({ error: 'Cannot delete questions from a published test' });
    }
    
    // Delete the question
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('question_id', id);
    
    if (error) throw error;
    
    res.status(200).json({ message: 'Question deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Submit a solution for a question
exports.submitSolution = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { attempt_id, language_id, code } = req.body;
    
    // Validate required fields
    if (!attempt_id || !language_id || !code) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['attempt_id', 'language_id', 'code']
      });
    }
    
    // Check if question exists
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('question_id', id)
      .single();
    
    if (questionError) throw questionError;
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    // Check if the language is allowed for this question
    if (question.allowed_languages && Array.isArray(question.allowed_languages)) {
      if (!question.allowed_languages.includes(language_id)) {
        return res.status(400).json({ 
          error: 'Language not allowed for this question',
          allowedLanguages: question.allowed_languages
        });
      }
    }
    
    // Save the code to a file or database
    // For simplicity, we'll store it directly in the database
    // In a real-world scenario, you might want to save it to a file system or object storage
    const codeFilePath = `submissions/${attempt_id}/${id}/${language_id}.txt`;
    
    // Create submission record
    const { data, error } = await supabase
      .from('question_submissions')
      .upsert({
        attempt_id,
        question_id: id,
        language_id,
        submission_time: new Date(),
        code_file_path: codeFilePath,
        status: 'running', // Will be updated by the code execution service
        score: 0.00,
        test_cases_passed: 0,
        total_test_cases: 0
      })
      .select();
    
    if (error) throw error;
    
    // Store the actual code
    // In a real system, this would be saved to a file system or object storage
    // For this example, we'll assume we have a separate table for storing code
    const { error: codeError } = await supabase
      .from('submission_code')
      .upsert({
        submission_id: data[0].submission_id,
        code
      });
    
    if (codeError) throw codeError;
    
    // In a real-world scenario, you would now send this to a code execution service
    // For now, we'll just simulate success
    setTimeout(async () => {
      try {
        // Simulate code execution and update the submission record
        await supabase
          .from('question_submissions')
          .update({
            status: 'completed',
            execution_time_ms: Math.floor(Math.random() * 500),
            memory_used_mb: Math.random() * 50,
            score: question.max_score, // In reality, would be based on test cases
            test_cases_passed: 1,
            total_test_cases: 1
          })
          .eq('submission_id', data[0].submission_id);
      } catch (error) {
        console.error('Error updating submission:', error);
      }
    }, 2000);
    
    res.status(202).json({
      message: 'Submission received and is being processed',
      submission_id: data[0].submission_id
    });
  } catch (error) {
    next(error);
  }
};
