// scripts/test-db-safe.js
require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

(async () => {
  try {
    console.log('🔐 Testing Supabase connection with anon key...');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY,
      {
        auth: { persistSession: false }
      }
    );

    // Simple query to test permissions
    const { data, error } = await supabase
      .from('news_updates')
      .select('*')
      .limit(1);

    if (error) throw error;
    console.log('✅ Success! Connection works with anon key');
    console.log('📊 Sample record:', data.length ? data[0] : 'No records found');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('ℹ️ Troubleshooting tips:');
    console.log('- Verify your anon key in Project Settings → API');
    console.log('- Check table permissions in Authentication → Policies');
    console.log('- Ensure your table exists in the public schema');
    process.exit(1);
  }
})();
