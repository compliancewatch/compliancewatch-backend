// src/services/telegram-bot.js
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

export async function sendTelegramAlert(message) {
  try {
    await bot.telegram.sendMessage(
      process.env.TELEGRAM_CHANNEL_ID,
      message
    );
  } catch (error) {
    console.error('Telegram send error:', error.message);
  }
}

export function startBot() {
  bot.start((ctx) => ctx.reply('Welcome to ComplianceWatch Bot!'));
  bot.command('status', (ctx) => ctx.reply('✅ System operational'));
  
  bot.launch().then(() => {
    console.log('Telegram bot started successfully');
  }).catch(error => {
    console.error('Telegram bot failed to start:', error);
  });
}

export default { startBot, sendTelegramAlert };
