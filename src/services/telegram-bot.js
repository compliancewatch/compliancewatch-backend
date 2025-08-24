// src/services/telegram-bot.js
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// AI Response Handler
async function handleAIMessage(ctx, message) {
  try {
    ctx.reply('🤖 Processing your question...');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        messages: [{
          role: 'user',
          content: `As a compliance expert, answer this question: ${message}. Keep response under 200 characters.`
        }]
      })
    });

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'I could not process that question.';
    
    ctx.reply(aiResponse);
  } catch (error) {
    ctx.reply('❌ Error processing your request');
    console.error('AI response error:', error);
  }
}

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
    ctx.reply('🚀 Welcome to ComplianceWatch AI Bot!\n\nAvailable commands:\n/status - System status\n/latest - Latest updates\n/help - Show help');
  });

  bot.help((ctx) => {
    ctx.reply('🤖 Available Commands:\n/status - Check system status\n/latest - Get latest compliance updates\n/ask [question] - Ask AI compliance questions');
  });

  bot.command('status', (ctx) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    ctx.reply(`✅ System Status:\n⏰ Uptime: ${hours}h ${minutes}m\n📊 Last scrape: ${new Date().toLocaleString()}\n🌐 Status: Operational`);
  });

  bot.command('latest', async (ctx) => {
    try {
      const { supabase } = await import('./database.js');
      const { data } = await supabase
        .from('scraped_data')
        .select('source, scraped_at')
        .order('scraped_at', { ascending: false })
        .limit(5);

      if (data && data.length > 0) {
        const updates = data.map(item => 
          `• ${item.source} - ${new Date(item.scraped_at).toLocaleDateString()}`
        ).join('\n');
        
        ctx.reply(`📋 Latest Updates:\n\n${updates}\n\nUse /ask for specific questions.`);
      } else {
        ctx.reply('No updates available yet. Check back soon!');
      }
    } catch (error) {
      ctx.reply('❌ Error fetching latest updates');
    }
  });

  bot.command('ask', (ctx) => {
    const question = ctx.message.text.replace('/ask', '').trim();
    if (question) {
      handleAIMessage(ctx, question);
    } else {
      ctx.reply('Please provide a question after /ask. Example: /ask What are FATF requirements?');
    }
  });

  // AI response to any message
  bot.on('text', (ctx) => {
    if (!ctx.message.text.startsWith('/')) {
      handleAIMessage(ctx, ctx.message.text);
    }
  });

  bot.launch().then(() => {
    console.log('✅ AI Telegram bot started successfully');
  });

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

export default { startBot, sendTelegramAlert };
