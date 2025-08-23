import { runGenericScraper } from './generic-scraper.js';
import { BUSINESS_TARGETS } from '../../config/targets.js';

const target = BUSINESS_TARGETS.find(t => t.scraper === 'yahoo-finance');

export async function runYahooFinanceScraper() {
  return runGenericScraper(target);
}

export default runYahooFinanceScraper;
