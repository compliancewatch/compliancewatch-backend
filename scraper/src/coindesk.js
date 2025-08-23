import { runGenericScraper } from './generic-scraper.js';
import { CRYPTO_TARGETS } from '../../config/targets.js';

const target = CRYPTO_TARGETS.find(t => t.scraper === 'coindesk');

export async function runCoinDeskScraper() {
  return runGenericScraper(target);
}

export default runCoinDeskScraper;
