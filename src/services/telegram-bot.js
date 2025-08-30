// src/services/telegram-bot.js - ENHANCED WITH AI
import { Telegraf } from 'telegraf';
import { supabase } from './database.js';

let botInstance = null;
let botStarted = false;

// Simple fetch-based Telegram sender
export async function sendTelegramAlert(message) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHANNEL_ID) {
    console.warn('Telegram not configured, skipping alert');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHANNEL_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true
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

// AI Response Generator
async function generateAIResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  
  // Check for specific regulatory queries
  if (lowerMessage.includes('sec') || lowerMessage.includes('security exchange')) {
    const latest = await getLatestData('SEC Filings');
    if (latest?.data?.length > 0) {
      return `📊 Latest SEC Updates:\n\n${latest.data.slice(0, 2).map(item => 
        `• ${item.title}\n🔗 <a href="${item.url}">Read more</a>\n📅 ${new Date(item.date).toLocaleDateString()}`
      ).join('\n\n')}\n\n#SEC #RegulatoryUpdate`;
    }
    return 'No recent SEC updates found. Next update in 3 hours.';
  }
  
  if (lowerMessage.includes('fatf') || lowerMessage.includes('high risk')) {
    const latest = await getLatestData('FATF High-Risk Jurisdictions');
    if (latest?.data?.length > 0) {
      return `🌍 FATF High-Risk Jurisdictions:\n\n${latest.data.slice(0, 5).map(item => 
        `• ${item.country} - ${item.status}`
      ).join('\n')}\n\n#FATF #Compliance`;
    }
    return 'No FATF data available currently. Next update in 3 hours.';
  }
  
  if (lowerMessage.includes('crypto') || lowerMessage.includes('bitcoin') || lowerMessage.includes('blockchain')) {
    const latest = await getLatestCryptoData();
    if (latest.length > 0) {
      return `₿ Crypto Regulatory Updates:\n\n${latest.slice(0, 2).map(item => 
        `• ${item.title}\n🔗 <a href="${item.url}">Read more</a>`
      ).join('\n\n')}\n\n#Crypto #Regulation`;
    }
    return 'No recent crypto regulatory updates. Next update in 3 hours.';
  }
  
  if (lowerMessage.includes('latest') || lowerMessage.includes('recent') || lowerMessage.includes('new')) {
    const latest = await getLatestOverall();
    if (latest.length > 0) {
      return `📰 Recent Compliance Updates:\n\n${latest.slice(0, 2).map(item => 
        `• ${item.title} (${item.source})\n🔗 <a href="${item.url}">Read more</a>\n📅 ${new Date(item.date).toLocaleDateString()}`
      ).join('\n\n')}`;
    }
    return 'No recent updates available. Next update in 3 hours.';
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
    return `🤖 I'm the ComplianceWatch AI bot! I monitor:\n\n` +
           `• Regulatory bodies: SEC, FATF, UN, EU, FCA, etc.\n` +
           `• Business news: Bloomberg, Reuters, Financial Times\n` +
           `• Crypto markets: CoinDesk, CoinTelegraph, CryptoSlate\n\n` +
           `Ask me about specific regulations or use commands:\n` +
           `/status - System status\n` +
           `/latest - Recent updates\n` +
           `/help - This message\n\n` +
           `I update every 3 hours with the latest compliance news!`;
  }
  
  // Default response for other questions
  return `🤖 I'm the ComplianceWatch AI bot monitoring regulatory updates from 20+ sources.\n\n` +
         `I can help you with:\n` +
         `• Latest SEC regulations\n` +
         `• FATF high-risk jurisdictions\n` +
         `• Crypto compliance news\n` +
         `• Regulatory updates\n\n` +
         `Try asking about specific regulations or use /help for commands.`;
}

// Database helpers
async function getLatestData(source) {
  try {
    const { data } = await supabase
      .from('scraped_data')
      .select('data, created_at')
      .eq('source', source)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    return data;
  } catch (error) {
    return null;
  }
}

async function getLatestCryptoData() {
  try {
    const { data } = await supabase
      .from('scraped_data')
      .select('data')
      .in('source', ['CoinDesk', 'CoinTelegraph', 'CryptoSlate', 'The Block'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    return data?.data || [];
  } catch (error) {
    return [];
  }
}

async function getLatestOverall() {
  try {
    const { data } = await supabase
      .from('scraped_data')
      .select('data')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    return data?.data || [];
  } catch (error) {
    return [];
  }
}

export function startBot() {
  if (botStarted) {
    console.log('⚠️ Telegram bot already started');
    return;
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn('❌ Telegram bot token not set, skipping bot initialization');
    return;
  }

  try {
    botInstance = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

    // Basic commands
    botInstance.start((ctx) => {
      ctx.reply(
        '🚀 Welcome to ComplianceWatch AI Bot!\n\n' +
        'I monitor regulatory updates from 20+ sources every 3 hours.\n\n' +
        'Available commands:\n' +
        '/status - System status\n' +
        '/latest - Recent updates\n' +
        '/help - Show help\n\n' +
        'Ask me about SEC regulations, FATF jurisdictions, crypto compliance, and more!'
      );
    });

    botInstance.help((ctx) => {
      ctx.reply(
        '🤖 ComplianceWatch AI Help\n\n' +
        'Commands:\n' +
        '/start - Start the bot\n' +
        '/status - System status\n' +
        '/latest - Latest findings\n' +
        '/help - This message\n\n' +
        'Ask me questions like:\n' +
        '"What are the latest SEC updates?"\n' +
        '"Show me FATF high-risk countries"\n' +
        '"Crypto regulations today"\n' +
        '"Recent regulatory news"\n\n' +
        'I update every 3 hours with fresh compliance data!'
      );
    });

    botInstance.command('status', async (ctx) => {
      try {
        const { count } = await supabase
          .from('scraped_data')
          .select('*', { count: 'exact' });
        
        const recent = await supabase
          .from('scraped_data')
          .select('source, created_at, item_count')
          .order('created_at', { ascending: false })
          .limit(3);

        let statusMessage = `📊 ComplianceWatch Status\n`;
        statusMessage += `✅ System: Operational\n`;
        statusMessage += `📈 Total records: ${count || 0}\n`;
        statusMessage += `🕒 Last updates:\n`;
        
        if (recent.data && recent.data.length > 0) {
          recent.data.forEach(record => {
            statusMessage += `• ${record.source}: ${record.item_count} items at ${new Date(record.created_at).toLocaleTimeString()}\n`;
          });
        } else {
          statusMessage += `• No data yet - first update in progress\n`;
        }

        statusMessage += `\n⏰ Next update: Every 3 hours`;
        
        ctx.reply(statusMessage);
      } catch (error) {
        ctx.reply('❌ Error fetching system status. Please try again later.');
      }
    });

    botInstance.command('latest', async (ctx) => {
      try {
        const { data: latest } = await supabase
          .from('scraped_data')
          .select('data, source, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (latest && latest.data && latest.data.length > 0) {
          let message = `📰 Latest from ${latest.source}\n`;
          message += `🕒 ${new Date(latest.created_at).toLocaleString()}\n\n`;
          
          latest.data.slice(0, 3).forEach((item, index) => {
            message += `${index + 1}. ${item.title || item.country}\n`;
            if (item.url) message += `🔗 <a href="${item.url}">Read more</a>\n`;
            if (item.date) message += `📅 ${new Date(item.date).toLocaleDateString()}\n`;
            message += '\n';
          });
          
          message += `#${latest.source.replace(/\s+/g, '')} #Update`;
          
          ctx.reply(message, { parse_mode: 'HTML', disable_web_page_preview: true });
        } else {
          ctx.reply('No recent data available yet. First update in progress!');
        }
      } catch (error) {
        ctx.reply('❌ Error fetching latest data. Please try again later.');
      }
    });

    // AI response to any message
    botInstance.on('text', async (ctx) => {
      const messageText = ctx.message.text;
      
      // Don't respond to commands
      if (messageText.startsWith('/')) return;
      
      try {
        // Show typing action
        await ctx.sendChatAction('typing');
        
        // Generate AI response
        const response = await generateAIResponse(messageText);
        
        ctx.reply(response, { parse_mode: 'HTML', disable_web_page_preview: true });
      } catch (error) {
        console.error('AI response error:', error);
        ctx.reply('❌ Sorry, I encountered an error processing your request. Please try again later.');
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
