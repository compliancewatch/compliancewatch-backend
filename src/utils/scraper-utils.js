// src/utils/scraper-utils.js - FIX DEDUPLICATION ERROR
export const DeduplicationUtils = {
  normalizeText: (text) => {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  similarity: function(text1, text2) {  // ← Add 'function' keyword to maintain 'this' context
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

  deduplicate: function(items, strategy = "title", threshold = 0.8) {  // ← Add 'function' keyword
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
