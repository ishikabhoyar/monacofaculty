require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function migrateDatabase() {
  try {
    console.log('Starting database migration...');

    const client = await pool.connect();

    // Add new columns to questions table
    console.log('Adding new columns to questions table...');

    const newColumns = [
      'ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type VARCHAR(50) DEFAULT \'multiple_choice\'',
      'ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT \'easy\'',
      'ALTER TABLE questions ADD COLUMN IF NOT EXISTS programming_language VARCHAR(50)',
      'ALTER TABLE questions ADD COLUMN IF NOT EXISTS code_template TEXT',
      'ALTER TABLE questions ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER',
      'ALTER TABLE questions ADD COLUMN IF NOT EXISTS memory_limit_mb INTEGER',
      'ALTER TABLE questions ADD COLUMN IF NOT EXISTS hints TEXT',
      'ALTER TABLE questions ADD COLUMN IF NOT EXISTS explanation TEXT',
      'ALTER TABLE questions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      'ALTER TABLE questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    ];

    for (const column of newColumns) {
      console.log('Executing:', column.substring(0, 50) + '...');
      await client.query(column);
    }

    // Create test_cases table
    console.log('Creating test_cases table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_cases (
        id SERIAL PRIMARY KEY,
        question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
        input TEXT NOT NULL,
        expected_output TEXT NOT NULL,
        is_sample BOOLEAN DEFAULT true,
        is_hidden BOOLEAN DEFAULT false,
        time_limit_seconds INTEGER DEFAULT 1,
        memory_limit_mb INTEGER DEFAULT 256,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create tags table
    console.log('Creating tags table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        color VARCHAR(7),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create question_tags table
    console.log('Creating question_tags table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS question_tags (
        question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (question_id, tag_id)
      );
    `);

    // Create allowed_emails table
    console.log('Creating allowed_emails table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS allowed_emails (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        added_by VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        notes TEXT
      );
    `);

    // Create indexes for allowed_emails
    console.log('Creating indexes for allowed_emails...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_allowed_emails_email ON allowed_emails(email);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_allowed_emails_active ON allowed_emails(is_active);
    `);

    // Insert default tags if they don't exist
    console.log('Inserting default tags...');
    const defaultTags = [
      ['Array', 'Array manipulation and algorithms', '#FF6B6B'],
      ['String', 'String processing and algorithms', '#4ECDC4'],
      ['Linked List', 'Linked list operations and problems', '#45B7D1'],
      ['Stack', 'Stack-based problems and applications', '#96CEB4'],
      ['Queue', 'Queue and deque problems', '#FFEAA7'],
      ['Tree', 'Binary trees, BST, and tree traversals', '#DDA0DD'],
      ['Graph', 'Graph algorithms and traversals', '#98D8C8'],
      ['Dynamic Programming', 'DP problems and optimization', '#F7DC6F'],
      ['Greedy', 'Greedy algorithms and problems', '#BB8FCE'],
      ['Backtracking', 'Backtracking and recursion problems', '#85C1E9'],
      ['Sorting', 'Sorting algorithms and problems', '#F8C471'],
      ['Searching', 'Search algorithms and problems', '#82E0AA'],
      ['Hash Table', 'Hash table and map problems', '#F1948A'],
      ['Math', 'Mathematical problems and algorithms', '#AED6F1'],
      ['Bit Manipulation', 'Bit operations and problems', '#ABEBC6'],
      ['Two Pointers', 'Two pointer technique problems', '#F9E79F'],
      ['Sliding Window', 'Sliding window problems', '#D7BDE2'],
      ['Recursion', 'Recursive solutions and problems', '#A3E4D7']
    ];

    for (const [name, description, color] of defaultTags) {
      await client.query(
        'INSERT INTO tags (name, description, color) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
        [name, description, color]
      );
    }

    client.release();
    console.log('✅ Database migration completed successfully!');

  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await pool.end();
  }
}

migrateDatabase();