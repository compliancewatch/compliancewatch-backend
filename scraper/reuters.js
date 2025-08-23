import { runGenericScraper } from './generic-scraper.js';
import { BUSINESS_TARGETS } from '../../config/targets.js';

const target = BUSINESS_TARGETS.find(t => t.scraper === 'reuters');

export async function runReutersScraper() {
  return runGenericScraper(target);
}

export default runReutersScraper;
