// services/telegram-bot.js
const { Telegraf } = require('telegraf');
const logger = require('../utils/logger');

class TelegramBotService {
  constructor() {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      throw new Error('Telegram bot token not configured');
    }

    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    this.configureCommands();
    this.configureMiddleware();
  }

  configureCommands() {
    this.bot.command('health', (ctx) => this.handleHealthCheck(ctx));
    this.bot.command('verify', (ctx) => this.handleVerify(ctx));
  }

  configureMiddleware() {
    this.bot.use(async (ctx, next) => {
      logger.info(`Received update: ${ctx.updateType}`);
      await next();
    });
  }

  async handleHealthCheck(ctx) {
    if (ctx.from.id.toString() !== process.env.ADMIN_CHAT_ID) {
      return ctx.reply('⛔ Unauthorized');
    }

    try {
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();

      await ctx.replyWithMarkdown(`
        *🤖 Bot Health Status*
        - Uptime: ${Math.floor(uptime / 60)} minutes
        - Memory: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB
        - Node: ${process.version}
        - Env: ${process.env.NODE_ENV}
      `);
    } catch (error) {
      logger.error('Health check failed', error);
      ctx.reply('❌ Health check failed');
    }
  }

  async handleVerify(ctx) {
    if (ctx.from.id.toString() !== process.env.ADMIN_CHAT_ID) {
      return ctx.reply('⛔ Unauthorized');
    }

    try {
      const chat = await this.bot.telegram.getChat(ctx.chat.id);
      await ctx.replyWithMarkdown(`
        *✅ Chat Verified*
        - ID: \`${chat.id}\`
        - Type: ${chat.type}
        - Title: ${chat.title || 'N/A'}
      `);
    } catch (error) {
      logger.error('Chat verification failed', error);
      ctx.reply('❌ Verification failed');
    }
  }

  async postToChannel(content, options = {}) {
    const maxRetries = options.retries || process.env.MAX_RETRIES || 3;
    const retryDelay = options.delay || process.env.RETRY_DELAY || 2000;

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

        logger.info(`Message posted successfully (attempt ${attempt})`, {
          messageId: response.message_id,
          chatId: response.chat.id
        });

        return response;
      } catch (error) {
        logger.error(`Post attempt ${attempt} failed`, {
          error: error.message,
          stack: error.stack
        });

        if (attempt >= maxRetries) {
          throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
        }

        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }

  start() {
    return this.bot.launch()
      .then(() => logger.info('Telegram bot started successfully'))
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