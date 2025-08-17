// railway-start.js
require('dotenv').config();
const logger = require('./utils/logger');
const db = require('./services/database');
const telegram = require('./services/telegram-bot');
const scheduler = require('./services/scheduler');

async function start() {
  try {
    // Verify configurations
    if (!process.env.SUPABASE_URL) throw new Error('Supabase URL missing');
    if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error('Telegram token missing');

    // Initialize services
    await db.testConnection();
    telegram.start();
    scheduler.init();

    logger.info('🚀 Application started successfully');
    
    // Health check endpoint
    require('express')()
      .get('/health', (req, res) => res.json({ 
        status: 'OK', 
        uptime: process.uptime() 
      })
      .listen(process.env.PORT || 3000);
      
  } catch (error) {
    logger.error('❌ Startup failed', error);
    process.exit(1);
  }
}

start();
