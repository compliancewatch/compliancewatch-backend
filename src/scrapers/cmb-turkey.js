import { runGenericScraper } from './generic-scraper.js';
import { REGULATORY_TARGETS } from '../../config/targets.js';

const target = REGULATORY_TARGETS.find(t => t.scraper === 'cmb-turkey');

export async function runCMBTurkeyScraper() {
  return runGenericScraper(target);
}

export default runCMBTurkeyScraper;
