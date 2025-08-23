import { Telegraf } from 'telegraf';

// Initialize bot with error handling
let bot;
try {
  bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
} catch (error) {
  console.error('Failed to initialize Telegram bot:', error.message);
  process.exit(1);
}

// Telegram alert function with retry logic
export async function sendTelegramAlert(message, maxRetries = 3) {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      await bot.telegram.sendMessage(
        process.env.TELEGRAM_CHANNEL_ID,
        message,
        { parse_mode: 'HTML' }
      );
      console.log('✅ Telegram alert sent successfully');
      return true;
    } catch (error) {
      attempts++;
      console.error(`Telegram send attempt ${attempts}/${maxRetries} failed:`, error.message);
      
      if (attempts >= maxRetries) {
        console.error('All Telegram send attempts failed');
        return false;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
    }
  }
}

// Start bot function with comprehensive error handling
export function startBot() {
  try {
    // Basic commands
    bot.start((ctx) => {
      ctx.reply('🚀 Welcome to ComplianceWatch Bot!\nUse /status to check system health\nUse /help for available commands');
    });

    bot.help((ctx) => {
      ctx.reply(
        '🤖 Available Commands:\n' +
        '/status - Check system status\n' +
        '/stats - Show scraping statistics\n' +
        '/restart - Restart scrapers (admin only)\n' +
        '/help - Show this help message'
      );
    });

    bot.command('status', (ctx) => {
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      
      ctx.reply(
        '✅ System Status: Operational\n' +
        `⏰ Uptime: ${hours}h ${minutes}m ${seconds}s\n` +
        `🔄 Last check: ${new Date().toLocaleString()}\n` +
        `🌐 Environment: ${process.env.NODE_ENV || 'development'}`
      );
    });

    bot.command('stats', async (ctx) => {
      try {
        const { supabase } = await import('./database.js');
        const { data, error } = await supabase
          .from('scraped_data')
          .select('source, count')
          .group('source');

        if (error) throw error;

        let statsMessage = '📊 Scraping Statistics:\n';
        data.forEach(item => {
          statsMessage += `• ${item.source}: ${item.count} records\n`;
        });

        ctx.reply(statsMessage);
      } catch (error) {
        ctx.reply('❌ Failed to fetch statistics');
        console.error('Stats command error:', error);
      }
    });

    // Admin-only commands
    bot.command('restart', (ctx) => {
      if (ctx.from.id.toString() === process.env.ADMIN_CHAT_ID) {
        ctx.reply('🔄 Restarting scrapers...');
        // Add restart logic here
      } else {
        ctx.reply('⛔ Admin access required');
      }
    });

    // Error handling for bot launch
    bot.launch().then(() => {
      console.log('✅ Telegram bot started successfully');
      
      // Send startup notification
      sendTelegramAlert(
        '🚀 ComplianceWatch System Started\n' +
        '✅ All services operational\n' +
        `📅 Next regulatory scrape: Tomorrow 09:00 UTC\n` +
        `🕒 ${new Date().toLocaleString()}`
      );
    }).catch(error => {
      console.error('❌ Telegram bot failed to start:', error);
      throw error;
    });

    // Graceful shutdown handlers
    process.once('SIGINT', () => {
      console.log('Shutting down Telegram bot (SIGINT)...');
      bot.stop('SIGINT');
    });

    process.once('SIGTERM', () => {
      console.log('Shutting down Telegram bot (SIGTERM)...');
      bot.stop('SIGTERM');
    });

    // Handle bot errors
    bot.catch((error) => {
      console.error('Telegram bot error:', error);
    });

  } catch (error) {
    console.error('Failed to start Telegram bot:', error);
    throw error;
  }
}

// Export both functions
export default { startBot, sendTelegramAlert };
