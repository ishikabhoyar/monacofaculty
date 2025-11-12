/**
 * Database Migration Script for Question Allocation Feature
 * 
 * This script will:
 * 1. Create student_question_allocations table
 * 2. Add enable_question_randomization column to tests table
 * 3. Add questions_per_student column to tests table
 * 4. Create necessary indexes
 * 
 * Run with: node run-migration.js
 */

const pool = require('./db');

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('========================================');
    console.log('Question Allocation Feature Migration');
    console.log('========================================\n');

    await client.query('BEGIN');

    // Step 1: Add columns to tests table
    console.log('Step 1: Adding columns to tests table...');
    
    // Check if enable_question_randomization exists
    const col1Check = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tests' 
      AND column_name = 'enable_question_randomization'
    `);
    
    if (col1Check.rows.length === 0) {
      await client.query(`
        ALTER TABLE tests 
        ADD COLUMN enable_question_randomization BOOLEAN DEFAULT false
      `);
      console.log('✅ Added enable_question_randomization column');
    } else {
      console.log('⏭️  enable_question_randomization column already exists');
    }

    // Check if questions_per_student exists
    const col2Check = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tests' 
      AND column_name = 'questions_per_student'
    `);
    
    if (col2Check.rows.length === 0) {
      await client.query(`
        ALTER TABLE tests 
        ADD COLUMN questions_per_student INTEGER DEFAULT NULL
      `);
      console.log('✅ Added questions_per_student column');
    } else {
      console.log('⏭️  questions_per_student column already exists');
    }

    // Step 2: Create student_question_allocations table
    console.log('\nStep 2: Creating student_question_allocations table...');
    
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'student_question_allocations'
    `);
    
    if (tableCheck.rows.length === 0) {
      await client.query(`
        CREATE TABLE student_question_allocations (
          id SERIAL PRIMARY KEY,
          test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
          student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
          question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
          allocation_seed INTEGER NOT NULL,
          allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(test_id, student_id, question_id)
        )
      `);
      console.log('✅ Created student_question_allocations table');
    } else {
      console.log('⏭️  student_question_allocations table already exists');
    }

    // Step 3: Create indexes
    console.log('\nStep 3: Creating indexes...');
    
    const indexes = [
      {
        name: 'idx_student_question_alloc_test',
        sql: 'CREATE INDEX IF NOT EXISTS idx_student_question_alloc_test ON student_question_allocations(test_id)'
      },
      {
        name: 'idx_student_question_alloc_student',
        sql: 'CREATE INDEX IF NOT EXISTS idx_student_question_alloc_student ON student_question_allocations(student_id)'
      },
      {
        name: 'idx_student_question_alloc_test_student',
        sql: 'CREATE INDEX IF NOT EXISTS idx_student_question_alloc_test_student ON student_question_allocations(test_id, student_id)'
      }
    ];

    for (const index of indexes) {
      await client.query(index.sql);
      console.log(`✅ Created index: ${index.name}`);
    }

    // Step 4: Add comments
    console.log('\nStep 4: Adding column comments...');
    
    await client.query(`
      COMMENT ON COLUMN tests.enable_question_randomization IS 
      'When true, questions are allocated uniquely to prevent consecutive roll numbers from getting same questions'
    `);
    
    await client.query(`
      COMMENT ON COLUMN tests.questions_per_student IS 
      'Number of questions to allocate per student. NULL means all questions in the test'
    `);
    
    await client.query(`
      COMMENT ON TABLE student_question_allocations IS 
      'Stores personalized question allocation for each student to ensure consecutive roll numbers get different questions'
    `);
    
    console.log('✅ Added documentation comments');

    await client.query('COMMIT');

    console.log('\n========================================');
    console.log('✅ Migration completed successfully!');
    console.log('========================================\n');
    
    // Verify installation
    console.log('Verification:');
    
    const verifyTable = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'student_question_allocations'
    `);
    console.log(`✅ student_question_allocations table: ${verifyTable.rows[0].count === '1' ? 'EXISTS' : 'MISSING'}`);
    
    const verifyColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tests' 
      AND column_name IN ('enable_question_randomization', 'questions_per_student')
    `);
    console.log(`✅ New columns in tests table: ${verifyColumns.rows.length}/2 found`);
    
    const verifyIndexes = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'student_question_allocations'
    `);
    console.log(`✅ Indexes created: ${verifyIndexes.rows.length} indexes`);
    
    console.log('\n🎉 Question allocation feature is ready to use!\n');
    console.log('Next steps:');
    console.log('1. Test allocation: node test-allocation.js');
    console.log('2. Read docs: QUESTION_ALLOCATION_QUICKSTART.md');
    console.log('3. Create test with enableQuestionRandomization: true\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    console.error('\nStack trace:', error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error.message);
      process.exit(1);
    });
}

module.exports = runMigration;
