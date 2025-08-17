// scripts/verify-scraped-data.js
require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

(async () => {
  try {
    console.log('🔍 Verifying scraped_data table access...');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    // Test basic read access
    const { data, error } = await supabase
      .from('scraped_data')
      .select('*')
      .limit(2);

    if (error) throw error;

    console.log('✅ Success! Table structure:');
    console.log('Sample row:', data[0] || 'No data found');
    console.log('Columns:', Object.keys(data[0] || {}));
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Ensure ANON key is used (Project Settings → API)');
    console.log('2. Check RLS policies for scraped_data table');
    console.log('3. Verify table exists in public schema');
    process.exit(1);
  }
})();
