// controllers/authController.js
const supabase = require('../config/supabase');

// User registration
exports.register = async (req, res, next) => {
  try {
    const { email, password, name, role = 'student' } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['email', 'password', 'name']
      });
    }
    
    // First register with Supabase Auth
    console.log('Attempting to register:', { email, name, role });
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (authError) {
      console.log('Auth error during registration:', authError);
      throw authError;
    }
    
    // Create a user record
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        role: ['admin', 'faculty', 'student'].includes(role) ? role : 'student'
      })
      .select();
    
    if (error) {
      console.log('Error creating user record:', error);
      // If there's an error creating the user record, try to delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw error;
    }
    
    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: data[0].id,
        email: data[0].email,
        name: data[0].name,
        role: data[0].role
      }
    });
  } catch (error) {
    next(error);
  }
};

// User login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['email', 'password']
      });
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    // Get user details from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('name, role')
      .eq('id', data.user.id)
      .single();
    
    if (userError) throw userError;
    
    res.status(200).json({
      user: {
        id: data.user.id,
        email: data.user.email,
        name: userData?.name || 'User',
        role: userData?.role || 'student'
      },
      session: {
        access_token: data.session.access_token,
        expires_at: data.session.expires_at
      }
    });
  } catch (error) {
    next(error);
  }
};

// User logout
exports.logout = async (req, res, next) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
exports.getProfile = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    
    // Remove sensitive information
    delete data.password;
    
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// Password reset request
exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) throw error;
    
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    next(error);
  }
};
