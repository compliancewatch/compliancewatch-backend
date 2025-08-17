// services/scheduler.js
const cron = require('node-cron');
const logger = require('../utils/logger');
const scrapeFATF = require('../scraper/regulatory/fatf');
const telegramBot = require('./telegram-bot');

class Scheduler {
  constructor() {
    this.jobs = [];
  }

  init() {
    this.addJob({
      name: 'fatf-scraper',
      schedule: '0 */3 * * *',
      task: async () => {
        try {
          await scrapeFATF();
          await telegramBot.postToChannel(
            '🔄 *Automatic Update*\\n' +
            `• Source: FATF\\n` +
            `• Time: ${new Date().toLocaleString()}\\n` +
            '• Status: Scrape completed'
          );
        } catch (error) {
          logger.error('Scheduled job failed', error);
        }
      }
    });

    logger.info('Scheduler initialized');
  }

  addJob({ name, schedule, task }) {
    const job = cron.schedule(schedule, task, {
      scheduled: true,
      timezone: 'Etc/UTC'
    });

    this.jobs.push({ name, job });
    logger.info(`Job "${name}" scheduled: ${schedule}`);
  }

  stopAll() {
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      logger.info(`Job "${name}" stopped`);
    });
  }
}

module.exports = new Scheduler();