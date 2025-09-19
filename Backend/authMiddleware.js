const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const CLIENT_ID = '586378657128-smg8t52eqbji66c3eg967f70hsr54q5r.apps.googleusercontent.com';
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
      // For login requests, verify the Google token
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      const { email, name, sub: google_id } = payload;

      // Check if user exists in the database
      const userResult = await pool.query('SELECT * FROM faculties WHERE email = $1', [email]);

      if (userResult.rows.length === 0) {
        // If user does not exist, create a new user
        const newUser = await pool.query(
          'INSERT INTO faculties (name, email, google_id) VALUES ($1, $2, $3) RETURNING *',
          [name, email, google_id]
        );
        req.user = newUser.rows[0];
      } else {
        req.user = userResult.rows[0];
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
    
    // Check if token is expired
    if (error.message && error.message.includes('expired')) {
      return res.status(401).json({ success: false, message: 'Authentication failed: Token expired.' });
    }
    
    res.status(401).json({ success: false, message: 'Authentication failed: Invalid token.' });
  }
}

module.exports = authMiddleware;