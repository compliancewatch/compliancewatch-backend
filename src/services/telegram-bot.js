import { Telegraf } from 'telegraf';
import { handleAIMessage } from './ai-service.js';

let botInstance = null;
let botStarted = false;

// Simple fetch-based Telegram sender to avoid bot conflicts
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
      const errorData = await response.text();
      console.error('Telegram API error:', errorData);
      return false;
    }
    
    console.log('✅ Telegram alert sent successfully');
    return true;
    
  } catch (error) {
    console.error('Telegram send error:', error.message);
    return false;
  }
}

// Enhanced bot startup with conflict prevention
export function startBot() {
  if (botStarted) {
    console.log('⚠️ Telegram bot already started, skipping...');
    return;
  }

  try {
    botInstance = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

    // Basic commands with minimal functionality
    botInstance.start((ctx) => {
      ctx.reply('🚀 Welcome to ComplianceWatch AI Bot!\n\nI provide real-time compliance updates every 3 hours.\n\nUse /status for system info or ask me questions about regulations.');
    });

    botInstance.help((ctx) => {
      ctx.reply('🤖 Available Commands:\n/status - System status\n/latest - Recent updates\n/help - This message\n\nAsk me about:\n• FATF regulations\n• Compliance requirements\n• Regulatory updates');
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
          .limit(3);

        if (data && data.length > 0) {
          const updates = data.map(item => 
            `• ${item.source} - ${new Date(item.created_at).toLocaleDateString()}`
          ).join('\n');
          
          ctx.reply(`📋 Recent Updates:\n\n${updates}\n\nNext update in 3 hours!`);
        } else {
          ctx.reply('No updates available yet. Next update in 3 hours!');
        }
      } catch (error) {
        ctx.reply('❌ Error fetching updates. System restarting...');
      }
    });

    // AI response to any non-command message
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

    // Error handling for bot
    botInstance.catch((error) => {
      console.error('Telegram bot error:', error);
    });

    // Launch with comprehensive error handling
    botInstance.launch().then(() => {
      console.log('✅ Telegram bot started successfully');
      botStarted = true;
      
      // Send startup notification via API to avoid conflicts
      sendTelegramAlert(
        '🤖 ComplianceWatch System Online\n' +
        '✅ All services operational\n' +
        '📅 Updates every 3 hours\n' +
        '🕒 ' + new Date().toLocaleString()
      );
      
    }).catch(error => {
      console.error('❌ Telegram bot failed to start:', error.message);
      // Mark as not started to allow retries
      botStarted = false;
      botInstance = null;
    });

  } catch (error) {
    console.error('❌ Failed to initialize Telegram bot:', error.message);
    botStarted = false;
    botInstance = null;
  }
}

// Graceful shutdown handling
process.once('SIGINT', () => {
  console.log('Shutting down Telegram bot (SIGINT)...');
  if (botInstance) {
    botInstance.stop('SIGINT');
  }
});

process.once('SIGTERM', () => {
  console.log('Shutting down Telegram bot (SIGTERM)...');
  if (botInstance) {
    botInstance.stop('SIGTERM');
  }
});

// Export functions
export default { startBot, sendTelegramAlert };
