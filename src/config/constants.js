import { config } from 'dotenv';

// Load environment variables
config();

// Application constants and configuration
export default {
  // Database
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  
  // Telegram
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHANNEL_ID: process.env.TELEGRAM_CHANNEL_ID,
  ADMIN_CHAT_ID: process.env.ADMIN_CHAT_ID,
  
  // AI Services
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct',
  
  // Browser
  CHROMIUM_PATH: process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser',
  
  // Application
  NODE_ENV: process.env.NODE_ENV || 'production',
  PORT: process.env.PORT || 3000,
  SCRAPE_SCHEDULE: process.env.SCRAPE_SCHEDULE || '0 9 * * *' // Daily at 9 AM UTC
};

// Also export individual constants for named imports
export const {
  SUPABASE_URL,
  SUPABASE_KEY,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHANNEL_ID,
  ADMIN_CHAT_ID,
  OPENROUTER_API_KEY,
  OPENROUTER_MODEL,
  CHROMIUM_PATH,
  NODE_ENV,
  PORT,
  SCRAPE_SCHEDULE
} = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHANNEL_ID: process.env.TELEGRAM_CHANNEL_ID,
  ADMIN_CHAT_ID: process.env.ADMIN_CHAT_ID,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct',
  CHROMIUM_PATH: process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser',
  NODE_ENV: process.env.NODE_ENV || 'production',
  PORT: process.env.PORT || 3000,
  SCRAPE_SCHEDULE: process.env.SCRAPE_SCHEDULE || '0 9 * * *'
};
