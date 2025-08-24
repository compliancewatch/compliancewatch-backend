import { Telegraf } from 'telegraf';
import { handleAIMessage } from './ai-service.js';

let botInstance = null;
let botStarted = false;

// Simple fetch-based Telegram sender
export async function sendTelegramAlert(message) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHANNEL_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });
    
    if (!response.ok) {
      console.error('Telegram API error:', await response.text());
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('Telegram send error:', error.message);
    return false;
  }
}

export function startBot() {
  if (botStarted) {
    console.log('⚠️ Telegram bot already started');
    return;
  }

  try {
    botInstance = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

    // Basic commands
    botInstance.start((ctx) => {
      ctx.reply('🚀 Welcome to ComplianceWatch AI Bot!\n\nI provide real-time compliance updates from 20+ sources every 3 hours.\n\nUse /status for system info or ask me questions about regulations.');
    });

    botInstance.help((ctx) => {
      ctx.reply('🤖 Available Commands:\n/status - System status\n/latest - Recent updates\n/help - This message\n\nAsk me about:\n• FATF regulations\n• Sanctions compliance\n• SEC requirements\n• Regulatory updates');
    });

    botInstance.command('status', (ctx) => {
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      
      ctx.reply(
        `✅ ComplianceWatch Status\n` +
        `⏰ Uptime: ${hours}h ${minutes}m\n` +
        `📊 Last update: ${new Date().toLocaleString()}\n` +
        `🌐 Status: Operational\n` +
        `📅 Next scrape: Every 3 hours`
      );
    });

    botInstance.command('latest', async (ctx) => {
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
          
          ctx.reply(`📋 Recent Updates:\n\n${updates}\n\nNext update in 3 hours!`);
        } else {
          ctx.reply('No updates available yet. Next update in 3 hours!');
        }
      } catch (error) {
        ctx.reply('❌ Error fetching updates. Please try again later.');
      }
    });

    // AI response to any message
    botInstance.on('text', async (ctx) => {
      if (!ctx.message.text.startsWith('/')) {
        try {
          const response = await handleAIMessage(ctx.message.text);
          ctx.reply(response);
        } catch (error) {
          ctx.reply('❌ Sorry, I encountered an error. Please try again later.');
        }
      }
    });

    botInstance.launch().then(() => {
      console.log('✅ Telegram bot started successfully');
      botStarted = true;
    }).catch(error => {
      console.error('❌ Telegram bot failed to start:', error.message);
      botStarted = false;
    });

  } catch (error) {
    console.error('❌ Failed to initialize Telegram bot:', error.message);
  }
}

// Graceful shutdown
process.once('SIGINT', () => botInstance?.stop('SIGINT'));
process.once('SIGTERM', () => botInstance?.stop('SIGTERM'));

export default { startBot, sendTelegramAlert };
