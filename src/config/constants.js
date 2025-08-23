// src/config/constants.js
import { config } from 'dotenv';

// Load environment variables
config();

// Export all environment variables
export default {
  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  
  // Telegram
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHANNEL_ID: process.env.TELEGRAM_CHANNEL_ID,
  
  // OpenRouter AI
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  
  // Puppeteer
  CHROMIUM_PATH: process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser',
  
  // App
  NODE_ENV: process.env.NODE_ENV || 'production',
  PORT: process.env.PORT || 3000
};
