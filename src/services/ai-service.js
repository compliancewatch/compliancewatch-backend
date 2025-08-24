// src/services/ai-service.js
import { supabase } from './database.js';
import { logger } from '../utils/logger.js';

export async function runAISummarizer(source) {
  try {
    // Get latest data from this source
    const { data: recentData, error } = await supabase
      .from('scraped_data')
      .select('data, scraped_at')
      .eq('source', source)
      .order('scraped_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !recentData) {
      throw new Error(`No data found for ${source}`);
    }

    // Prepare content for AI summarization
    const content = recentData.data.slice(0, 5).map(item => 
      `Title: ${item.title}\nDate: ${item.date}\nURL: ${item.url}`
    ).join('\n\n');

    // Generate AI summary
    const summary = await generateAISummary(source, content);
    
    // Format for Telegram
    return formatTelegramPost(source, summary, recentData.scraped_at);

  } catch (error) {
    logger.error(`AI summarization failed for ${source}:`, error);
    return null;
  }
}

async function generateAISummary(source, content) {
  // Use OpenRouter API for AI summarization
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
        content: `Create a concise 2-3 sentence summary of the latest ${source} updates. Focus on key regulatory changes, compliance requirements, or important announcements. Here's the raw data:\n\n${content}`
      }]
    })
  });

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No summary generated';
}

function formatTelegramPost(source, summary, timestamp) {
  return `
🚨 ${source} Update

📅 ${new Date(timestamp).toLocaleDateString()}
⏰ ${new Date(timestamp).toLocaleTimeString()}

📋 Summary:
${summary}

#Compliance #${source.replace(/\s+/g, '')} #RegulatoryUpdate
  `.trim();
}
