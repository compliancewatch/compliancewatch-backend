// scripts/test-db-connection.js
require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  // Verify environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials in environment variables');
    process.exit(1);
  }

  console.log('ℹ️ Supabase URL:', process.env.SUPABASE_URL);
  console.log('ℹ️ Supabase Key:', process.env.SUPABASE_KEY.slice(0, 10) + '...');

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY,
      {
        auth: {
          persistSession: false
        }
      }
    );

    console.log('Testing connection to "news_updates" table...');
    const { data, error } = await supabase
      .from('news_updates')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Supabase query error:', error);
      return false;
    }

    console.log('✅ Connection successful! Found', data.length, 'records');
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
