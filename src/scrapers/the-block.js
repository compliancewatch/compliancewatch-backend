import { runGenericScraper } from './generic-scraper.js';
import { CRYPTO_TARGETS } from '../../config/targets.js';

const target = CRYPTO_TARGETS.find(t => t.scraper === 'the-block');

export async function runTheBlockScraper() {
  return runGenericScraper(target);
}

export default runTheBlockScraper;
