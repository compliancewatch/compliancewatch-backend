import { runGenericScraper } from './generic-scraper.js';
import { REGULATORY_TARGETS } from '../../config/targets.js';

const target = REGULATORY_TARGETS.find(t => t.scraper === 'cbrc-china');

export async function runCBRCChinaScraper() {
  return runGenericScraper(target);
}

export default runCBRCChinaScraper;
