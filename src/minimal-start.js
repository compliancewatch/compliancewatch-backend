import fs from 'fs';
import path from 'path';

console.log('🔍 Starting minimal debug test...');

// Check if file exists and read content
try {
  const filePath = './src/railway-start-new.js';
  const exists = fs.existsSync(filePath);
  console.log(`📁 File exists: ${exists}`);
  
  if (exists) {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log('📄 Full file content:');
    console.log('--- START OF FILE ---');
    console.log(content);
    console.log('--- END OF FILE ---');
    
    // Check file size
    const stats = fs.statSync(filePath);
    console.log(`📏 File size: ${stats.size} bytes`);
  }
} catch (error) {
  console.error('❌ File read error:', error.message);
}

// Test config import
console.log('🔍 Testing config import...');
try {
  const { REGULATORY_TARGETS, BUSINESS_TARGETS, CRYPTO_TARGETS } = await import('../../config/targets.js');
  console.log('✅ Config import successful!');
  console.log(`📊 Regulatory targets: ${REGULATORY_TARGETS.length}`);
  console.log(`📊 Business targets: ${BUSINESS_TARGETS.length}`);
  console.log(`📊 Crypto targets: ${CRYPTO_TARGETS.length}`);
} catch (error) {
  console.error('❌ Config import failed:', error.message);
}
