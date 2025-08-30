// config/targets.js - COMPLETE WITH WORKING SELECTORS
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
    url: "https://www.un.org/securitycouncil/content/press-releases",
    titleSelector: "h2, h3, h4, a, .title, .headline",
    dateSelector: "time, .date, [datetime]",
    type: "regulatory",
    scraper: "un-security-council",
    waitForSelector: "body",
    priority: 1
  },
  {
    name: "SEC Filings",
    url: "https://www.sec.gov/news/pressreleases",
    titleSelector: ".article-title, h3, h4, a, .title",
    dateSelector: "time, .date, [datetime]",
    type: "regulatory",
    scraper: "sec",
    waitForSelector: "body",
    priority: 1
  },
  {
    name: "EU Commission",
    url: "https://ec.europa.eu/commission/presscorner/home/en",
    titleSelector: ".ecl-list-item__title, h3, h4, a, .title",
    dateSelector: ".ecl-date-block, time, [datetime]",
    type: "regulatory",
    scraper: "eu-commission",
    waitForSelector: "body"
  },
  {
    name: "FATF",
    url: "https://www.fatf-gafi.org/en/high-risk/",
    titleSelector: ".high-risk-list li, .list-item, li",
    dateSelector: ".date, time, [datetime]",
    type: "regulatory",
    scraper: "fatf",
    waitForSelector: "body"
  },
  {
    name: "FCA UK",
    url: "https://www.fca.org.uk/news",
    titleSelector: ".news-list__title, h3, h4, a, .title",
    dateSelector: "time, .date, [datetime]",
    type: "regulatory",
    scraper: "fca-uk",
    waitForSelector: "body"
  },
  {
    name: "CBRC China",
    url: "https://www.cbirc.gov.cn/cn/view/pages/ItemList.html?itemPId=923&itemId=925&itemUrl=ItemListRightList.html&itemName=%E6%96%B0%E9%97%BB",
    titleSelector: ".list-li, li, a, .title",
    dateSelector: ".date, time, [datetime]",
    type: "regulatory",
    scraper: "cbrc-china",
    waitForSelector: "body",
    stealth: true
  },
  {
    name: "CMB Turkey",
    url: "https://www.cmb.gov.tr/",
    titleSelector: ".duyuru-listesi, .announcement, li, a",
    dateSelector: ".date, time, [datetime]",
    type: "regulatory",
    scraper: "cmb-turkey",
    waitForSelector: "body",
    stealth: true
  },
  {
    name: "CNBV Mexico",
    url: "https://www.gob.mx/cnbv/prensa",
    titleSelector: ".article-title, h3, h4, a",
    dateSelector: ".date, time, [datetime]",
    type: "regulatory",
    scraper: "cnbv-mexico",
    waitForSelector: "body"
  },
  {
    name: "CVM Brazil",
    url: "https://www.gov.br/cvm/pt-br/assuntos/noticias",
    titleSelector: ".tileContent, h3, h4, a",
    dateSelector: ".date, time, [datetime]",
    type: "regulatory",
    scraper: "cvm-brazil",
    waitForSelector: "body"
  },
  {
    name: "ISA Israel",
    url: "https://www.isa.gov.il/Pages/default.aspx",
    titleSelector: ".news-title, h3, h4, a",
    dateSelector: ".date, time, [datetime]",
    type: "regulatory",
    scraper: "isa-israel",
    waitForSelector: "body",
    stealth: true
  },
  {
    name: "MAS Singapore",
    url: "https://www.mas.gov.sg/news",
    titleSelector: ".media-releases-list .title, h3, h4, a",
    dateSelector: ".date, time, [datetime]",
    type: "regulatory",
    scraper: "mas-singapore",
    waitForSelector: "body"
  },
  {
    name: "SCA UAE",
    url: "https://www.sca.gov.ae/en/news.aspx",
    titleSelector: ".news-title, h3, h4, a",
    dateSelector: ".date, time, [datetime]",
    type: "regulatory",
    scraper: "sca-uae",
    waitForSelector: "body"
  },
  {
    name: "MASAK Turkey",
    url: "https://www.hmb.gov.tr/",
    titleSelector: ".duyuru-list, .announcement, li, a",
    dateSelector: ".date, time, [datetime]",
    type: "regulatory",
    scraper: "masak",
    waitForSelector: "body",
    stealth: true
  },
  {
    name: "UNCTAD",
    url: "https://unctad.org/news",
    titleSelector: ".news-title, h3, h4, a",
    dateSelector: ".date, time, [datetime]",
    type: "regulatory",
    scraper: "unctad",
    waitForSelector: "body"
  }
];

export const BUSINESS_TARGETS = [
  {
    name: "Bloomberg Markets",
    url: "https://www.bloomberg.com/markets",
    titleSelector: "[data-component*='headline'], .headline, h2, h3, a",
    dateSelector: "time, [datetime], .timestamp",
    type: "business",
    scraper: "bloomberg",
    stealth: true,
    waitTimeout: 15000,
    waitForSelector: "body"
  },
  {
    name: "Reuters Business",
    url: "https://www.reuters.com/business/",
    titleSelector: "[data-testid*='Heading'], [data-testid*='headline'], h2, h3, a",
    dateSelector: "time, [datetime], .date",
    type: "business",
    scraper: "reuters",
    waitForSelector: "body"
  },
  {
    name: "Financial Times",
    url: "https://www.ft.com/",
    titleSelector: "[data-trackable*='heading'], .js-teaser-heading-link, h2, h3, a",
    dateSelector: "time, [datetime], .o-date",
    type: "business",
    scraper: "financial-times",
    stealth: true,
    waitForSelector: "body"
  },
  {
    name: "Yahoo Finance",
    url: "https://finance.yahoo.com/news/",
    titleSelector: "[data-test-locator*='headline'], h3, h4, a",
    dateSelector: "time, [datetime], .date",
    type: "business",
    scraper: "yahoo-finance",
    waitForSelector: "body"
  }
];

export const CRYPTO_TARGETS = [
  {
    name: "CoinDesk",
    url: "https://www.coindesk.com/",
    titleSelector: "[data-testid*='headline'], [data-testid*='title'], h2, h3, a",
    dateSelector: "time, [datetime], .timestamp",
    type: "crypto",
    scraper: "coindesk",
    waitForSelector: "body"
  },
  {
    name: "CoinTelegraph",
    url: "https://cointelegraph.com/",
    titleSelector: ".post__title, .headline, h2, h3, a",
    dateSelector: "time, [datetime], .post__time",
    type: "crypto",
    scraper: "cointelegraph",
    waitForSelector: "body"
  },
  {
    name: "CryptoSlate",
    url: "https://cryptoslate.com/",
    titleSelector: ".article__title, .title, h2, h3, a",
    dateSelector: "time, [datetime], .date",
    type: "crypto",
    scraper: "cryptoslate",
    waitForSelector: "body"
  },
  {
    name: "The Block",
    url: "https://www.theblock.co/",
    titleSelector: ".article__title, .headline, h2, h3, a",
    dateSelector: "time, [datetime], .date",
    type: "crypto",
    scraper: "the-block",
    waitForSelector: "body"
  }
];
