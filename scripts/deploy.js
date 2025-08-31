#!/usr/bin/env node

/**
 * Deployment script for Web3 Content Platform Frontend
 * Handles building, optimization, and deployment to various targets
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { deployConfig, getConfig, generateEnvFile, validateConfig } = require('../deploy.config.js');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  const border = '='.repeat(message.length + 4);
  log(border, 'cyan');
  log(`  ${message}  `, 'cyan');
  log(border, 'cyan');
}

function logSection(message) {
  log(`\n${colors.bright}${message}${colors.reset}`);
  log('-'.repeat(message.length), 'blue');
}

function runCommand(command, description) {
  try {
    log(`Running: ${command}`, 'blue');
    const output = execSync(command, { 
      stdio: 'inherit',
      encoding: 'utf8',
    });
    log(`✅ ${description} completed`, 'green');
    return { success: true, output };
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

function createEnvFile(environment) {
  const envContent = generateEnvFile(environment);
  const envPath = path.join(process.cwd(), '.env.local');
  
  fs.writeFileSync(envPath, envContent);
  log(`✅ Environment file created: .env.local`, 'green');
}

function validateEnvironment(environment) {
  const validation = validateConfig(environment);
  
  if (!validation.valid) {
    log('❌ Configuration validation failed:', 'red');
    validation.errors.forEach(error => {
      log(`  - ${error}`, 'red');
    });
    process.exit(1);
  }
  
  log('✅ Configuration validation passed', 'green');
}

function buildApplication(environment) {
  logSection('Building Application');
  
  // Create environment file
  createEnvFile(environment);
  
  // Run type checking
  const typeCheck = runCommand('npm run type-check', 'Type checking');
  if (!typeCheck.success) {
    process.exit(1);
  }
  
  // Run linting
  const lint = runCommand('npm run lint', 'Linting');
  if (!lint.success) {
    process.exit(1);
  }
  
  // Run tests
  const test = runCommand('npm run test:run', 'Unit tests');
  if (!test.success) {
    log('⚠️  Tests failed, but continuing with build', 'yellow');
  }
  
  // Build application
  const build = runCommand('npm run build', 'Building application');
  if (!build.success) {
    process.exit(1);
  }
  
  // Analyze bundle
  if (fs.existsSync('dist')) {
    log('📦 Build completed successfully', 'green');
    
    // Get build stats
    const stats = getBuildStats();
    log(`Bundle size: ${(stats.totalSize / 1024).toFixed(2)} KB`, 'blue');
    log(`Files: ${stats.fileCount}`, 'blue');
  }
}

function getBuildStats() {
  const distPath = path.join(process.cwd(), 'dist');
  let totalSize = 0;
  let fileCount = 0;
  
  function getDirectorySize(dirPath) {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
        fileCount++;
      }
    });
  }
  
  if (fs.existsSync(distPath)) {
    getDirectorySize(distPath);
  }
  
  return { totalSize, fileCount };
}

function deployToVercel(environment) {
  logSection('Deploying to Vercel');
  
  const config = getConfig(environment);
  const isProduction = environment === 'production';
  
  let deployCommand = 'npx vercel';
  if (isProduction) {
    deployCommand += ' --prod';
  }
  
  // Set environment variables
  const envVars = [
    `REACT_APP_API_BASE=${config.environment.apiUrl}`,
    `REACT_APP_WS_URL=${config.environment.wsUrl}`,
    `REACT_APP_FEATURE_FLAGS=${config.environment.features}`,
    `REACT_APP_ANALYTICS=${config.environment.analytics}`,
  ];
  
  envVars.forEach(envVar => {
    const [key, value] = envVar.split('=');
    runCommand(`npx vercel env add ${key} ${value} ${isProduction ? 'production' : 'preview'}`, `Setting ${key}`);
  });
  
  // Deploy
  const deploy = runCommand(deployCommand, 'Deploying to Vercel');
  if (!deploy.success) {
    process.exit(1);
  }
}

function deployToNetlify(environment) {
  logSection('Deploying to Netlify');
  
  const config = getConfig(environment);
  const isProduction = environment === 'production';
  
  // Create netlify.toml
  const netlifyConfig = config.targets.netlify;
  const netlifyToml = `
[build]
  command = "${netlifyConfig.build.command}"
  publish = "${netlifyConfig.build.publish}"

[build.environment]
  REACT_APP_API_BASE = "${config.environment.apiUrl}"
  REACT_APP_WS_URL = "${config.environment.wsUrl}"
  REACT_APP_FEATURE_FLAGS = "${config.environment.features}"
  REACT_APP_ANALYTICS = "${config.environment.analytics}"

${netlifyConfig.redirects.map(redirect => 
  `[[redirects]]
  from = "${redirect.from}"
  to = "${redirect.to}"
  status = ${redirect.status}`
).join('\n\n')}

${Object.entries(netlifyConfig.headers[0].values).map(([key, value]) =>
  `[[headers]]
  for = "/*"
    [headers.values]
    ${key} = "${value}"`
).join('\n\n')}
`;
  
  fs.writeFileSync('netlify.toml', netlifyToml);
  log('✅ netlify.toml created', 'green');
  
  // Deploy
  let deployCommand = 'npx netlify deploy --dir=dist';
  if (isProduction) {
    deployCommand += ' --prod';
  }
  
  const deploy = runCommand(deployCommand, 'Deploying to Netlify');
  if (!deploy.success) {
    process.exit(1);
  }
}

function deployToAWS(environment) {
  logSection('Deploying to AWS');
  
  const config = getConfig(environment);
  const awsConfig = config.targets.aws;
  
  // Sync to S3
  const s3Sync = runCommand(
    `aws s3 sync dist/ s3://${awsConfig.s3.bucket} --delete --region ${awsConfig.s3.region}`,
    'Syncing to S3'
  );
  
  if (!s3Sync.success) {
    process.exit(1);
  }
  
  // Invalidate CloudFront if enabled
  if (awsConfig.cloudfront.enabled) {
    // This would require CloudFront distribution ID
    log('⚠️  CloudFront invalidation requires distribution ID', 'yellow');
  }
}

function runE2ETests(environment) {
  logSection('Running E2E Tests');
  
  // Start preview server
  const preview = runCommand('npm run preview &', 'Starting preview server');
  
  // Wait for server to start
  setTimeout(() => {
    const e2e = runCommand('npm run test:e2e', 'Running E2E tests');
    
    // Kill preview server
    runCommand('pkill -f "npm run preview"', 'Stopping preview server');
    
    if (!e2e.success) {
      log('⚠️  E2E tests failed', 'yellow');
    }
  }, 5000);
}

function generateDeploymentReport(environment, target, startTime) {
  const endTime = Date.now();
  const duration = endTime - startTime;
  const config = getConfig(environment);
  const stats = getBuildStats();
  
  const report = `
🚀 Deployment Report
==================

Environment: ${config.environment.name}
Target: ${target}
Duration: ${(duration / 1000).toFixed(2)}s
Bundle Size: ${(stats.totalSize / 1024).toFixed(2)} KB
Files: ${stats.fileCount}
URL: ${config.environment.url}

Feature Flags:
${Object.entries(config.featureFlags)
  .filter(([_, enabled]) => enabled)
  .map(([flag]) => `  ✅ ${flag}`)
  .join('\n')}

${Object.entries(config.featureFlags)
  .filter(([_, enabled]) => !enabled)
  .map(([flag]) => `  ❌ ${flag}`)
  .join('\n')}

Timestamp: ${new Date().toISOString()}
`;
  
  console.log(report);
  
  // Save report to file
  fs.writeFileSync(`deployment-report-${environment}-${Date.now()}.txt`, report);
}

// Main deployment function
async function deploy() {
  const startTime = Date.now();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const environment = args[0] || 'development';
  const target = args[1] || 'vercel';
  const skipTests = args.includes('--skip-tests');
  const skipBuild = args.includes('--skip-build');
  
  logHeader(`Deploying Web3 Content Platform - ${environment.toUpperCase()}`);
  
  // Validate configuration
  validateEnvironment(environment);
  
  // Build application
  if (!skipBuild) {
    buildApplication(environment);
  }
  
  // Run E2E tests (optional)
  if (!skipTests && environment !== 'development') {
    runE2ETests(environment);
  }
  
  // Deploy to target
  switch (target) {
    case 'vercel':
      deployToVercel(environment);
      break;
    case 'netlify':
      deployToNetlify(environment);
      break;
    case 'aws':
      deployToAWS(environment);
      break;
    default:
      log(`❌ Unknown deployment target: ${target}`, 'red');
      process.exit(1);
  }
  
  // Generate deployment report
  generateDeploymentReport(environment, target, startTime);
  
  log('\n🎉 Deployment completed successfully!', 'green');
}

// Handle errors
process.on('uncaughtException', (error) => {
  log(`\n❌ Uncaught exception: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`\n❌ Unhandled rejection: ${reason}`, 'red');
  process.exit(1);
});

// Show usage if no arguments
if (process.argv.length < 3) {
  console.log(`
Usage: node scripts/deploy.js <environment> [target] [options]

Environments:
  development  - Local development
  staging      - Staging environment
  production   - Production environment

Targets:
  vercel       - Deploy to Vercel (default)
  netlify      - Deploy to Netlify
  aws          - Deploy to AWS S3 + CloudFront

Options:
  --skip-tests - Skip E2E tests
  --skip-build - Skip build step

Examples:
  node scripts/deploy.js staging vercel
  node scripts/deploy.js production aws --skip-tests
  node scripts/deploy.js development netlify --skip-build
`);
  process.exit(0);
}

// Run deployment
deploy().catch((error) => {
  log(`\n❌ Deployment failed: ${error.message}`, 'red');
  process.exit(1);
});