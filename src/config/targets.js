// config/targets.js
export const REGULATORY_TARGETS = [
  {
    name: "UN Security Council",
    url: "https://www.un.org/securitycouncil/content/press-releases",
    titleSelector: ".document-title a",
    dateSelector: ".date",
    scraper: "un-security-council",
    type: "regulatory",
    schedule: "0 */3 * * *" // Every 3 hours
  },
  // ... ALL YOUR REGULATORY TARGETS ...
];

export const BUSINESS_TARGETS = [
  {
    name: "Bloomberg Markets",
    url: "https://www.bloomberg.com/markets",
    titleSelector: "div.story-item h3",
    dateSelector: "div.story-item time",
    scraper: "bloomberg",
    type: "business",
    schedule: "0 */3 * * *" // Every 3 hours
  },
  // ... ALL YOUR BUSINESS TARGETS ...
];

export const CRYPTO_TARGETS = [
  {
    name: "CoinDesk",
    url: "https://www.coindesk.com/livewire",
    titleSelector: ".livewire-story h5",
    dateSelector: ".livewire-story time",
    scraper: "coindesk",
    type: "crypto",
    schedule: "0 */3 * * *" // Every 3 hours
  },
  // ... ALL YOUR CRYPTO TARGETS ...
];

export const ALL_TARGETS = [
  ...REGULATORY_TARGETS,
  ...BUSINESS_TARGETS,
  ...CRYPTO_TARGETS
];
