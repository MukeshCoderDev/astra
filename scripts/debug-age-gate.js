#!/usr/bin/env node

/**
 * Age Gate Debug Script
 * 
 * This script helps debug why the age gate is not appearing
 */

import fs from 'fs';

console.log('🔍 Age Gate Debug Helper\n');

// Check if .env.local exists
const envLocalExists = fs.existsSync('.env.local');
console.log(`📁 .env.local exists: ${envLocalExists ? '✅ YES' : '❌ NO'}`);

if (envLocalExists) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const hasAdultVar = envContent.includes('REACT_APP_ADULT=1');
  console.log(`🔞 REACT_APP_ADULT=1 in .env.local: ${hasAdultVar ? '✅ YES' : '❌ NO'}`);
  
  if (!hasAdultVar) {
    console.log('❌ ISSUE FOUND: REACT_APP_ADULT is not set to 1 in .env.local');
  }
} else {
  console.log('❌ ISSUE FOUND: .env.local file does not exist');
}

// Check if .env exists
const envExists = fs.existsSync('.env');
console.log(`📁 .env exists: ${envExists ? '✅ YES' : '❌ NO'}`);

if (envExists) {
  const envContent = fs.readFileSync('.env', 'utf8');
  const hasAdultVar = envContent.includes('REACT_APP_ADULT=1');
  console.log(`🔞 REACT_APP_ADULT=1 in .env: ${hasAdultVar ? '✅ YES' : '❌ NO'}`);
}

console.log('\n🛠️  DEBUGGING STEPS:\n');

console.log('1. 🔄 Restart your development server completely:');
console.log('   - Stop the server (Ctrl+C)');
console.log('   - Run: npm run dev');
console.log('   - Wait for "Local: http://localhost:5173" message\n');

console.log('2. 🧹 Clear browser data:');
console.log('   - Open DevTools (F12)');
console.log('   - Right-click refresh button → "Empty Cache and Hard Reload"');
console.log('   - Or use Incognito/Private mode\n');

console.log('3. 🔍 Check browser console:');
console.log('   - Open DevTools (F12) → Console tab');
console.log('   - Look for any red errors');
console.log('   - Look for environment variable logs\n');

console.log('4. 🧪 Test in browser console:');
console.log('   Run these commands in browser console:');
console.log('   localStorage.clear();');
console.log('   console.log("REACT_APP_ADULT:", process.env.REACT_APP_ADULT);');
console.log('   location.reload();\n');

console.log('5. 🔧 Manual localStorage clear:');
console.log('   - DevTools → Application → Storage → Local Storage');
console.log('   - Delete all entries for your localhost');
console.log('   - Refresh page\n');

console.log('6. 🌐 Try different browser:');
console.log('   - Test in Chrome, Firefox, or Edge');
console.log('   - Use Incognito/Private mode\n');

console.log('💡 If still not working, the issue might be:');
console.log('• Environment variables not loading (restart dev server)');
console.log('• Browser caching (try incognito mode)');
console.log('• Component not mounting (check React DevTools)');
console.log('• CSS z-index issues (check if modal is behind other elements)\n');

console.log('🔍 Quick Test - Add this to your browser console:');
console.log('document.body.innerHTML += `<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:9999;color:white;display:flex;align-items:center;justify-content:center;font-size:24px;">TEST MODAL - Age Gate Should Look Like This</div>`;');

console.log('\n✅ Follow these steps and the age gate should appear!');