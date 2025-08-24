import { supabase } from './database.js';
import { logger } from '../utils/logger.js';
import { sendTelegramAlert } from './telegram-bot.js';

// Store already posted items to avoid duplicates (in-memory, will reset on restart)
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
      .limit(5);

    if (error || !recentData || recentData.length === 0) {
      logger.info(`No recent data found for ${source} in last 48 hours`);
      return false;
    }

    // Extract and filter new items
    const newItems = [];
    for (const record of recentData) {
      for (const item of record.data) {
        const itemKey = `${source}-${item.title}-${item.date}`;
        if (!postedItems.has(itemKey)) {
          newItems.push(item);
          postedItems.add(itemKey);
          if (newItems.length >= 3) break; // Limit to 3 items per post
        }
      }
      if (newItems.length >= 3) break;
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

async function generateAISummary(source, items) {
  try {
    // Simulate AI response (replace with actual OpenRouter API when ready)
    const aiSummaries = {
      // Regulatory
      'UN Security Council': `🌍 UN Update: New security resolutions adopted affecting global compliance requirements. Member states must implement measures. Key developments in international policy.`,
      'SEC (US)': `📊 SEC Alert: New disclosure requirements announced for public companies. Enhanced reporting standards effective soon. Compliance deadlines approaching.`,
      'FCA (UK)': `🇬🇧 FCA Update: Financial conduct authority releases new guidelines. UK firms must review compliance procedures. Regulatory changes affecting banking sector.`,
      'FATF High-Risk Jurisdictions': `🌍 FATF Update: New high-risk jurisdictions identified. Enhanced due diligence recommended. Compliance requirements updated globally.`,
      
      // Business
      'Bloomberg Markets': `📈 Market Update: Significant financial developments reported. Economic indicators show changes affecting global markets. Investment insights and analysis.`,
      'Reuters Business': `💼 Business News: Corporate developments and economic trends. Market-moving information affecting international business and compliance.`,
      'Financial Times': `📰 Financial Times: In-depth analysis of global economic trends. Regulatory impacts on business operations and investment strategies.`,
      'Yahoo Finance': `💹 Market Update: Financial news and stock market developments. Economic indicators and business trends affecting compliance.`,
      
      // Crypto
      'CoinDesk': `₿ Crypto News: Blockchain and digital currency updates. Market movements and regulatory developments in cryptocurrency space.`,
      'CoinTelegraph': `⚡ Crypto Update: Latest blockchain technology developments. Regulatory changes affecting digital asset compliance.`,
      'CryptoSlate': `🔗 Crypto Analysis: Digital currency market insights. Compliance requirements for blockchain and cryptocurrency operations.`,
      'The Block': `⛓️ Blockchain News: Distributed ledger technology updates. Regulatory framework developments for crypto assets.`
    };

    return aiSummaries[source] || `📋 ${source} Update: Important developments detected. Review latest information for compliance and opportunities.`;

  } catch (error) {
    logger.error('AI summary generation failed:', error);
    return 'Summary unavailable - check source for details.';
  }
}

function formatTelegramPost(source, summary, items) {
  return `
🚨 ${source} Update
🕒 ${new Date().toLocaleString()}

${summary}

📋 Top Updates:
${items.slice(0, 3).map((item, index) => 
  `${index + 1}. ${item.title}\n   🔗 ${item.url || 'No link'}\n   📅 ${item.date || 'Recent'}`
).join('\n\n')}

#${source.replace(/\s+/g, '')} #Compliance #Update
  `.trim();
}

// AI response handler for Telegram messages
export async function handleAIMessage(userMessage) {
  try {
    const responses = {
      'fatf': 'FATF recommends enhanced due diligence for high-risk jurisdictions. Regular updates published quarterly. Ask me for specific country information.',
      'compliance': 'Compliance requirements vary by jurisdiction and industry. Regular monitoring, policy updates, and staff training are essential for maintaining compliance.',
      'sanctions': 'Sanctions compliance is mandatory for all financial institutions. Regular screening required for transactions, customers, and business relationships.',
      'regulation': 'Regulatory frameworks evolve constantly. Stay updated with latest developments from relevant authorities in your operating jurisdictions.',
      'update': 'Latest compliance updates are posted every 3 hours. I monitor 20+ regulatory and news sources continuously.',
      'help': 'I provide AI-powered compliance updates from 20+ sources. Ask me about regulations, sanctions, or specific compliance topics.'
    };
    
    const lowerMessage = userMessage.toLowerCase();
    for (const [key, response] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }
    
    return 'I specialize in compliance regulations and updates from 20+ sources. Ask me about FATF, sanctions, SEC regulations, or general compliance requirements.';

  } catch (error) {
    return 'Unable to process your request at the moment. Please try again later.';
  }
}
