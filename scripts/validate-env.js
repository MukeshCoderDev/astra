#!/usr/bin/env node

/**
 * Environment Configuration Validation Script
 * Validates environment variables and configuration consistency
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Required environment variables
const REQUIRED_VARS = [
  'API_BASE',
  'WS_URL',
  'CDN_BASE',
  'DEFAULT_REGION',
];

// Optional but recommended variables
const RECOMMENDED_VARS = [
  'UPLOAD_TUS_ENDPOINT',
  'IPFS_GATEWAY',
  'FEATURE_FLAGS',
];

// Valid regions (example list)
const VALID_REGIONS = ['US', 'EU', 'APAC', 'CA', 'UK', 'AU', 'JP'];

// Valid feature flags
const VALID_FEATURES = [
  'shorts', 'live', 'watermark', 'kyc', 'geo', 'escrow',
  'analytics', 'notifications', 'chat', 'tips', 'uploads',
  'profiles', 'search', 'comments', 'reports', 'studio', 'wallet'
];

/**
 * Load environment variables from .env files
 */
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key] = valueParts.join('=');
      }
    }
  });
  
  return env;
}

/**
 * Normalize environment variable name
 */
function normalizeVarName(name) {
  return name.replace(/^(VITE_|NEXT_PUBLIC_)/, '');
}

/**
 * Get environment variable value with prefix priority
 */
function getEnvValue(env, varName) {
  const nextPublicKey = `NEXT_PUBLIC_${varName}`;
  const viteKey = `VITE_${varName}`;
  
  return env[nextPublicKey] || env[viteKey] || '';
}

/**
 * Validate environment configuration
 */
function validateEnvironment(env) {
  const errors = [];
  const warnings = [];
  
  // Check required variables
  REQUIRED_VARS.forEach(varName => {
    const value = getEnvValue(env, varName);
    if (!value) {
      errors.push(`Missing required environment variable: ${varName}`);
    } else {
      // Validate URL format for API endpoints
      if (varName.includes('_BASE') || varName.includes('_URL')) {
        try {
          new URL(value);
        } catch (e) {
          errors.push(`Invalid URL format for ${varName}: ${value}`);
        }
      }
    }
  });
  
  // Check recommended variables
  RECOMMENDED_VARS.forEach(varName => {
    const value = getEnvValue(env, varName);
    if (!value) {
      warnings.push(`Missing recommended environment variable: ${varName}`);
    }
  });
  
  // Validate specific configurations
  const region = getEnvValue(env, 'DEFAULT_REGION');
  if (region && !VALID_REGIONS.includes(region)) {
    warnings.push(`Unknown region: ${region}. Valid regions: ${VALID_REGIONS.join(', ')}`);
  }
  
  // Validate feature flags
  const featureFlags = getEnvValue(env, 'FEATURE_FLAGS');
  if (featureFlags) {
    const flags = featureFlags.split(',').map(f => f.trim());
    flags.forEach(flag => {
      if (!VALID_FEATURES.includes(flag)) {
        warnings.push(`Unknown feature flag: ${flag}. Valid flags: ${VALID_FEATURES.join(', ')}`);
      }
    });
  }
  
  // Validate age gate configuration
  const adult = getEnvValue(env, 'ADULT');
  const ageTtl = getEnvValue(env, 'AGE_GATE_TTL_DAYS');
  if (adult === '1') {
    if (!ageTtl) {
      errors.push('AGE_GATE_TTL_DAYS is required when ADULT is enabled');
    } else {
      const ttlDays = parseInt(ageTtl, 10);
      if (isNaN(ttlDays) || ttlDays < 1 || ttlDays > 365) {
        errors.push('AGE_GATE_TTL_DAYS must be between 1 and 365 days');
      }
    }
  }
  
  // Check for consistency between VITE_ and NEXT_PUBLIC_ variables
  const viteVars = Object.keys(env).filter(key => key.startsWith('VITE_'));
  const nextVars = Object.keys(env).filter(key => key.startsWith('NEXT_PUBLIC_'));
  
  viteVars.forEach(viteKey => {
    const baseName = viteKey.replace('VITE_', '');
    const nextKey = `NEXT_PUBLIC_${baseName}`;
    
    if (env[nextKey] && env[viteKey] !== env[nextKey]) {
      warnings.push(`Inconsistent values for ${baseName}: VITE_=${env[viteKey]}, NEXT_PUBLIC_=${env[nextKey]}`);
    }
  });
  
  return { errors, warnings };
}

/**
 * Main validation function
 */
function main() {
  console.log('🔧 Environment Configuration Validation\n');
  
  const envFiles = ['.env.example', '.env.local', '.env'];
  let hasErrors = false;
  
  envFiles.forEach(fileName => {
    const filePath = path.join(process.cwd(), fileName);
    
    if (!fs.existsSync(filePath)) {
      if (fileName === '.env.example') {
        console.log(`❌ Missing ${fileName} file`);
        hasErrors = true;
      } else {
        console.log(`ℹ️  ${fileName} not found (optional)`);
      }
      return;
    }
    
    console.log(`📄 Validating ${fileName}:`);
    
    const env = loadEnvFile(filePath);
    const { errors, warnings } = validateEnvironment(env);
    
    if (errors.length === 0 && warnings.length === 0) {
      console.log('  ✅ Configuration is valid\n');
    } else {
      if (errors.length > 0) {
        console.log('  ❌ Errors:');
        errors.forEach(error => console.log(`    - ${error}`));
        hasErrors = true;
      }
      
      if (warnings.length > 0) {
        console.log('  ⚠️  Warnings:');
        warnings.forEach(warning => console.log(`    - ${warning}`));
      }
      
      console.log('');
    }
  });
  
  // Summary
  if (hasErrors) {
    console.log('❌ Environment validation failed. Please fix the errors above.');
    process.exit(1);
  } else {
    console.log('✅ Environment validation passed!');
    
    // Show current configuration summary
    const localEnv = loadEnvFile('.env.local');
    if (Object.keys(localEnv).length > 0) {
      console.log('\n📋 Current Configuration Summary:');
      console.log(`  API Base: ${getEnvValue(localEnv, 'API_BASE') || 'Not set'}`);
      console.log(`  Default Region: ${getEnvValue(localEnv, 'DEFAULT_REGION') || 'Not set'}`);
      console.log(`  Feature Flags: ${getEnvValue(localEnv, 'FEATURE_FLAGS') || 'None'}`);
      console.log(`  Adult Content: ${getEnvValue(localEnv, 'ADULT') === '1' ? 'Enabled' : 'Disabled'}`);
    }
  }
}

// Run validation
main();

export { validateEnvironment, loadEnvFile, getEnvValue };