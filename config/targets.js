// config/targets.js
export const REGULATORY_TARGETS = [
  {
    name: "FATF High-Risk Countries",
    url: "https://www.fatf-gafi.org/en/high-risk/",
    titleSelector: ".high-risk-list li h4",
    dateSelector: ".update-date",
    scraper: "fatf",
    type: "regulatory"
  }
];

export const BUSINESS_TARGETS = [];
export const CRYPTO_TARGETS = [];
export const ALL_TARGETS = [...REGULATORY_TARGETS];
