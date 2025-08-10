import express from 'express';
import dotenv from 'dotenv';
import { scrapeFATF } from './scraper/fatf.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/scrape/fatf', async (req, res) => {
  try {
    const data = await scrapeFATF();
    res.json(data);
  } catch (error) {
    console.error('❌ Error in FATF scraper:', error.message);
    res.status(500).json({ error: 'Scraping failed: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ ComplianceWatch backend listening on port ${PORT}`);
});

