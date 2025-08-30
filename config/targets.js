// config/targets.js - PRODUCTION-READY CONFIGURATION WITH ALL ENHANCEMENTS

// Global configuration for robust scraping
export const SCRAPER_CONFIG = {
  defaultTimezone: "UTC",
  dateFormat: "ISO8601",
  maxTitleLength: 200,
  minTitleLength: 15,
  requestTimeout: 30000,
  navigationTimeout: 45000,
  retryAttempts: 2,
  retryDelay: 5000,
  
  excludedPatterns: [
    "^Home$", "^Menu$", "^Navigation$", "^Search$", "^Login$", "^Sign In$",
    "^Subscribe$", "^Contact$", "^About$", "^Hakkımızda$", "^İletişim$",
    "^Ana Sayfa$", "^Portfolio$", "^Markets$", "^MyFT$", "^Settings$",
    "^Privacy$", "^Terms$", "^Careers$", "^Advertise$", "^Cookie$",
    "^Newsletter$", "^Podcast$", "^Trending$", "^Watchlist$", "^Pro$",
    "^Commission$", "^Division$", "^Office$", "^Consultation$", "^Guidance$",
    "^Policy$", "^Notice$", "^Circular$", "^Announcement$", "^Report$",
    "^Publication$", "^Study$", "^Speech$", "^Statement$", "^Remarks$",
    "^Document$", "^Meeting$", "^Kurumsal$", "^Başkan$", "^Baskan$"
  ],

  userAgents: [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  ],

  datePatterns: {
    ISO: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    DD_MMM_YYYY: /(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/,
    MMM_DD_YYYY: /([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})/,
    MM_DD_YYYY: /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    YYYY_MM_DD: /(\d{4})-(\d{1,2})-(\d{1,2})/,
    relative: /(\d+)\s+(minute|hour|day|week|month|year)s?\s+ago/i
  }
};

export const REGULATORY_TARGETS = [
  {
    name: "UN Security Council",
    url: "https://press.un.org/en/content/security-council",
    titleSelector: ".panel-pane.pane-views.pane-news-listing h3 a",
    dateSelector: ".date-display-single, time[datetime]",
    type: "regulatory",
    scraper: "un-security-council",
    waitForSelector: ".view-news-listing",
    timezone: "UTC",
    verification: { minLength: 20, maxLength: 150 },
    deduplication: { strategy: "title+date", threshold: 0.9 },
    priority: 1,
    scrollConfig: { enabled: false }
  },
  {
    name: "SEC Filings",
    url: "https://www.sec.gov/news/pressreleases",
    titleSelector: "#content .title a",
    dateSelector: "#content time[datetime]",
    type: "regulatory",
    scraper: "sec",
    waitForSelector: "#content .article",
    timezone: "America/New_York",
    verification: { minLength: 15, maxLength: 120 },
    deduplication: { strategy: "title", threshold: 0.85 },
    priority: 1
  },
  {
    name: "EU Commission",
    url: "https://ec.europa.eu/commission/presscorner/home/en",
    titleSelector: ".ecl-list-item__link .ecl-link",
    dateSelector: ".ecl-list-item__secondary .ecl-date-block, time[datetime]",
    type: "regulatory",
    scraper: "eu-commission",
    waitForSelector: ".ecl-list-item",
    timezone: "Europe/Brussels",
    verification: { minLength: 20, maxLength: 200 },
    deduplication: { strategy: "title+url", threshold: 0.8 }
  },
  {
    name: "FATF",
    url: "https://www.fatf-gafi.org/en/high-risk/",
    titleSelector: ".high-risk-list li",
    dateSelector: ".content .date, time[datetime]",
    type: "regulatory",
    scraper: "fatf",
    waitForSelector: ".high-risk-list",
    timezone: "UTC",
    verification: { minLength: 5, maxLength: 50 },
    notes: "Lists country names, shorter titles expected"
  },
  {
    name: "FCA UK",
    url: "https://www.fca.org.uk/news",
    titleSelector: ".news-list__item .news-list__title a",
    dateSelector: ".news-list__item time[datetime]",
    type: "regulatory",
    scraper: "fca-uk",
    waitForSelector: ".news-list",
    timezone: "Europe/London",
    verification: { minLength: 20, maxLength: 120 },
    deduplication: { strategy: "title+date", threshold: 0.9 }
  },
  {
    name: "CBRC China",
    url: "https://www.cbirc.gov.cn/en/index.html",
    titleSelector: ".news-list li a",
    dateSelector: ".news-list .date, time[datetime]",
    type: "regulatory",
    scraper: "cbrc-china",
    waitForSelector: ".news-list",
    timezone: "Asia/Shanghai",
    verification: { minLength: 15, maxLength: 100 },
    stealth: true
  },
  {
    name: "CMB Turkey",
    url: "https://www.cmb.gov.tr/",
    titleSelector: ".duyurular-listesi .duyuru-baslik a",
    dateSelector: ".duyurular-listesi .tarih, time[datetime]",
    type: "regulatory",
    scraper: "cmb-turkey",
    waitForSelector: ".duyurular-listesi",
    timezone: "Europe/Istanbul",
    verification: { minLength: 20, maxLength: 120 },
    deduplication: { strategy: "title", threshold: 0.85 }
  },
  {
    name: "CNBV Mexico",
    url: "https://www.gob.mx/cnbv",
    titleSelector: ".article-list .title a",
    dateSelector: ".article-list .published, time[datetime]",
    type: "regulatory",
    scraper: "cnbv-mexico",
    waitForSelector: ".article-list",
    timezone: "America/Mexico_City",
    verification: { minLength: 15, maxLength: 100 }
  },
  {
    name: "CVM Brazil",
    url: "https://www.cvm.gov.br/",
    titleSelector: ".noticias-lista .noticia-titulo a",
    dateSelector: ".noticias-lista .noticia-data, time[datetime]",
    type: "regulatory",
    scraper: "cvm-brazil",
    waitForSelector: ".noticias-lista",
    timezone: "America/Sao_Paulo",
    verification: { minLength: 20, maxLength: 120 }
  },
  {
    name: "ISA Israel",
    url: "https://www.isa.gov.il/Pages/default.aspx",
    titleSelector: ".news-items .news-title a",
    dateSelector: ".news-items .news-date, time[datetime]",
    type: "regulatory",
    scraper: "isa-israel",
    waitForSelector: ".news-items",
    timezone: "Asia/Jerusalem",
    verification: { minLength: 15, maxLength: 100 }
  },
  {
    name: "MAS Singapore",
    url: "https://www.mas.gov.sg/news",
    titleSelector: ".media-releases-list .title a",
    dateSelector: ".media-releases-list .date, time[datetime]",
    type: "regulatory",
    scraper: "mas-singapore",
    waitForSelector: ".media-releases-list",
    timezone: "Asia/Singapore",
    verification: { minLength: 20, maxLength: 120 }
  },
  {
    name: "SCA UAE",
    url: "https://www.sca.gov.ae/en/news.aspx",
    titleSelector: ".news-listing .news-title a",
    dateSelector: ".news-listing .news-date, time[datetime]",
    type: "regulatory",
    scraper: "sca-uae",
    waitForSelector: ".news-listing",
    timezone: "Asia/Dubai",
    verification: { minLength: 15, maxLength: 100 }
  },
  {
    name: "MASAK Turkey",
    url: "https://www.hmb.gov.tr/",
    titleSelector: ".duyuru-list .duyuru-baslik a",
    dateSelector: ".duyuru-list .duyuru-tarih, time[datetime]",
    type: "regulatory",
    scraper: "masak",
    waitForSelector: ".duyuru-list",
    timezone: "Europe/Istanbul",
    verification: { minLength: 20, maxLength: 120 },
    deduplication: { strategy: "title", threshold: 0.85 }
  },
  {
    name: "UNCTAD",
    url: "https://unctad.org/news",
    titleSelector: ".news-list .news-title a",
    dateSelector: ".news-list .news-date, time[datetime]",
    type: "regulatory",
    scraper: "unctad",
    waitForSelector: ".news-list",
    timezone: "UTC",
    verification: { minLength: 20, maxLength: 150 }
  }
];

export const BUSINESS_TARGETS = [
  {
    name: "Bloomberg Markets",
    url: "https://www.bloomberg.com/markets",
    titleSelector: "[data-component='headline']",
    dateSelector: "time[datetime]",
    type: "business",
    scraper: "bloomberg",
    stealth: true,
    waitTimeout: 25000,
    timezone: "America/New_York",
    verification: { minLength: 10, maxLength: 120 },
    dynamicContent: true,
    scrollConfig: {
      enabled: true,
      scrollCount: 3,
      scrollDelay: 2000,
      scrollStep: 800
    },
    executeScript: `
      // Scroll to load dynamic content
      let scrollCount = 0;
      const scrollInterval = setInterval(() => {
        window.scrollBy(0, 800);
        scrollCount++;
        if (scrollCount >= 3) clearInterval(scrollInterval);
      }, 2000);
    `,
    deduplication: { strategy: "title+url", threshold: 0.8 },
    priority: 1
  },
  {
    name: "Reuters Business",
    url: "https://www.reuters.com/business/",
    titleSelector: "[data-testid='Heading']",
    dateSelector: "time[datetime]",
    type: "business",
    scraper: "reuters",
    waitForSelector: "[data-testid='story-card']",
    timezone: "UTC",
    verification: { minLength: 15, maxLength: 150 },
    dynamicContent: true,
    scrollConfig: {
      enabled: true,
      scrollCount: 2,
      scrollDelay: 1500,
      scrollStep: 600
    },
    executeScript: `
      // Scroll to load more articles
      window.scrollTo(0, 1200);
      setTimeout(() => window.scrollTo(0, 2400), 1500);
    `,
    deduplication: { strategy: "title+date", threshold: 0.85 }
  },
  {
    name: "Financial Times",
    url: "https://www.ft.com/",
    titleSelector: "[data-trackable='heading-link']",
    dateSelector: "time[datetime]",
    type: "business",
    scraper: "financial-times",
    stealth: true,
    waitForSelector: "[data-component='teaser-list']",
    timezone: "Europe/London",
    verification: { minLength: 20, maxLength: 200 },
    dynamicContent: true,
    scrollConfig: {
      enabled: true,
      scrollCount: 3,
      scrollDelay: 2500,
      scrollStep: 700
    },
    executeScript: `
      // FT requires multiple scrolls to load content
      const scrollFT = () => {
        window.scrollBy(0, 700);
        setTimeout(() => window.scrollBy(0, 700), 1200);
        setTimeout(() => window.scrollBy(0, 700), 2400);
      };
      scrollFT();
    `,
    deduplication: { strategy: "title+url", threshold: 0.9 }
  },
  {
    name: "Yahoo Finance",
    url: "https://finance.yahoo.com/news/",
    titleSelector: "[data-test-locator='headline'] a",
    dateSelector: "time[datetime]",
    type: "business",
    scraper: "yahoo-finance",
    waitForSelector: "[data-test-locator='stream-items']",
    timezone: "America/New_York",
    verification: { minLength: 10, maxLength: 100 },
    scrollConfig: { enabled: false }
  }
];

export const CRYPTO_TARGETS = [
  {
    name: "CoinDesk",
    url: "https://www.coindesk.com/",
    titleSelector: "[data-testid='headline']",
    dateSelector: "time[datetime]",
    type: "crypto",
    scraper: "coindesk",
    waitForSelector: "[data-testid='card']",
    timezone: "UTC",
    verification: { minLength: 10, maxLength: 120 },
    dynamicContent: true,
    scrollConfig: {
      enabled: true,
      scrollCount: 2,
      scrollDelay: 1000,
      scrollStep: 500
    },
    executeScript: `
      // CoinDesk infinite scroll
      window.scrollTo(0, 1000);
      setTimeout(() => window.scrollTo(0, 2000), 1000);
    `,
    deduplication: { strategy: "title", threshold: 0.85 }
  },
  {
    name: "CoinTelegraph",
    url: "https://cointelegraph.com/",
    titleSelector: ".post__title a",
    dateSelector: ".post__time time[datetime]",
    type: "crypto",
    scraper: "cointelegraph",
    waitForSelector: ".posts__item",
    timezone: "UTC",
    verification: { minLength: 15, maxLength: 100 },
    scrollConfig: { enabled: false }
  },
  {
    name: "CryptoSlate",
    url: "https://cryptoslate.com/",
    titleSelector: ".article__title a",
    dateSelector: ".article__date time[datetime]",
    type: "crypto",
    scraper: "cryptoslate",
    waitForSelector: ".article__list",
    timezone: "UTC",
    verification: { minLength: 10, maxLength: 100 }
  },
  {
    name: "The Block",
    url: "https://www.theblock.co/",
    titleSelector: ".article__title a",
    dateSelector: ".article__time time[datetime]",
    type: "crypto",
    scraper: "the-block",
    waitForSelector: ".articles__list",
    timezone: "UTC",
    verification: { minLength: 15, maxLength: 120 }
  }
];

// Utility functions for date parsing and deduplication
export const DateUtils = {
  parseDate: (dateString, timezone = "UTC") => {
    if (!dateString) return new Date().toISOString();
    
    // Already ISO format
    if (SCRAPER_CONFIG.datePatterns.ISO.test(dateString)) {
      return dateString;
    }
    
    // Relative dates (e.g., "2 hours ago")
    const relativeMatch = dateString.match(SCRAPER_CONFIG.datePatterns.relative);
    if (relativeMatch) {
      const amount = parseInt(relativeMatch[1]);
      const unit = relativeMatch[2].toLowerCase();
      const now = new Date();
      
      const unitMap = {
        minute: 60000,
        hour: 3600000,
        day: 86400000,
        week: 604800000,
        month: 2592000000,
        year: 31536000000
      };
      
      const offset = unitMap[unit] * amount;
      return new Date(now.getTime() - offset).toISOString();
    }
    
    // DD MMM YYYY (e.g., "15 Dec 2023")
    const ddMmmMatch = dateString.match(SCRAPER_CONFIG.datePatterns.DD_MMM_YYYY);
    if (ddMmmMatch) {
      const day = ddMmmMatch[1];
      const month = this.getMonthNumber(ddMmmMatch[2]);
      const year = ddMmmMatch[3];
      return new Date(Date.UTC(year, month, day)).toISOString();
    }
    
    // MMM DD, YYYY (e.g., "Dec 15, 2023")
    const mmmDdMatch = dateString.match(SCRAPER_CONFIG.datePatterns.MMM_DD_YYYY);
    if (mmmDdMatch) {
      const month = this.getMonthNumber(mmmDdMatch[1]);
      const day = mmmDdMatch[2];
      const year = mmmDdMatch[3];
      return new Date(Date.UTC(year, month, day)).toISOString();
    }
    
    // Fallback to native parsing
    const parsed = new Date(dateString);
    return isNaN(parsed) ? new Date().toISOString() : parsed.toISOString();
  },

  getMonthNumber: (monthName) => {
    const months = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    return months[monthName.toLowerCase().substring(0, 3)] || 0;
  }
};

export const DeduplicationUtils = {
  normalizeText: (text) => {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  similarity: (text1, text2) => {
    const norm1 = this.normalizeText(text1);
    const norm2 = this.normalizeText(text2);
    
    if (norm1 === norm2) return 1.0;
    
    // Simple Jaccard similarity for efficiency
    const words1 = new Set(norm1.split(' '));
    const words2 = new Set(norm2.split(' '));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  },

  deduplicate: (items, strategy = "title", threshold = 0.8) => {
    const seen = new Set();
    const uniqueItems = [];
    
    for (const item of items) {
      let key;
      
      switch (strategy) {
        case "title+date":
          key = `${this.normalizeText(item.title)}|${item.date}`;
          break;
        case "title+url":
          key = `${this.normalizeText(item.title)}|${item.url}`;
          break;
        case "title":
        default:
          key = this.normalizeText(item.title);
      }
      
      // Check if we've seen this exact key
      if (!seen.has(key)) {
        seen.add(key);
        uniqueItems.push(item);
        continue;
      }
      
      // Check for similar items if exact match fails
      let isDuplicate = false;
      for (const uniqueItem of uniqueItems) {
        const similarity = this.similarity(item.title, uniqueItem.title);
        if (similarity >= threshold) {
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        uniqueItems.push(item);
      }
    }
    
    return uniqueItems;
  }
};

// Enhanced scraping strategies
export const ScrapingStrategies = {
  executeDynamicScraping: async (page, target) => {
    if (target.executeScript) {
      await page.evaluate(target.executeScript);
    }
    
    if (target.scrollConfig?.enabled) {
      const { scrollCount, scrollDelay, scrollStep } = target.scrollConfig;
      for (let i = 0; i < scrollCount; i++) {
        await page.evaluate((step) => window.scrollBy(0, step), scrollStep);
        await new Promise(resolve => setTimeout(resolve, scrollDelay));
      }
    }
    
    // Wait for content to load after scrolling
    await new Promise(resolve => setTimeout(resolve, 1000));
  },

  extractWithFallbacks: async (page, selectors, context = null) => {
    const elements = [];
    
    for (const selector of selectors) {
      const fullSelector = context ? `${context} ${selector}` : selector;
      try {
        const found = await page.$$(fullSelector);
        if (found.length > 0) {
          elements.push(...found);
        }
      } catch (error) {
        // Selector failed, continue to next
        continue;
      }
    }
    
    return elements;
  }
};
