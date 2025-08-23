import { runGenericScraper } from './generic-scraper.js';
import { REGULATORY_TARGETS } from '../../config/targets.js';

const target = REGULATORY_TARGETS.find(t => t.scraper === 'sec');

export async function runSECScraper() {
  return runGenericScraper(target);
}

export default runSECScraper;
