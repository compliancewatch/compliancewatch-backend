import { runGenericScraper } from './generic-scraper.js';
import { REGULATORY_TARGETS } from '../../config/targets.js';

const target = REGULATORY_TARGETS.find(t => t.scraper === 'un-security-council');

export async function runUNSecurityCouncilScraper() {
  return runGenericScraper(target);
}

export default runUNSecurityCouncilScraper;
