import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Telegram alert function
export async function sendTelegramAlert(message) {
  try {
    await bot.telegram.sendMessage(
      process.env.TELEGRAM_CHANNEL_ID,
      `🚨 Compliance Alert: ${message}`,
      { parse_mode: 'HTML' }
    );
  } catch (error) {
    console.error('Telegram send error:', error.message);
  }
}

// Start bot function
export function startBot() {
  bot.start((ctx) => {
    ctx.reply('Welcome to ComplianceWatch Bot! Use /status to check system health.');
  });

  bot.command('status', (ctx) => {
    ctx.reply('✅ System Status: Operational\n🔄 Last check: ' + new Date().toLocaleString());
  });

  bot.command('scrape', (ctx) => {
    if (ctx.from.id.toString() === process.env.ADMIN_CHAT_ID) {
      ctx.reply('🔄 Manual scrape initiated...');
      // You can add manual scrape trigger here
    } else {
      ctx.reply('⛔ Admin access required');
    }
  });

  bot.launch().then(() => {
    console.log('Telegram bot started successfully');
  }).catch(error => {
    console.error('Telegram bot failed to start:', error);
  });

  // Graceful shutdown
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

// Export both functions
export default { startBot, sendTelegramAlert };
