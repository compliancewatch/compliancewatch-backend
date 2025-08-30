// scripts/install-chromium.js
import { execSync } from 'child_process';

console.log('🔧 Installing Chromium dependencies for Railway...');

try {
  // Install system dependencies required for Chromium
  execSync('apt-get update && apt-get install -y \\\n' +
    'ca-certificates \\\n' +
    'fonts-liberation \\\n' +
    'libappindicator3-1 \\\n' +
    'libasound2 \\\n' +
    'libatk-bridge2.0-0 \\\n' +
    'libatk1.0-0 \\\n' +
    'libc6 \\\n' +
    'libcairo2 \\\n' +
    'libcups2 \\\n' +
    'libdbus-1-3 \\\n' +
    'libexpat1 \\\n' +
    'libfontconfig1 \\\n' +
    'libgbm1 \\\n' +
    'libgcc1 \\\n' +
    'libglib2.0-0 \\\n' +
    'libgtk-3-0 \\\n' +
    'libnspr4 \\\n' +
    'libnss3 \\\n' +
    'libpango-1.0-0 \\\n' +
    'libpangocairo-1.0-0 \\\n' +
    'libstdc++6 \\\n' +
    'libx11-6 \\\n' +
    'libx11-xcb1 \\\n' +
    'libxcb1 \\\n' +
    'libxcomposite1 \\\n' +
    'libxcursor1 \\\n' +
    'libxdamage1 \\\n' +
    'libxext6 \\\n' +
    'libxfixes3 \\\n' +
    'libxi6 \\\n' +
    'libxrandr2 \\\n' +
    'libxrender1 \\\n' +
    'libxss1 \\\n' +
    'libxtst6 \\\n' +
    'lsb-release \\\n' +
    'wget \\\n' +
    'xdg-utils', 
    { stdio: 'inherit' }
  );
  
  console.log('✅ Chromium dependencies installed successfully');
} catch (error) {
  console.warn('⚠️ Could not install system dependencies, trying fallback approach...');
  console.warn('Puppeteer will use bundled Chromium instead');
}
