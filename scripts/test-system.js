// scripts/test-system.js (updated)
require('dotenv').config({ path: '.env.production' });
const logger = require('../utils/logger');
const { setTimeout } = require('timers/promises');

async function withTimeout(promise, ms, timeoutMessage) {
  try {
    return await Promise.race([
      promise,
      setTimeout(ms).then(() => {
        throw new Error(timeoutMessage);
      })
    ]);
  } catch (error) {
    logger.error(error.message);
    return false;
  }
}

async function testDatabase() {
  return withTimeout(
    (async () => {
      const db = require('../services/database');
      if (!await db.testConnection()) return false;
      
      const updates = await db.getUnpostedUpdates(1);
      logger.info(`Found ${updates.length} unposted updates`);
      return true;
    })(),
    10000,  // 10 second timeout
    'Database test timed out after 10 seconds'
  );
}

async function testTelegram() {
  return withTimeout(
    (async () => {
      const telegram = require('../services/telegram-bot');
      await telegram.start();
      
      const testMessage = `🛠️ *System Test*\\n` +
        `• Time: ${new Date().toLocaleString()}\\n` +
        '• Status: Testing bot functionality';
      
      await telegram.postToChannel(testMessage);
      telegram.stop();
      return true;
    })(),
    15000,  // 15 second timeout
    'Telegram test timed out after 15 seconds'
  );
}

async function runTests() {
  logger.info('Starting system tests with timeouts...');
  
  const results = {
    database: await testDatabase(),
    telegram: await testTelegram()
  };
  
  console.log('\n=== TEST RESULTS ===');
  console.log(`Database: ${results.database ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Telegram: ${results.telegram ? '✅ PASSED' : '❌ FAILED'}`);
  
  process.exit(results.database && results.telegram ? 0 : 1);
}

runTests();