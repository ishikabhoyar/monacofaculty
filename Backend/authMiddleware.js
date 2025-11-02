const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function authMiddleware(req, res, next) {
  // Log the auth header for debugging
  console.log('Auth header:', req.headers.authorization);
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Authentication failed: No authorization header provided.' });
  }
  
  const token = authHeader.split(' ')[1];

  if (!token || token === 'undefined' || token === 'null') {
    return res.status(401).json({ success: false, message: 'Authentication failed: No valid token provided.' });
  }

  // Check if this is a login request (with Google token) or a regular request (with our JWT)
  const isLoginRequest = req.path === '/api/login';

  try {
    if (isLoginRequest) {
      console.log('Processing Google login request...');
      
      // For login requests, verify the Google token
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      const { email, name, sub: google_id } = payload;
      
      console.log('Google token verified for user:', email);

      // Check if email is in the allowed_emails list
      const allowedEmailResult = await pool.query(
        'SELECT * FROM allowed_emails WHERE email = $1 AND is_active = true',
        [email]
      );

      if (allowedEmailResult.rows.length === 0) {
        console.log('Email not authorized:', email);
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Your email is not authorized to access this system.' 
        });
      }

      console.log('Email is authorized:', email);

      // Check if user exists in the database
      const userResult = await pool.query('SELECT * FROM faculties WHERE email = $1', [email]);

      if (userResult.rows.length === 0) {
        console.log('Creating new user:', email);
        // If user does not exist, create a new user
        const newUser = await pool.query(
          'INSERT INTO faculties (name, email, google_id) VALUES ($1, $2, $3) RETURNING *',
          [name, email, google_id]
        );
        req.user = newUser.rows[0];
        console.log('New user created:', req.user.id);
      } else {
        req.user = userResult.rows[0];
        console.log('Existing user found:', req.user.id);
      }
    } else {
      // For regular API requests, verify our JWT
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Fetch the complete user from the database
        const userResult = await pool.query('SELECT * FROM faculties WHERE id = $1', [decoded.id]);
        
        if (userResult.rows.length === 0) {
          return res.status(401).json({ success: false, message: 'User not found.' });
        }
        
        req.user = userResult.rows[0];
      } catch (jwtError) {
        console.error('JWT verification error:', jwtError);
        return res.status(401).json({ success: false, message: 'Invalid token.' });
      }
    }

    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    console.error('Error details:', error.message);
    
    // Check if token is expired
    if (error.message && error.message.includes('expired')) {
      return res.status(401).json({ success: false, message: 'Authentication failed: Token expired.' });
    }
    
    // Check for Google API errors
    if (error.message && error.message.includes('Wrong number of segments')) {
      return res.status(401).json({ success: false, message: 'Authentication failed: Invalid Google token format.' });
    }
    
    res.status(401).json({ success: false, message: `Authentication failed: ${error.message || 'Invalid token.'}` });
  }
}

module.exports = authMiddleware;