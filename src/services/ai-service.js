// src/services/ai-service.js
import { supabase } from './database.js';
import { logger } from '../utils/logger.js';
import { sendTelegramAlert } from './telegram-bot.js';

export async function runAISummarizer(source) {
  try {
    logger.info(`🤖 Generating AI summary for ${source}...`);
    
    // Simulate AI summary (replace with real API call)
    const summary = await generateAISummary(source);
    
    // Format and send to Telegram
    const message = formatTelegramPost(source, summary);
    await sendTelegramAlert(message);
    
    logger.info(`✅ AI summary sent for ${source}`);
    return true;
    
  } catch (error) {
    logger.error(`AI summarization failed for ${source}:`, error);
    return false;
  }
}

async function generateAISummary(source) {
  // Simulate AI response - replace with actual OpenRouter API
  const summaries = {
    'FATF High-Risk Jurisdictions': `🚨 FATF Update: Latest high-risk jurisdictions list published. Enhanced due diligence recommended for transactions involving listed countries. Regulatory compliance required for all financial institutions.`,
    'UN Security Council': `🌍 UN Security Council: New sanctions regime adopted. Member states must implement measures immediately. Compliance monitoring essential for international operations.`,
    'SEC': `📊 SEC Alert: New disclosure requirements announced for public companies. Enhanced reporting standards effective next quarter. Compliance deadlines approaching.`
  };
  
  return summaries[source] || `📋 ${source} Update: New regulatory changes detected. Review compliance requirements and update policies accordingly.`;
}

function formatTelegramPost(source, summary) {
  return `
🔔 ${source} Update
🕒 ${new Date().toLocaleString()}

${summary}

#Compliance #${source.replace(/\s+/g, '')} #RegulatoryUpdate
  `.trim();
}

// Simulate AI response to messages
export async function handleAIMessage(userMessage) {
  try {
    const responses = {
      'fatf': 'FATF recommends enhanced due diligence for high-risk jurisdictions. Regular updates published quarterly.',
      'compliance': 'Compliance requirements vary by jurisdiction. Regular monitoring and policy updates essential.',
      'sanctions': 'Sanctions compliance mandatory. Screening required for all transactions and business relationships.'
    };
    
    const lowerMessage = userMessage.toLowerCase();
    for (const [key, response] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }
    
    return 'I specialize in compliance regulations. Ask me about FATF, sanctions, or compliance requirements.';
    
  } catch (error) {
    return 'Unable to process your request at the moment. Please try again later.';
  }
}
