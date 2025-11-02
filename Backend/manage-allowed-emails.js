require('dotenv').config();
const { Pool } = require('pg');
const readline = require('readline');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function listAllowedEmails() {
  const result = await pool.query(
    'SELECT id, email, added_at, is_active, notes FROM allowed_emails ORDER BY added_at DESC'
  );
  
  if (result.rows.length === 0) {
    console.log('\n📭 No allowed emails found.');
    return;
  }
  
  console.log('\n📧 Allowed Emails:');
  console.log('─'.repeat(80));
  result.rows.forEach(row => {
    const status = row.is_active ? '✅' : '❌';
    console.log(`${status} [${row.id}] ${row.email}`);
    console.log(`   Added: ${new Date(row.added_at).toLocaleString()}`);
    if (row.notes) console.log(`   Notes: ${row.notes}`);
    console.log('─'.repeat(80));
  });
}

async function addAllowedEmail() {
  const email = await question('\nEnter email to allow: ');
  const notes = await question('Notes (optional): ');
  
  try {
    await pool.query(
      'INSERT INTO allowed_emails (email, notes) VALUES ($1, $2)',
      [email.trim(), notes.trim() || null]
    );
    console.log(`✅ Added ${email} to allowed emails!`);
  } catch (error) {
    if (error.code === '23505') {
      console.log('❌ Error: This email already exists!');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

async function removeAllowedEmail() {
  await listAllowedEmails();
  const email = await question('\nEnter email to remove: ');
  
  const result = await pool.query(
    'DELETE FROM allowed_emails WHERE email = $1 RETURNING email',
    [email.trim()]
  );
  
  if (result.rows.length > 0) {
    console.log(`✅ Removed ${email} from allowed emails!`);
  } else {
    console.log('❌ Email not found!');
  }
}

async function toggleEmailStatus() {
  await listAllowedEmails();
  const email = await question('\nEnter email to enable/disable: ');
  
  const result = await pool.query(
    'UPDATE allowed_emails SET is_active = NOT is_active WHERE email = $1 RETURNING email, is_active',
    [email.trim()]
  );
  
  if (result.rows.length > 0) {
    const status = result.rows[0].is_active ? 'enabled' : 'disabled';
    console.log(`✅ ${email} has been ${status}!`);
  } else {
    console.log('❌ Email not found!');
  }
}

async function checkEmail() {
  const email = await question('\nEnter email to check: ');
  
  const result = await pool.query(
    'SELECT * FROM allowed_emails WHERE email = $1',
    [email.trim()]
  );
  
  if (result.rows.length > 0) {
    const row = result.rows[0];
    const status = row.is_active ? '✅ Allowed (Active)' : '❌ Not Allowed (Inactive)';
    console.log(`\n${status}`);
    console.log(`Added: ${new Date(row.added_at).toLocaleString()}`);
    if (row.notes) console.log(`Notes: ${row.notes}`);
  } else {
    console.log('❌ Email not found in allowed list!');
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Allowed Emails Management Tool      ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  while (true) {
    console.log('\nOptions:');
    console.log('1. List all allowed emails');
    console.log('2. Add new allowed email');
    console.log('3. Remove allowed email');
    console.log('4. Enable/Disable email');
    console.log('5. Check if email is allowed');
    console.log('6. Exit');
    
    const choice = await question('\nChoose an option (1-6): ');
    
    try {
      switch (choice.trim()) {
        case '1':
          await listAllowedEmails();
          break;
        case '2':
          await addAllowedEmail();
          break;
        case '3':
          await removeAllowedEmail();
          break;
        case '4':
          await toggleEmailStatus();
          break;
        case '5':
          await checkEmail();
          break;
        case '6':
          console.log('\n👋 Goodbye!');
          rl.close();
          await pool.end();
          process.exit(0);
        default:
          console.log('❌ Invalid option!');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
}

main();
