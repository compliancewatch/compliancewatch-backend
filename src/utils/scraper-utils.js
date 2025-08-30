// src/utils/scraper-utils.js
export const DateUtils = {
  parseDate: (dateString, timezone = "UTC") => {
    if (!dateString) return new Date().toISOString();
    
    // Already ISO format
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateString)) {
      return dateString;
    }
    
    // Relative dates (e.g., "2 hours ago")
    const relativeMatch = dateString.match(/(\d+)\s+(minute|hour|day|week|month|year)s?\s+ago/i);
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
    
    // Try native parsing
    const parsed = new Date(dateString);
    return isNaN(parsed) ? new Date().toISOString() : parsed.toISOString();
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
    
    // Simple Jaccard similarity
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
      
      if (!seen.has(key)) {
        seen.add(key);
        uniqueItems.push(item);
        continue;
      }
      
      // Check for similar items
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
        continue;
      }
    }
    
    return elements;
  }
};
