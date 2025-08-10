import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export function logError(source, error) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${source}: ${error.stack || error.message}\n`;
  
  fs.appendFileSync(
    path.join(logDir, 'scraping-errors.log'),
    logEntry
  );
  
  console.error(`📛 ${source} Error: ${error.message}`);
}