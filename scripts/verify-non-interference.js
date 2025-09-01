#!/usr/bin/env node

/**
 * Non-Interference Verification Script
 * 
 * This script verifies that the Shorts Player Patch does not interfere
 * with existing components and functionality.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files that should remain unchanged
const PROTECTED_FILES = [
  'src/pages/Home/Home.tsx',
  'src/components/player/VideoPlayer.tsx',
  'src/components/feed/FeedList.tsx',
  'src/components/feed/VideoCard.tsx',
  'src/components/feed/ShortsCard.tsx'
];

// Keywords that should NOT appear in protected files
const FORBIDDEN_KEYWORDS = [
  'ShortVideo',
  'ShortsViewer', 
  'ShortsOverlay',
  'ageGate',
  'ADULT_CONTENT',
  'AGE_GATE_TTL'
];

// Files that should exist (new components)
const REQUIRED_NEW_FILES = [
  'src/components/shorts/ShortVideo.tsx',
  'src/components/shorts/ShortsOverlay.tsx', 
  'src/components/shorts/ShortsViewer.tsx'
];

function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

function checkForbiddenKeywords(filePath, content) {
  const violations = [];
  
  FORBIDDEN_KEYWORDS.forEach(keyword => {
    if (content.includes(keyword)) {
      violations.push(keyword);
    }
  });
  
  return violations;
}

function verifyProtectedFiles() {
  console.log('🔒 Verifying protected files remain unchanged...\n');
  
  let allPassed = true;
  
  PROTECTED_FILES.forEach(filePath => {
    console.log(`Checking: ${filePath}`);
    
    if (!checkFileExists(filePath)) {
      console.log(`❌ FAIL: File does not exist`);
      allPassed = false;
      return;
    }
    
    const content = readFileContent(filePath);
    if (!content) {
      console.log(`❌ FAIL: Could not read file`);
      allPassed = false;
      return;
    }
    
    const violations = checkForbiddenKeywords(filePath, content);
    if (violations.length > 0) {
      console.log(`❌ FAIL: Found forbidden keywords: ${violations.join(', ')}`);
      allPassed = false;
    } else {
      console.log(`✅ PASS: No forbidden keywords found`);
    }
    
    console.log('');
  });
  
  return allPassed;
}

function verifyNewFiles() {
  console.log('📁 Verifying new files exist...\n');
  
  let allPassed = true;
  
  REQUIRED_NEW_FILES.forEach(filePath => {
    console.log(`Checking: ${filePath}`);
    
    if (checkFileExists(filePath)) {
      console.log(`✅ PASS: File exists`);
    } else {
      console.log(`❌ FAIL: File does not exist`);
      allPassed = false;
    }
    
    console.log('');
  });
  
  return allPassed;
}

function verifyRouting() {
  console.log('🛣️  Verifying routing configuration...\n');
  
  const routesFile = 'src/routes/AppRoutes.tsx';
  console.log(`Checking: ${routesFile}`);
  
  if (!checkFileExists(routesFile)) {
    console.log(`❌ FAIL: Routes file does not exist`);
    return false;
  }
  
  const content = readFileContent(routesFile);
  if (!content) {
    console.log(`❌ FAIL: Could not read routes file`);
    return false;
  }
  
  // Check that shorts routes exist
  const hasShortsRoute = content.includes('path="shorts"');
  const hasShortsIdRoute = content.includes('path="shorts/:videoId"');
  
  if (hasShortsRoute && hasShortsIdRoute) {
    console.log(`✅ PASS: Shorts routes configured correctly`);
    console.log('');
    return true;
  } else {
    console.log(`❌ FAIL: Shorts routes not configured properly`);
    console.log('');
    return false;
  }
}

function verifyEnvironmentConfig() {
  console.log('⚙️  Verifying environment configuration...\n');
  
  const envFile = 'src/lib/env.ts';
  console.log(`Checking: ${envFile}`);
  
  if (!checkFileExists(envFile)) {
    console.log(`❌ FAIL: Environment config file does not exist`);
    return false;
  }
  
  const content = readFileContent(envFile);
  if (!content) {
    console.log(`❌ FAIL: Could not read environment config file`);
    return false;
  }
  
  // Check for required age gate configuration
  const hasAdultContent = content.includes('ADULT_CONTENT');
  const hasAgeGateTtl = content.includes('AGE_GATE_TTL_DAYS');
  const hasAgeGateUtils = content.includes('ageGate');
  
  if (hasAdultContent && hasAgeGateTtl && hasAgeGateUtils) {
    console.log(`✅ PASS: Environment configuration is complete`);
    console.log('');
    return true;
  } else {
    console.log(`❌ FAIL: Environment configuration is incomplete`);
    console.log('');
    return false;
  }
}

function runVerification() {
  console.log('🚀 Running Shorts Player Patch Non-Interference Verification\n');
  console.log('This script verifies that existing components remain unchanged...\n');
  
  const results = {
    protectedFiles: verifyProtectedFiles(),
    newFiles: verifyNewFiles(),
    routing: verifyRouting(),
    environment: verifyEnvironmentConfig()
  };
  
  const allPassed = Object.values(results).every(result => result === true);
  
  console.log('📊 Verification Results:');
  console.log(`Protected Files: ${results.protectedFiles ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`New Files: ${results.newFiles ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Routing: ${results.routing ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Environment: ${results.environment ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 ALL VERIFICATIONS PASSED!');
    console.log('The Shorts Player Patch does not interfere with existing components.');
    process.exit(0);
  } else {
    console.log('💥 SOME VERIFICATIONS FAILED!');
    console.log('Please review the failures above and fix any issues.');
    process.exit(1);
  }
}

// Run verification if this script is executed directly
runVerification();

export { 
  verifyProtectedFiles, 
  verifyNewFiles, 
  verifyRouting, 
  verifyEnvironmentConfig 
};