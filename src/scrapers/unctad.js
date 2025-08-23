import { runGenericScraper } from './generic-scraper.js';
import { REGULATORY_TARGETS } from '../../config/targets.js';

const target = REGULATORY_TARGETS.find(t => t.scraper === 'unctad');

export async function runUNCTADScraper() {
  return runGenericScraper(target);
}

export default runUNCTADScraper;
