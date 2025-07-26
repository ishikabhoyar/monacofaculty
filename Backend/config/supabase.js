// config/supabase.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test the connection
async function testConnection() {
  try {
    // Simple query to test the connection
    const { data, error } = await supabase.from('schema_migrations').select('*').limit(1).maybeSingle();
    if (error) {
      console.log('Connection test query error:', error.message);
      // Try an alternative table if schema_migrations doesn't exist
      const { error: authError } = await supabase.auth.getSession();
      if (authError) throw authError;
    }
    console.log('Supabase connection established successfully');
  } catch (error) {
    console.error('Error connecting to Supabase:', error.message);
    // Don't exit the process, just log the error
  }
}

testConnection();

module.exports = supabase;
