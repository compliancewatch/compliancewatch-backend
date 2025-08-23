import { runGenericScraper } from './generic-scraper.js';
import { REGULATORY_TARGETS } from '../../config/targets.js';

const target = REGULATORY_TARGETS.find(t => t.scraper === 'cnbv-mexico');

export async function runCNBVMexicoScraper() {
  return runGenericScraper(target);
}

export default runCNBVMexicoScraper;
