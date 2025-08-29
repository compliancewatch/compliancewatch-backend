// test-telegram.js - UPDATED FOR ES6
import 'dotenv/config';
import { Telegraf } from 'telegraf';

async function testBot() {
  try {
    console.log('🤖 Testing Telegram connection...');
    
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    
    // Verify bot connection
    const me = await bot.telegram.getMe();
    console.log(`✅ Bot @${me.username} connected successfully`);

    // Send test message
    await bot.telegram.sendMessage(
      process.env.TELEGRAM_CHANNEL_ID,
      `✅ ComplianceWatch Bot Test Successful!\n` +
      `🕒 ${new Date().toLocaleString()}\n` +
      `🤖 Bot: @${me.username}\n` +
      `📊 System: Online and Operational\n` +
      `#SystemTest #Online`
    );

    console.log('✅ Test message sent to Telegram channel');
    process.exit(0);
  } catch (error) {
    console.error('❌ Telegram test failed:', error.message);
    
    if (error.response?.description?.includes('chat not found')) {
      console.error('💡 Solution: Verify TELEGRAM_CHANNEL_ID environment variable');
    } else if (error.response?.description?.includes('bot token')) {
      console.error('💡 Solution: Check TELEGRAM_BOT_TOKEN environment variable');
    }
    
    process.exit(1);
  }
}

testBot();
