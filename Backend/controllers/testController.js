// controllers/testController.js
const supabase = require('../config/supabase');

// Get all tests (with appropriate filters based on user role)
exports.getAllTests = async (req, res, next) => {
  try {
    let query = supabase.from('tests').select('*');
    
    // If faculty, only show their tests
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();
      
    if (userData?.role === 'faculty') {
      query = query.eq('faculty_id', req.user.id);
    }
    
    // Apply filters if provided
    if (req.query.course_id) {
      query = query.eq('course_id', req.query.course_id);
    }
    
    if (req.query.is_published) {
      query = query.eq('is_published', req.query.is_published === 'true');
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// Get a specific test by ID
exports.getTestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .eq('test_id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: 'Test not found' });
    }
    
    // Check if user has access to this test
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();
    
    // Only allow access if user is admin, owner faculty, or student with access
    if (userData?.role === 'faculty' && data.faculty_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// Create a new test
exports.createTest = async (req, res, next) => {
  try {
    const {
      course_id,
      title,
      description,
      instructions,
      start_time,
      end_time,
      duration_minutes,
      password,
      max_attempts,
      allow_late_submission,
      late_penalty_percent
    } = req.body;
    
    // Validate required fields
    if (!course_id || !title || !start_time || !end_time || !duration_minutes) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['course_id', 'title', 'start_time', 'end_time', 'duration_minutes']
      });
    }
    
    // Create the test
    const { data, error } = await supabase
      .from('tests')
      .insert({
        course_id,
        faculty_id: req.user.id,
        faculty_name: req.body.faculty_name || 'Faculty',
        title,
        description,
        instructions,
        start_time,
        end_time,
        duration_minutes,
        password,
        max_attempts: max_attempts || 1,
        is_published: false,
        allow_late_submission: allow_late_submission || false,
        late_penalty_percent: late_penalty_percent || 0
      })
      .select();
    
    if (error) throw error;
    
    res.status(201).json(data[0]);
  } catch (error) {
    next(error);
  }
};

// Update a test
exports.updateTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // First, check if user can modify this test
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('faculty_id')
      .eq('test_id', id)
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
    
    // Check permissions (only test owner or admin can update)
    if (userData?.role === 'faculty' && test.faculty_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to update this test' });
    }
    
    // Remove fields that shouldn't be updated directly
    const {
      test_id,
      faculty_id,
      created_at,
      updated_at,
      ...updateData
    } = req.body;
    
    // Don't allow changing is_published directly (use the publish endpoint)
    delete updateData.is_published;
    
    // Update the test
    const { data, error } = await supabase
      .from('tests')
      .update(updateData)
      .eq('test_id', id)
      .select();
    
    if (error) throw error;
    
    res.status(200).json(data[0]);
  } catch (error) {
    next(error);
  }
};

// Delete a test
exports.deleteTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // First, check if user can delete this test
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('faculty_id')
      .eq('test_id', id)
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
    
    // Check permissions (only test owner or admin can delete)
    if (userData?.role === 'faculty' && test.faculty_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this test' });
    }
    
    // Delete the test (cascade will handle related questions)
    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('test_id', id);
    
    if (error) throw error;
    
    res.status(200).json({ message: 'Test deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Publish or unpublish a test
exports.publishTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { publish } = req.body;
    
    if (typeof publish !== 'boolean') {
      return res.status(400).json({ error: 'Publish status must be a boolean' });
    }
    
    // Check if user can publish this test
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('faculty_id')
      .eq('test_id', id)
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
    
    // Only owner or admin can publish/unpublish
    if (userData?.role === 'faculty' && test.faculty_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to publish this test' });
    }
    
    // Check if the test has questions before publishing
    if (publish) {
      const { count, error: countError } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('test_id', id);
      
      if (countError) throw countError;
      
      if (count === 0) {
        return res.status(400).json({ error: 'Cannot publish a test with no questions' });
      }
    }
    
    // Update the publish status
    const { data, error } = await supabase
      .from('tests')
      .update({ is_published: publish })
      .eq('test_id', id)
      .select();
    
    if (error) throw error;
    
    res.status(200).json(data[0]);
  } catch (error) {
    next(error);
  }
};

// Get all questions for a test
exports.getTestQuestions = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('faculty_id, is_published')
      .eq('test_id', id)
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
    
    // Faculty can only see their own tests
    if (userData?.role === 'faculty' && test.faculty_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Students can only see published tests
    if (userData?.role === 'student' && !test.is_published) {
      return res.status(403).json({ error: 'This test is not published yet' });
    }
    
    // Get questions
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('test_id', id)
      .order('question_number', { ascending: true });
    
    if (error) throw error;
    
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
