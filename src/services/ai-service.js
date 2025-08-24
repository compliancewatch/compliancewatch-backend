import { supabase } from './database.js';
import { logger } from '../utils/logger.js';
import { sendTelegramAlert } from './telegram-bot.js';

// Store already posted items to avoid duplicates
const postedItems = new Set();

export async function runAISummarizer(source) {
  try {
    logger.info(`🤖 Generating AI summary for ${source}...`);
    
    // Get data from last 48 hours only
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    
    const { data: recentData, error } = await supabase
      .from('scraped_data')
      .select('data, created_at')
      .eq('source', source)
      .gt('created_at', fortyEightHoursAgo)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !recentData || recentData.length === 0) {
      logger.info(`No recent data found for ${source} in last 48 hours`);
      return false;
    }

    // Filter out already posted items and get top 3-5 new items
    const newItems = [];
    for (const record of recentData) {
      for (const item of record.data) {
        const itemKey = `${source}-${item.title}-${item.date}`;
        if (!postedItems.has(itemKey) && isRecent(item.date)) {
          newItems.push(item);
          postedItems.add(itemKey);
          if (newItems.length >= 5) break; // Limit to 5 items per post
        }
      }
      if (newItems.length >= 5) break;
    }

    if (newItems.length === 0) {
      logger.info(`No new items to post for ${source}`);
      return false;
    }

    // Generate AI summary
    const summary = await generateAISummary(source, newItems);
    const telegramPost = formatTelegramPost(source, summary, newItems);
    
    await sendTelegramAlert(telegramPost);
    logger.info(`✅ AI summary sent for ${source} (${newItems.length} items)`);
    
    return true;

  } catch (error) {
    logger.error(`AI summarization failed for ${source}:`, error);
    return false;
  }
}

function isRecent(dateString) {
  // Check if item is from last 48 hours
  const itemDate = new Date(dateString);
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  return itemDate > fortyEightHoursAgo;
}

async function generateAISummary(source, items) {
  try {
    // Prepare content for AI
    const content = items.slice(0, 3).map((item, index) => 
      `${index + 1}. ${item.title}\n   Date: ${item.date}\n   URL: ${item.url || 'No link'}`
    ).join('\n\n');

    // Simulate AI response (replace with actual OpenRouter API)
    const summaries = {
      'UN Security Council': `🌍 UN Update: New resolutions adopted affecting global security. Member states must implement measures. Key developments in international policy.`,
      'Bloomberg Markets': `📈 Market Alert: Significant financial developments reported. Economic indicators show changes affecting global markets. Investment insights.`,
      'CoinDesk': `₿ Crypto News: Blockchain and digital currency updates. Market movements and regulatory developments in cryptocurrency space.`
    };

    return summaries[source] || `📋 ${source} Update: Important developments detected. Review latest information for compliance and opportunities.`;

  } catch (error) {
    logger.error('AI summary generation failed:', error);
    return 'Summary unavailable - check source for details.';
  }
}

function formatTelegramPost(source, summary, items) {
  const topItems = items.slice(0, 3); // Show only top 3 items
  
  return `
🚨 ${source} Update
🕒 ${new Date().toLocaleString()}

${summary}

📋 Top Updates:
${topItems.map((item, index) => 
  `${index + 1}. ${item.title}\n   🔗 ${item.url || 'No link'}\n   📅 ${item.date}`
).join('\n\n')}

#${source.replace(/\s+/g, '')} #Compliance #Update
  `.trim();
}

// AI response handler for Telegram messages
export async function handleAIMessage(userMessage) {
  try {
    const responses = {
      'fatf': 'FATF recommends enhanced due diligence for high-risk jurisdictions. Regular updates published quarterly.',
      'compliance': 'Compliance requirements vary by jurisdiction. Regular monitoring and policy updates essential.',
      'sanctions': 'Sanctions compliance mandatory. Screening required for all transactions and business relationships.',
      'update': 'Latest updates are posted every 3 hours. Use /latest to see recent updates.',
      'help': 'I provide compliance and regulatory updates. Ask about specific regulations or use /commands for options.'
    };
    
    const lowerMessage = userMessage.toLowerCase();
    for (const [key, response] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }
    
    return 'I specialize in compliance regulations and updates. Ask me about FATF, sanctions, or compliance requirements.';

  } catch (error) {
    return 'Unable to process your request at the moment. Please try again later.';
  }
}
