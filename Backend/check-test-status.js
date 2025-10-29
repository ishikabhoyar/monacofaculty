require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkTestStatus() {
  try {
    console.log('Checking test status...\n');
    console.log('Current server time (NOW()):', new Date().toISOString());
    
    // First check the column types
    const columnInfo = await pool.query(`
      SELECT column_name, data_type, datetime_precision
      FROM information_schema.columns
      WHERE table_name = 'tests' 
      AND column_name IN ('start_time', 'end_time');
    `);
    
    console.log('\nColumn types:');
    columnInfo.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
    const result = await pool.query(`
      SELECT 
        id,
        title,
        start_time,
        end_time,
        NOW() as current_time,
        timezone('UTC', NOW()) as utc_time,
        timezone('Asia/Kolkata', NOW()) as ist_time,
        CASE 
          WHEN end_time < NOW() THEN 'Completed (OLD)'
          WHEN start_time <= NOW() AND end_time >= NOW() THEN 'Active (OLD)'
          ELSE 'Upcoming (OLD)'
        END as old_status,
        CASE 
          WHEN end_time AT TIME ZONE 'Asia/Kolkata' < NOW() THEN 'Completed'
          WHEN start_time AT TIME ZONE 'Asia/Kolkata' <= NOW() AND end_time AT TIME ZONE 'Asia/Kolkata' >= NOW() THEN 'Active'
          ELSE 'Upcoming'
        END as new_status
      FROM tests
      ORDER BY start_time DESC;
    `);

    console.log('\nTests in database:\n');
    result.rows.forEach(test => {
      console.log('─'.repeat(80));
      console.log(`ID: ${test.id}`);
      console.log(`Title: ${test.title}`);
      console.log(`Start Time: ${test.start_time}`);
      console.log(`End Time: ${test.end_time}`);
      console.log(`Current Time (NOW()): ${test.current_time}`);
      console.log(`Current Time (UTC): ${test.utc_time}`);
      console.log(`Current Time (IST): ${test.ist_time}`);
      console.log(`Old Status (BROKEN): ${test.old_status}`);
      console.log(`New Status (FIXED): ${test.new_status}`);
      
      // Additional checks
      const now = new Date(test.current_time);
      const start = new Date(test.start_time);
      const end = new Date(test.end_time);
      
      console.log(`\nTime Comparisons:`);
      console.log(`  Start <= Now: ${start <= now} (${start.toISOString()} <= ${now.toISOString()})`);
      console.log(`  End >= Now: ${end >= now} (${end.toISOString()} >= ${now.toISOString()})`);
      console.log(`  Should be Active: ${start <= now && end >= now}`);
      console.log();
    });
    
    console.log('═'.repeat(80));
    
  } catch (error) {
    console.error('Error checking test status:', error);
  } finally {
    await pool.end();
  }
}

checkTestStatus();
