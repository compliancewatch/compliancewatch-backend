// services/telegram-bot.js
const { Telegraf } = require('telegraf');
const logger = require('../utils/logger');
const db = require('./database');
const scheduler = require('./scheduler');

class TelegramBotService {
  constructor() {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN missing in environment');
    }

    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    this.configureCommands();
    this.configureMiddleware();
  }

  configureCommands() {
    // System monitoring commands
    this.bot.command('status', (ctx) => this.handleStatus(ctx));
    this.bot.command('logs', (ctx) => this.handleLogs(ctx));
    this.bot.command('queue', (ctx) => this.handleQueue(ctx));
    
    // Admin controls
    this.bot.command('scrape_now', (ctx) => this.handleScrapeNow(ctx));
    this.bot.command('post_now', (ctx) => this.handlePostNow(ctx));
  }

  configureMiddleware() {
    this.bot.use(async (ctx, next) => {
      logger.info(`Telegram Update: ${ctx.updateType} from ${ctx.from?.id}`);
      await next();
    });
  }

  async handleStatus(ctx) {
    if (!this.isAdmin(ctx)) return;
    
    try {
      const [dbStatus, uptime, lastScrape] = await Promise.all([
        db.testConnection(),
        process.uptime(),
        scheduler.lastScrapeTime
      ]);

      await ctx.replyWithMarkdown(`
        *🤖 System Status*
        - Database: ${dbStatus ? '✅ Connected' : '❌ Disconnected'}
        - Uptime: ${this.formatUptime(uptime)}
        - Last Scrape: ${lastScrape ? lastScrape.toUTCString() : 'Never'}
        - Queue: ${scheduler.postQueue.length} pending posts
        - Env: ${process.env.NODE_ENV || 'development'}
      `);
    } catch (error) {
      logger.error('Status command failed', error);
      ctx.reply('❌ Status check failed');
    }
  }

  async handleLogs(ctx) {
    if (!this.isAdmin(ctx)) return;
    
    try {
      const logs = await this.fetchRecentLogs(5);
      await ctx.replyWithMarkdown(`📋 *Last 5 Log Entries*\n\`\`\`\n${logs}\n\`\`\``);
    } catch (error) {
      logger.error('Logs command failed', error);
      ctx.reply('❌ Failed to fetch logs');
    }
  }

  async handleQueue(ctx) {
    if (!this.isAdmin(ctx)) return;
    
    try {
      const queue = scheduler.postQueue.slice(0, 5);
      const message = queue.length > 0 
        ? `📬 Next ${queue.length} posts:\n${queue.map((item, i) => `${i+1}. ${item.title.slice(0, 30)}...`).join('\n')}`
        : '🔄 Queue is currently empty';
      await ctx.reply(message);
    } catch (error) {
      logger.error('Queue command failed', error);
      ctx.reply('❌ Failed to fetch queue');
    }
  }

  async handleScrapeNow(ctx) {
    if (!this.isAdmin(ctx)) return;
    
    try {
      await ctx.reply('🔄 Starting manual scrape...');
      await scheduler.runScrapeCycle();
      await ctx.reply('✅ Scrape completed successfully');
    } catch (error) {
      logger.error('Manual scrape failed', error);
      ctx.reply('❌ Scrape failed - check logs');
    }
  }

  async handlePostNow(ctx) {
    if (!this.isAdmin(ctx)) return;
    
    try {
      await ctx.reply('📨 Starting manual post...');
      await scheduler.runPostCycle();
      await ctx.reply('✅ Posts sent successfully');
    } catch (error) {
      logger.error('Manual post failed', error);
      ctx.reply('❌ Post failed - check logs');
    }
  }

  // Helper methods
  isAdmin(ctx) {
    return ctx.from?.id.toString() === process.env.ADMIN_CHAT_ID;
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  }

  async fetchRecentLogs(count = 5) {
    // Implement actual log retrieval from your logging system
    // This is a placeholder implementation
    const logs = logger.getRecentEntries(count);
    return logs.join('\n') || 'No logs available';
  }

  // Message posting with retry logic
  async postToChannel(content, options = {}) {
    const maxRetries = options.retries || 3;
    const retryDelay = options.delay || 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.bot.telegram.sendMessage(
          process.env.TELEGRAM_CHANNEL_ID,
          content,
          {
            parse_mode: 'MarkdownV2',
            disable_web_page_preview: true,
            ...options
          }
        );
        return response;
      } catch (error) {
        if (attempt >= maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }

  start() {
    return this.bot.launch()
      .then(() => logger.info('Telegram bot started'))
      .catch(error => {
        logger.error('Bot startup failed', error);
        process.exit(1);
      });
  }

  stop() {
    this.bot.stop();
  }
}

module.exports = new TelegramBotService();