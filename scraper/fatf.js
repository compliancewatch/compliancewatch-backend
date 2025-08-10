import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { AISummarizer } from './ai-summarizer.js';
import { formatForTelegram } from './telegram-formatter.js';
import { writeFileSync } from 'fs';

// 1. Configure Puppeteer
puppeteer.use(StealthPlugin());
const summarizer = new AISummarizer();

async function scrapeFATF() {
  // 2. Launch Browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // 3. Navigate to Page
    await page.goto('https://www.fatf-gafi.org/en/publications.html', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // 4. Extract Publications
    const rawResults = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.list-item')).map(item => ({
        title: item.querySelector('a')?.textContent.trim() || 'No title',
        link: new URL(item.querySelector('a')?.href, location.href).toString(),
        date: item.querySelector('.date')?.textContent.trim() || 'No date'
      }));
    });

    // 5. Process with AI Summaries
    const processed = await Promise.all(
      rawResults.map(async item => ({
        ...item,
        source: 'FATF',
        summary: await summarizer.summarize(
          `${item.title} ${await getFirstParagraph(item.link)}`,
          'FATF'
        )
      }))
    );

    // 6. Filter Recent (48 hours)
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const recent = processed.filter(pub => 
      new Date(pub.date) >= cutoff
    );

    // 7. Save and Format Results
    writeFileSync('fatf-results.json', JSON.stringify(recent, null, 2));
    return recent.map(formatForTelegram);

  } finally {
    await browser.close();
  }
}

// Helper to get first paragraph
async function getFirstParagraph(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  
  const text = await page.evaluate(() => {
    return document.querySelector('p')?.textContent?.substring(0, 200) || '';
  });
  
  await browser.close();
  return text;
}

// 8. Execute
scrapeFATF().then(posts => {
  console.log('Telegram Posts:');
  posts.forEach(post => console.log(post + '\n' + '='.50));
  process.exit(0);
}).catch(err => {
  console.error('Scrape failed:', err);
  process.exit(1);
});