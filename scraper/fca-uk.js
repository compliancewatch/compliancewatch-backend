import { runGenericScraper } from './generic-scraper.js';
import { REGULATORY_TARGETS } from '../../config/targets.js';

const target = REGULATORY_TARGETS.find(t => t.scraper === 'fca-uk');

export async function runFCAUKScraper() {
  return runGenericScraper(target);
}

export default runFCAUKScraper;
