require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function addEmail() {
  const email = 'ishika.b@somaiya.edu'; // Your email
  
  try {
    // Check if email already exists
    const checkResult = await pool.query(
      'SELECT * FROM allowed_emails WHERE email = $1',
      [email]
    );
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Email already exists in allowed list!');
      console.log('Status:', checkResult.rows[0].is_active ? 'Active' : 'Inactive');
      
      // Make sure it's active
      await pool.query(
        'UPDATE allowed_emails SET is_active = true WHERE email = $1',
        [email]
      );
      console.log('✅ Ensured email is active!');
    } else {
      // Add new email
      await pool.query(
        'INSERT INTO allowed_emails (email, notes, is_active) VALUES ($1, $2, $3)',
        [email, 'Faculty member - added automatically', true]
      );
      console.log('✅ Successfully added', email, 'to allowed emails!');
    }
    
    // Show all allowed emails
    const allEmails = await pool.query(
      'SELECT email, is_active, added_at FROM allowed_emails ORDER BY added_at DESC'
    );
    
    console.log('\n📧 Current Allowed Emails:');
    console.log('─'.repeat(60));
    allEmails.rows.forEach(row => {
      const status = row.is_active ? '✅' : '❌';
      console.log(`${status} ${row.email} (Added: ${new Date(row.added_at).toLocaleDateString()})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addEmail();
