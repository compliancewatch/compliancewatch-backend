import { runGenericScraper } from './generic-scraper.js';
import { BUSINESS_TARGETS } from '../../config/targets.js';

const target = BUSINESS_TARGETS.find(t => t.scraper === 'financial-times');

export async function runFinancialTimesScraper() {
  return runGenericScraper(target);
}

export default runFinancialTimesScraper;
