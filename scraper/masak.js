import { runGenericScraper } from './generic-scraper.js';
import { REGULATORY_TARGETS } from '../../config/targets.js';

const target = REGULATORY_TARGETS.find(t => t.scraper === 'masak');

export async function runMASAKScraper() {
  return runGenericScraper(target);
}

export default runMASAKScraper;
