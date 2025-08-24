// src/services/telegram-bot.js
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

export async function sendTelegramAlert(message) {
  try {
    await bot.telegram.sendMessage(
      process.env.TELEGRAM_CHANNEL_ID,
      message,
      { parse_mode: 'HTML' }
    );
  } catch (error) {
    console.error('Telegram send error:', error.message);
  }
}

export function startBot() {
  // Basic commands
  bot.start((ctx) => {
    ctx.reply('🚀 Welcome to ComplianceWatch Bot!\n\nAvailable commands:\n/status - System status\n/scrape - Manual scrape\n/help - Show help');
  });

  bot.help((ctx) => {
    ctx.reply('🤖 Available Commands:\n/status - Check system status\n/scrape - Trigger manual scraping\n/help - Show this help');
  });

  bot.command('status', (ctx) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    ctx.reply(`✅ System Status:\n⏰ Uptime: ${hours}h ${minutes}m\n📊 Last update: ${new Date().toLocaleString()}\n🌐 Status: Operational`);
  });

  bot.command('scrape', async (ctx) => {
    try {
      ctx.reply('🔄 Starting manual scrape...');
      
      // Import and run scraper
      const { runScraper } = await import('../scrapers/fatf.js');
      await runScraper();
      
      ctx.reply('✅ Manual scrape completed successfully!');
    } catch (error) {
      ctx.reply('❌ Scrape failed: ' + error.message);
      console.error('Manual scrape error:', error);
    }
  });

  bot.launch().then(() => {
    console.log('✅ Telegram bot started successfully');
  });

  // Graceful shutdown
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

export default { startBot, sendTelegramAlert };
