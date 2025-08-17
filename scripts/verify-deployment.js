// scripts/verify-deployment.js
const axios = require('axios');
const { supabase } = require('../services/database');

(async () => {
  try {
    console.log('🔍 Verifying deployment...');
    
    // 1. Test Supabase
    const { data: sbData, error } = await supabase
      .from('scraped_data')
      .select('*')
      .limit(1);
    if (error) throw error;
    console.log('✅ Supabase connection successful');

    // 2. Test Telegram
    const tgTest = await axios.get(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`
    );
    console.log('✅ Telegram connection successful:', tgTest.data.result.username);

    // 3. Test OpenRouter
    const orTest = await axios.get('https://openrouter.ai/api/v1/auth/key', {
      headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` }
    });
    console.log('✅ OpenRouter connection successful');

    console.log('\n🚀 All systems operational!');
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
})();
