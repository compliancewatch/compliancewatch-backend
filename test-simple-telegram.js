// test-simple-telegram.js - NO DEPENDENCIES NEEDED
console.log('🤖 Testing Telegram connection...');

// Simple fetch-based Telegram test
async function testTelegram() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHANNEL_ID;
    
    if (!botToken || !chatId) {
      throw new Error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID environment variables');
    }

    const message = encodeURIComponent(
      `✅ ComplianceWatch Simple Test\n` +
      `🕒 ${new Date().toLocaleString()}\n` +
      `📊 Direct API test successful!\n` +
      `#Test #API`
    );

    const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${message}`;
    
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ Telegram test message sent successfully!');
      console.log('Message ID:', result.result.message_id);
    } else {
      throw new Error(result.description || 'Unknown Telegram API error');
    }
    
  } catch (error) {
    console.error('❌ Telegram test failed:', error.message);
    
    if (error.message.includes('chat not found')) {
      console.error('💡 Solution: Verify TELEGRAM_CHANNEL_ID is correct');
    } else if (error.message.includes('bot token')) {
      console.error('💡 Solution: Check TELEGRAM_BOT_TOKEN is correct');
    } else if (error.message.includes('Missing')) {
      console.error('💡 Solution: Check environment variables in Railway dashboard');
    }
  }
}

testTelegram();
