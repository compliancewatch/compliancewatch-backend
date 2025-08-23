import { runGenericScraper } from './generic-scraper.js';
import { CRYPTO_TARGETS } from '../../config/targets.js';

const target = CRYPTO_TARGETS.find(t => t.scraper === 'cryptoslate');

export async function runCryptoSlateScraper() {
  return runGenericScraper(target);
}

export default runCryptoSlateScraper;
