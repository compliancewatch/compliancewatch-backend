import { runGenericScraper } from './generic-scraper.js';
import { REGULATORY_TARGETS } from '../../config/targets.js';

const target = REGULATORY_TARGETS.find(t => t.scraper === 'cvm-brazil');

export async function runCVMBrazilScraper() {
  return runGenericScraper(target);
}

export default runCVMBrazilScraper;
