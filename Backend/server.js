const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const authMiddleware = require('./authMiddleware');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

async function checkDatabaseConnection() {
  try {
    const client = await pool.connect();
    console.log('Database connected successfully!');
    const result = await client.query('SELECT NOW()');
    console.log('Sample query result:', result.rows[0]);
    client.release();
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
}

app.get('/', (req, res) => {
  res.send('Hello from the MonacoFaculty backend!');
});

// API routes
const testRoutes = require('./routes/tests');
const facultyRoutes = require('./routes/faculty');

// Use routes
app.use('/api/tests', testRoutes);
app.use('/api/faculty', facultyRoutes);

app.post('/api/login', authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

checkDatabaseConnection();

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});