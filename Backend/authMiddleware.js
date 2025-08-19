const { OAuth2Client } = require('google-auth-library');
const pool = require('./db');

const CLIENT_ID = '586378657128-smg8t52eqbji66c3eg967f70hsr54q5r.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication failed: No token provided.' });
  }

  try {
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

    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ message: 'Authentication failed: Invalid token.' });
  }
}

module.exports = authMiddleware;