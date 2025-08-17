// config/targets.js
module.exports = {
  REGULATORY_TARGETS: [
    // UNITED NATIONS
    {
      name: "UN Security Council",
      url: "https://www.un.org/securitycouncil/content/press-releases",
      titleSelector: ".document-title a",
      dateSelector: ".date",
      dateFormat: "DD MMMM YYYY",
      language: "en",
      scraper: "regulatory/un-security-council"
    },
    {
      name: "UNCTAD",
      url: "https://unctad.org/news",
      titleSelector: ".news-item h3",
      dateSelector: ".news-item time",
      dateFormat: "DD MMMM YYYY",
      language: "en",
      scraper: "regulatory/unctad"
    },

    // UNITED STATES
    {
      name: "SEC (US)",
      url: "https://www.sec.gov/news/pressreleases",
      titleSelector: "div.article-title",
      dateSelector: "div.datetime",
      dateFormat: "MMMM D, YYYY",
      language: "en",
      scraper: "regulatory/sec"
    },

    // EUROPEAN UNION
    {
      name: "EU Commission",
      url: "https://ec.europa.eu/info/law/law-making-process/legal-acts_en",
      titleSelector: ".listing h4",
      dateSelector: ".listing .date",
      dateFormat: "DD MMM YYYY",
      language: "en",
      scraper: "regulatory/eu-commission"
    },

    // UNITED KINGDOM
    {
      name: "FCA (UK)",
      url: "https://www.fca.org.uk/news",
      titleSelector: ".news-item h3",
      dateSelector: ".news-item time",
      dateFormat: "DD/MM/YYYY",
      language: "en",
      scraper: "regulatory/fca-uk"
    },

    // TURKEY
    {
      name: "MASAK (Turkey)",
      url: "https://www.masak.gov.tr/",
      titleSelector: ".duyuru-listesi h3",
      dateSelector: ".duyuru-listesi span",
      dateFormat: "DD.MM.YYYY",
      language: "tr",
      scraper: "regulatory/masak"
    },
    {
      name: "CMB (Turkey)",
      url: "https://www.cmb.gov.tr/",
      titleSelector: ".duyuru-listesi h3",
      dateSelector: ".duyuru-listesi span",
      dateFormat: "DD.MM.YYYY",
      language: "tr",
      scraper: "regulatory/cmb-turkey"
    },

    // ISRAEL
    {
      name: "ISA (Israel)",
      url: "https://www.isa.gov.il/en",
      titleSelector: ".news-item h2",
      dateSelector: ".news-item .date",
      dateFormat: "DD/MM/YYYY",
      language: "en",
      scraper: "regulatory/isa-israel"
    },

    // UAE
    {
      name: "SCA (UAE)",
      url: "https://www.sca.gov.ae/en/media/news.aspx",
      titleSelector: ".news-title a",
      dateSelector: ".news-date",
      dateFormat: "DD/MM/YYYY",
      language: "en",
      scraper: "regulatory/sca-uae"
    },

    // LATAM
    {
      name: "CNBV (Mexico)",
      url: "https://www.gob.mx/cnbv",
      titleSelector: ".article-link",
      dateSelector: ".date",
      dateFormat: "DD/MM/YYYY",
      language: "es",
      scraper: "regulatory/cnbv-mexico"
    },
    {
      name: "CVM (Brazil)",
      url: "https://cvm.gov.br/en/news",
      titleSelector: ".noticia-titulo",
      dateSelector: ".noticia-data",
      dateFormat: "DD/MM/YYYY",
      language: "pt",
      scraper: "regulatory/cvm-brazil"
    },

    // APAC
    {
      name: "MAS (Singapore)",
      url: "https://www.mas.gov.sg/news",
      titleSelector: ".media-card h3",
      dateSelector: ".media-card .date",
      dateFormat: "DD MMM YYYY",
      language: "en",
      scraper: "regulatory/mas-singapore"
    },
    {
      name: "CBRC (China)",
      url: "http://www.cbirc.gov.cn/en/index.html",
      titleSelector: ".news-list li a",
      dateSelector: ".news-list .time",
      dateFormat: "YYYY-MM-DD",
      language: "zh",
      scraper: "regulatory/cbrc-china"
    }
  ],

  BUSINESS_TARGETS: [
    {
      name: "Bloomberg Markets",
      url: "https://www.bloomberg.com/markets",
      titleSelector: "div.story-item h3",
      dateSelector: "div.story-item time",
      dateFormat: "MMMM D, YYYY",
      language: "en",
      scraper: "business/bloomberg"
    },
    {
      name: "Reuters Business",
      url: "https://www.reuters.com/business/",
      titleSelector: "article h3",
      dateSelector: "article time",
      dateFormat: "MMMM D, YYYY",
      language: "en",
      scraper: "business/reuters"
    },
    {
      name: "Financial Times",
      url: "https://www.ft.com/",
      titleSelector: ".js-teaser-heading-link",
      dateSelector: "time",
      dateFormat: "DD MMM YYYY",
      language: "en",
      scraper: "business/financial-times"
    },
    {
      name: "Yahoo Finance",
      url: "https://finance.yahoo.com/news/",
      titleSelector: "h3 a",
      dateSelector: "div time",
      dateFormat: "MMMM D, YYYY",
      language: "en",
      scraper: "business/yahoo-finance"
    }
  ],

  CRYPTO_TARGETS: [
    {
      name: "CoinDesk",
      url: "https://www.coindesk.com/livewire",
      titleSelector: ".livewire-story h5",
      dateSelector: ".livewire-story time",
      dateFormat: "MMMM D, YYYY",
      language: "en",
      scraper: "crypto/coindesk"
    },
    {
      name: "CoinTelegraph",
      url: "https://cointelegraph.com/",
      titleSelector: "article h2",
      dateSelector: "article time",
      dateFormat: "MMMM D, YYYY",
      language: "en",
      scraper: "crypto/cointelegraph"
    },
    {
      name: "CryptoSlate",
      url: "https://cryptoslate.com/news/",
      titleSelector: ".article h3",
      dateSelector: ".article .date",
      dateFormat: "MMMM D, YYYY",
      language: "en",
      scraper: "crypto/cryptoslate"
    },
    {
      name: "The Block",
      url: "https://www.theblock.co/",
      titleSelector: "article h3",
      dateSelector: "article time",
      dateFormat: "MMMM D, YYYY",
      language: "en",
      scraper: "crypto/the-block"
    }
  ]
};