// src/legacy-start.js - USE COMMONJS TO BYPASS ES6 ISSUES
console.log('🚀 Starting ComplianceWatch with CommonJS...');

// Use CommonJS require instead of ES6 imports
const { createRequire } = require('module');
const require = createRequire(import.meta.url);

try {
  console.log('📦 Loading configuration...');
  
  // Load config with require
  const { REGULATORY_TARGETS, BUSINESS_TARGETS, CRYPTO_TARGETS } = require('../../config/targets.js');
  console.log('✅ Config loaded with require');
  
  // Load other dependencies with dynamic import
  console.log('📦 Loading other dependencies...');
  const { logger } = await import('./utils/logger.js');
  const { testConnection } = await import('./services/database.js');
  const { startBot } = await import('./services/telegram-bot.js');
  const nodeCron = (await import('node-cron')).default;
  
  console.log('✅ All dependencies loaded');
  
  // Start basic application
  logger.info('🚀 Application started successfully with CommonJS');
  
  // Test telegram
  const { sendTelegramAlert } = await import('./services/telegram-bot.js');
  await sendTelegramAlert('✅ System online with CommonJS imports');
  
} catch (error) {
  console.error('❌ Startup failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
