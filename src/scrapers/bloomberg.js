import { runGenericScraper } from './generic-scraper.js';
import { BUSINESS_TARGETS } from '../../config/targets.js';

const target = BUSINESS_TARGETS.find(t => t.scraper === 'bloomberg');

export async function runBloombergScraper() {
  return runGenericScraper(target);
}

export default runBloombergScraper;
