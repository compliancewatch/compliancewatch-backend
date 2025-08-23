import { runGenericScraper } from './generic-scraper.js';
import { REGULATORY_TARGETS } from '../../config/targets.js';

const target = REGULATORY_TARGETS.find(t => t.scraper === 'mas-singapore');

export async function runMASSingaporeScraper() {
  return runGenericScraper(target);
}

export default runMASSingaporeScraper;
