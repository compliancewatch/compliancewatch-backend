// src/debug-absolute.js - TEST ABSOLUTE PATHS
console.log('🔍 Testing absolute paths...');

import fs from 'fs';
import path from 'path';

try {
  // Test 1: Check if file exists with absolute path
  const absolutePath = '/app/config/targets.js';
  const exists = fs.existsSync(absolutePath);
  console.log(`📁 Absolute path exists: ${exists} - ${absolutePath}`);
  
  if (exists) {
    const content = fs.readFileSync(absolutePath, 'utf8');
    console.log('📄 Config file content (first 5 lines):');
    console.log(content.split('\n').slice(0, 5).join('\n'));
  }
  
  // Test 2: Check relative path
  const relativePath = '../../config/targets.js';
  const relativeExists = fs.existsSync(path.resolve(relativePath));
  console.log(`📁 Relative path exists: ${relativeExists} - ${relativePath}`);
  
  // Test 3: List app directory
  console.log('📂 App directory contents:');
  const files = fs.readdirSync('/app');
  console.log(files.filter(f => !f.includes('node_modules')));
  
  // Test 4: List config directory
  const configDir = '/app/config';
  if (fs.existsSync(configDir)) {
    console.log('📂 Config directory contents:');
    console.log(fs.readdirSync(configDir));
  } else {
    console.log('❌ Config directory does not exist');
  }
  
} catch (error) {
  console.error('❌ Debug failed:', error.message);
}
