require('dotenv').config();
const logger = require('./utils/logger');
const { Telegraf } = require('telegraf');

async function testBot() {
  try {
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    
    // Verify bot connection
    const me = await bot.telegram.getMe();
    logger.info(`Bot @${me.username} connected successfully`);

    // Send test message
    await bot.telegram.sendMessage(
      process.env.ADMIN_CHAT_ID,
      `✅ Bot connectivity test successful!\n` +
      `🕒 ${new Date().toLocaleString()}\n` +
      `🤖 Bot: @${me.username}\n` +
      `👤 Your ID: ${process.env.ADMIN_CHAT_ID}`
    );

    logger.info('Test message sent to your Telegram account');
    process.exit(0);
  } catch (error) {
    logger.error('Telegram test failed:', {
      error: error.message,
      solution: error.response?.description.includes('chat not found') 
        ? 'Verify ADMIN_CHAT_ID and ensure bot was started in chat'
        : 'Check bot token and internet connection'
    });
    process.exit(1);
  }
}

testBot();
