import { runGenericScraper } from './generic-scraper.js';
import { CRYPTO_TARGETS } from '../../config/targets.js';

const target = CRYPTO_TARGETS.find(t => t.scraper === 'cointelegraph');

export async function runCoinTelegraphScraper() {
  return runGenericScraper(target);
}

export default runCoinTelegraphScraper;
