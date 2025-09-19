require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkDatabaseStructure() {
  try {
    console.log('Checking database structure...');

    // Check existing tables
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('Existing tables:', tablesResult.rows.map(row => row.table_name));

    // Check columns in questions table
    const questionsColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'questions' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log('\nQuestions table columns:');
    questionsColumns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
    });

    // Check test_cases table
    const testCasesColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'test_cases' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log('\nTest cases table columns:');
    testCasesColumns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
    });

    // Check tags table
    const tagsResult = await pool.query('SELECT COUNT(*) as count FROM tags');
    console.log(`\nTags table has ${tagsResult.rows[0].count} records`);

    // List some tags
    const tagsList = await pool.query('SELECT name, description FROM tags ORDER BY name LIMIT 5');
    console.log('Sample tags:');
    tagsList.rows.forEach(tag => console.log(`  - ${tag.name}: ${tag.description}`));

    // Check new question columns exist
    const newColumns = ['question_type', 'difficulty', 'programming_language', 'code_template', 'hints', 'explanation'];
    const existingNewColumns = questionsColumns.rows.filter(col => newColumns.includes(col.column_name));

    console.log(`\n✅ Found ${existingNewColumns.length}/${newColumns.length} new question columns:`);
    existingNewColumns.forEach(col => console.log(`  - ${col.column_name}`));

    if (existingNewColumns.length === newColumns.length) {
      console.log('🎉 All new question columns are present!');
    } else {
      console.log('❌ Some new columns are missing');
    }

  } catch (error) {
    console.error('Error checking database structure:', error);
  } finally {
    await pool.end();
  }
}

checkDatabaseStructure();