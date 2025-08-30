// test-targets.js
import { REGULATORY_TARGETS, BUSINESS_TARGETS, CRYPTO_TARGETS } from './config/targets.js';

console.log('🔍 Checking target configurations...\n');

console.log('📋 REGULATORY TARGETS:');
REGULATORY_TARGETS.forEach((target, index) => {
  console.log(`${index + 1}. ${target.name}`);
  console.log(`   URL: ${target.url}`);
  console.log(`   Selector: ${target.titleSelector || 'default'}`);
  console.log(`   Scraper: ${target.scraper}`);
  console.log('---');
});

console.log('\n📋 BUSINESS TARGETS:');
BUSINESS_TARGETS.forEach((target, index) => {
  console.log(`${index + 1}. ${target.name}`);
  console.log(`   URL: ${target.url}`);
  console.log(`   Selector: ${target.titleSelector || 'default'}`);
  console.log(`   Scraper: ${target.scraper}`);
  console.log('---');
});

console.log('\n📋 CRYPTO TARGETS:');
CRYPTO_TARGETS.forEach((target, index) => {
  console.log(`${index + 1}. ${target.name}`);
  console.log(`   URL: ${target.url}`);
  console.log(`   Selector: ${target.titleSelector || 'default'}`);
  console.log(`   Scraper: ${target.scraper}`);
  console.log('---');
});
