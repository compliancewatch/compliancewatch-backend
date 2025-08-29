// config/debug-config.js - DEBUG CONFIG FILE
console.log('🔍 Debugging config directory...');
console.log('Current directory:', process.cwd());

import fs from 'fs';
import path from 'path';

try {
  const files = fs.readdirSync('.');
  console.log('📂 Current directory files:', files);
  
  if (fs.existsSync('targets.js')) {
    console.log('✅ targets.js exists in config directory');
    const content = fs.readFileSync('targets.js', 'utf8');
    console.log('📄 targets.js content (first 10 lines):');
    console.log(content.split('\n').slice(0, 10).join('\n'));
  } else {
    console.log('❌ targets.js does not exist in config directory');
  }
  
} catch (error) {
  console.error('❌ Config debug failed:', error.message);
}
