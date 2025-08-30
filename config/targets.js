// config/targets.js - UPDATED SELECTORS
export const REGULATORY_TARGETS = [
  {
    name: "UN Security Council",
    url: "https://www.un.org/securitycouncil/content/press-releases",
    titleSelector: "h2, h3, h4, a, .title, .headline, [class*='title']",
    dateSelector: "time, .date, .timestamp, [datetime]",
    type: "regulatory",
    scraper: "un-security-council",
    waitForSelector: ".content, article, main" // Wait for content area
  },
  {
    name: "SEC Filings",
    url: "https://www.sec.gov/news/pressreleases",
    titleSelector: "h1, h2, h3, h4, a, .title, .news-title",
    dateSelector: "time, .date, .datetime",
    type: "regulatory", 
    scraper: "sec",
    waitForSelector: "#content"
  },
  {
    name: "EU Commission",
    url: "https://ec.europa.eu/commission/presscorner/home/en",
    titleSelector: "h1, h2, h3, h4, a, .title, .ecl-link",
    dateSelector: "time, .date, .ecl-date-block",
    type: "regulatory",
    scraper: "eu-commission"
  }
];

export const BUSINESS_TARGETS = [
  {
    name: "Bloomberg Markets",
    url: "https://www.bloomberg.com/markets",
    titleSelector: "h1, h2, h3, h4, [data-component*='headline'], .headline",
    dateSelector: "time, [datetime], .timestamp",
    type: "business",
    scraper: "bloomberg",
    stealth: true, // Extra stealth needed
    waitTimeout: 10000 // Longer wait
  },
  {
    name: "Reuters Business",
    url: "https://www.reuters.com/business/",
    titleSelector: "h1, h2, h3, h4, a, [data-testid*='Heading'], .text__text",
    dateSelector: "time, [datetime], .date",
    type: "business",
    scraper: "reuters"
  },
  {
    name: "Financial Times",
    url:https://www.ft.com/",
    titleSelector: "h1, h2, h3, h4, a, .js-teaser-heading-link",
    dateSelector: "time, [datetime], .o-date",
    type: "business",
    scraper: "financial-times",
    stealth: true
  }
];

export const CRYPTO_TARGETS = [
  {
    name: "CoinDesk",
    url: "https://www.coindesk.com/",
    titleSelector: "h1, h2, h3, h4, a, [data-testid*='headline'], .heading",
    dateSelector: "time, [datetime], .timestamp",
    type: "crypto",
    scraper: "coindesk"
  },
  {
    name: "CoinTelegraph",
    url: "https://cointelegraph.com/",
    titleSelector: "h1, h2, h3, h4, a, .post__title, .heading",
    dateSelector: "time, [datetime], .post__time",
    type: "crypto",
    scraper: "cointelegraph"
  },
  {
    name: "CryptoSlate",
    url: "https://cryptoslate.com/",
    titleSelector: "h1, h2, h3, h4, a, .article-title, .title",
    dateSelector: "time, [datetime], .date",
    type: "crypto",
    scraper: "cryptoslate"
  }
];
