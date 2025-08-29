import fs from 'fs';

// Read and log the actual file content
const content = fs.readFileSync('./src/railway-start-new.js', 'utf8');
console.log('FILE CONTENT:');
console.log(content.substring(0, 200)); // First 200 characters
