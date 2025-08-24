import { Telegraf } from 'telegraf';
import { handleAIMessage } from './ai-service.js';

let bot;
let botStarted = false;

export async function sendTelegramAlert(message) {
  try {
    if (!bot) {
      bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    }
    
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
  if (botStarted) {
    console.log('⚠️ Telegram bot already started');
    return;
  }

  try {
    bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

    // Enhanced commands
    bot.start((ctx) => {
      ctx.reply('🚀 Welcome to ComplianceWatch AI Bot!\n\nI provide real-time compliance updates and regulatory insights.\n\nAvailable commands:\n/status - System status\n/latest - Latest updates\n/help - Show help\n\nOr ask me anything about compliance!');
    });

    bot.help((ctx) => {
      ctx.reply('🤖 Available Commands:\n/status - Check system status\n/latest - Get latest compliance updates\n/scrape - Manual update trigger\n/help - Show this help\n\nAsk me questions about:\n• FATF regulations\n• Sanctions compliance\n• Regulatory updates\n• Market developments');
    });

    bot.command('status', (ctx) => {
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      
      ctx.reply(`✅ System Status:\n⏰ Uptime: ${hours}h ${minutes}m\n📊 Last update: ${new Date().toLocaleString()}\n🌐 Status: Operational\n📅 Next scrape: Every 3 hours`);
    });

    bot.command('latest', async (ctx) => {
      try {
        const { supabase } = await import('./database.js');
        const { data } = await supabase
          .from('scraped_data')
          .select('source, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        if (data && data.length > 0) {
          const updates = data.map(item => 
            `• ${item.source} - ${new Date(item.created_at).toLocaleDateString()}`
          ).join('\n');
          
          ctx.reply(`📋 Latest Updates:\n\n${updates}\n\nAsk me about any specific regulation or use /help for commands.`);
        } else {
          ctx.reply('No updates available yet. Next update in 3 hours!');
        }
      } catch (error) {
        ctx.reply('❌ Error fetching latest updates');
      }
    });

    bot.command('scrape', async (ctx) => {
      try {
        ctx.reply('🔄 Starting manual update...');
        
        const { runScraper } = await import('../scrapers/fatf.js');
        await runScraper();
        
        ctx.reply('✅ Manual update completed! New updates will be posted shortly.');
      } catch (error) {
        ctx.reply('❌ Update failed: ' + error.message);
      }
    });

    // AI response to any message
    bot.on('text', async (ctx) => {
      if (!ctx.message.text.startsWith('/')) {
        const response = await handleAIMessage(ctx.message.text);
        ctx.reply(response);
      }
    });

    bot.launch().then(() => {
      console.log('✅ AI Telegram bot started successfully');
      botStarted = true;
      
      // Send startup message
      sendTelegramAlert(
        '🤖 ComplianceWatch AI Bot Online!\n' +
        '✅ All systems operational\n' +
        '📅 Updates every 3 hours\n' +
        '🕒 ' + new Date().toLocaleString()
      );
    });

  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error);
  }
}

// Graceful shutdown
process.once('SIGINT', () => bot?.stop('SIGINT'));
process.once('SIGTERM', () => bot?.stop('SIGTERM'));

export default { startBot, sendTelegramAlert };
