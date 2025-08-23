import { runGenericScraper } from './generic-scraper.js';
import { REGULATORY_TARGETS } from '../../config/targets.js';

const target = REGULATORY_TARGETS.find(t => t.scraper === 'eu-commission');

export async function runEUCommissionScraper() {
  return runGenericScraper(target);
}

export default runEUCommissionScraper;
