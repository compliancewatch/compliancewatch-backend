import { runGenericScraper } from './generic-scraper.js';
import { REGULATORY_TARGETS } from '../../config/targets.js';

const target = REGULATORY_TARGETS.find(t => t.scraper === 'sca-uae');

export async function runSCAUAEScraper() {
  return runGenericScraper(target);
}

export default runSCAUAEScraper;
