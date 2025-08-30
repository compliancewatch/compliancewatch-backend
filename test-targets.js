// test-targets.js
import { REGULATORY_TARGETS, BUSINESS_TARGETS, CRYPTO_TARGETS } from './config/targets.js';

console.log('🔍 Checking target configurations...\n');

// Function to validate URLs
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

console.log('📋 REGULATORY TARGETS:');
REGULATORY_TARGETS.forEach((target, index) => {
  const isValid = isValidUrl(target.url);
  console.log(`${index + 1}. ${target.name}`);
  console.log(`   URL: ${target.url} ${isValid ? '✅' : '❌'}`);
  console.log(`   Selector: "${target.titleSelector || 'default'}"`);
  console.log(`   Scraper: ${target.scraper}`);
  console.log(`   Type: ${target.type}`);
  if (target.waitForSelector) console.log(`   Wait For: ${target.waitForSelector}`);
  console.log('---');
});

console.log('\n📋 BUSINESS TARGETS:');
BUSINESS_TARGETS.forEach((target, index) => {
  const isValid = isValidUrl(target.url);
  console.log(`${index + 1}. ${target.name}`);
  console.log(`   URL: ${target.url} ${isValid ? '✅' : '❌'}`);
  console.log(`   Selector: "${target.titleSelector || 'default'}"`);
  console.log(`   Scraper: ${target.scraper}`);
  console.log(`   Type: ${target.type}`);
  if (target.stealth) console.log(`   Stealth: ${target.stealth}`);
  if (target.waitTimeout) console.log(`   Timeout: ${target.waitTimeout}ms`);
  console.log('---');
});

console.log('\n📋 CRYPTO TARGETS:');
CRYPTO_TARGETS.forEach((target, index) => {
  const isValid = isValidUrl(target.url);
  console.log(`${index + 1}. ${target.name}`);
  console.log(`   URL: ${target.url} ${isValid ? '✅' : '❌'}`);
  console.log(`   Selector: "${target.titleSelector || 'default'}"`);
  console.log(`   Scraper: ${target.scraper}`);
  console.log(`   Type: ${target.type}`);
  console.log('---');
});

// Summary
console.log('\n📊 SUMMARY:');
console.log(`Regulatory Targets: ${REGULATORY_TARGETS.length}`);
console.log(`Business Targets: ${BUSINESS_TARGETS.length}`);
console.log(`Crypto Targets: ${CRYPTO_TARGETS.length}`);
console.log(`Total Targets: ${REGULATORY_TARGETS.length + BUSINESS_TARGETS.length + CRYPTO_TARGETS.length}`);

console.log('\n🧪 Testing critical imports...');

// Test imports with better error handling
async function testImport(modulePath, moduleName) {
  try {
    const module = await import(modulePath);
    console.log(`✅ ${moduleName} imports successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${moduleName} import failed:`, error.message);
    return false;
  }
}

async function runImportTests() {
  console.log('\n🔧 Testing module imports...');
  
  const tests = [
    { path: './src/scrapers/generic-scraper.js', name: 'generic-scraper.js' },
    { path: './src/services/database.js', name: 'database.js' },
    { path: './src/services/telegram-bot.js', name: 'telegram-bot.js' },
    { path: './src/scrapers/un-security-council.js', name: 'un-security-council.js' },
    { path: './src/scrapers/sec.js', name: 'sec.js' },
    { path: './src/scrapers/bloomberg.js', name: 'bloomberg.js' },
    { path: './src/scrapers/coindesk.js', name: 'coindesk.js' }
  ];

  let successCount = 0;
  let totalCount = tests.length;

  for (const test of tests) {
    const success = await testImport(test.path, test.name);
    if (success) successCount++;
  }

  console.log(`\n📈 Import Results: ${successCount}/${totalCount} successful`);
  
  if (successCount === totalCount) {
    console.log('🎉 All imports work perfectly!');
  } else {
    console.log('⚠️  Some imports failed. Check the errors above.');
  }
}

// Test if individual scraper files exist and can import generic-scraper
async function testScraperImports() {
  console.log('\n🔧 Testing scraper-graper relationships...');
  
  const scrapersToTest = [
    'un-security-council',
    'sec', 
    'bloomberg',
    'coindesk',
    'reuters',
    'financial-times'
  ];

  for (const scraperName of scrapersToTest) {
    try {
      const scraperPath = `./src/scrapers/${scraperName}.js`;
      const scraperModule = await import(scraperPath);
      
      if (typeof scraperModule.default === 'function') {
        console.log(`✅ ${scraperName}.js exports function correctly`);
      } else {
        console.log(`⚠️  ${scraperName}.js missing default export`);
      }
    } catch (error) {
      console.log(`❌ ${scraperName}.js not found or has errors`);
    }
  }
}

// Run all tests
async function runAllTests() {
  await runImportTests();
  await testScraperImports();
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Check URLs for validity (✅ vs ❌)');
  console.log('2. Verify selectors match website structures');
  console.log('3. Ensure all scraper files exist and import correctly');
  console.log('4. Fix any import errors shown above');
  console.log('5. Change package.json start script back to:');
  console.log('   "start": "NODE_ENV=production node src/bootstrap.js"');
}

// Run the tests with error handling
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error.message);
});
