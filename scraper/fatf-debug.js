import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { writeFileSync } from 'fs';

puppeteer.use(StealthPlugin());

async function debugFATF() {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    devtools: true
  });

  const page = await browser.newPage();
  
  // Debug events
  page.on('response', response => {
    if (response.url().includes('faceted_search')) {
      console.log('FACETED SEARCH API:', response.url());
    }
  });

  console.log("Navigating...");
  await page.goto('https://www.fatf-gafi.org/en/publications.html');

  // Wait for API call
  const apiResponse = await page.waitForResponse(response => 
    response.url().includes('results.facets.json')
  );
  const data = await apiResponse.json();
  
  writeFileSync('debug-api-response.json', JSON.stringify(data, null, 2));
  console.log("API data saved");

  await browser.close();
  return data;
}

debugFATF().then(console.log).catch(console.error);