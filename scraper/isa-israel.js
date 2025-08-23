import { runGenericScraper } from './generic-scraper.js';
import { REGULATORY_TARGETS } from '../../config/targets.js';

const target = REGULATORY_TARGETS.find(t => t.scraper === 'isa-israel');

export async function runISAIsraelScraper() {
  return runGenericScraper(target);
}

export default runISAIsraelScraper;
