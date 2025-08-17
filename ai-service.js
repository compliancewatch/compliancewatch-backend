// services/ai-service.js
const logger = require('../utils/logger');
const axios = require('axios');
require('dotenv').config();

let cachedWorkingModel = 'openai/gpt-oss-20b:free';

module.exports = {
  getAIResponse: async (prompt) => {
    logger.debug(`Sending to AI model ${cachedWorkingModel}`);
    
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: cachedWorkingModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.OPENROUTER_REFERER || 'https://compliancewatch.global',
            'X-Title': process.env.OPENROUTER_APP_TITLE || 'ComplianceWatch'
          },
          timeout: 10000
        }
      );
      
      logger.debug('AI Response received');
      return {
        success: true,
        model: cachedWorkingModel,
        response: response.data.choices[0].message.content
      };
    } catch (error) {
      logger.error('AI Service Error:', {
        status: error.response?.status,
        message: error.response?.data?.error?.message || error.message,
        model: cachedWorkingModel
      });
      
      return {
        success: false,
        error: error.response?.data?.error?.message || 'AI service unavailable',
        model: cachedWorkingModel
      };
    }
  },

  generateSummary: async (title, url) => {
    const prompt = `As a compliance expert, summarize in 1-2 sentences for a Telegram post:
Title: "${title}"
Source URL: ${url}
Format: "[Source] Summary (max 15 words). Key entities: XYZ. Implications: ABC."`;
    
    const { success, response } = await this.getAIResponse(prompt);
    return success ? response : `New update from ${new URL(url).hostname}`;
  }
};