#!/usr/bin/env node

/**
 * Comprehensive test runner script
 * Runs all test suites in the correct order with proper reporting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
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

// Test configuration
const testSuites = [
  {
    name: 'Linting',
    command: 'npm run lint',
    description: 'ESLint code quality checks',
    required: true,
  },
  {
    name: 'Type Checking',
    command: 'npm run type-check',
    description: 'TypeScript type validation',
    required: true,
  },
  {
    name: 'Unit Tests',
    command: 'npm run test:run',
    description: 'Component and hook unit tests',
    required: true,
  },
  {
    name: 'Integration Tests',
    command: 'npm run test:run -- src/test/integration',
    description: 'Cross-component integration tests',
    required: true,
  },
  {
    name: 'Coverage Report',
    command: 'npm run test:coverage',
    description: 'Test coverage analysis',
    required: false,
  },
  {
    name: 'Build Test',
    command: 'npm run build',
    description: 'Production build verification',
    required: true,
  },
  {
    name: 'E2E Tests',
    command: 'npm run test:e2e',
    description: 'End-to-end browser tests',
    required: false,
  },
];

// Utility functions
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
      timeout: 300000, // 5 minutes timeout
    });
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      code: error.status || 1,
    };
  }
}

function generateReport(results) {
  const reportPath = path.join(process.cwd(), 'test-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      skipped: results.filter(r => r.skipped).length,
    },
    results,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\nTest report saved to: ${reportPath}`, 'blue');
  return report;
}

function printSummary(report) {
  logSection('Test Summary');
  
  log(`Total test suites: ${report.summary.total}`);
  log(`Passed: ${report.summary.passed}`, 'green');
  log(`Failed: ${report.summary.failed}`, report.summary.failed > 0 ? 'red' : 'reset');
  log(`Skipped: ${report.summary.skipped}`, 'yellow');
  
  if (report.summary.failed > 0) {
    logSection('Failed Tests');
    report.results
      .filter(r => !r.success && !r.skipped)
      .forEach(result => {
        log(`❌ ${result.name}: ${result.error}`, 'red');
      });
  }
  
  if (report.summary.skipped > 0) {
    logSection('Skipped Tests');
    report.results
      .filter(r => r.skipped)
      .forEach(result => {
        log(`⏭️  ${result.name}: ${result.skipReason}`, 'yellow');
      });
  }
}

// Main execution
async function main() {
  const startTime = Date.now();
  
  logHeader('Web3 Content Platform - Test Suite');
  log('Running comprehensive test suite...\n');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const skipE2E = args.includes('--skip-e2e');
  const skipOptional = args.includes('--required-only');
  const verbose = args.includes('--verbose');
  
  if (skipE2E) {
    log('Skipping E2E tests (--skip-e2e flag)', 'yellow');
  }
  
  if (skipOptional) {
    log('Running required tests only (--required-only flag)', 'yellow');
  }
  
  const results = [];
  
  // Run each test suite
  for (const suite of testSuites) {
    logSection(`${suite.name} - ${suite.description}`);
    
    // Check if we should skip this suite
    if (skipOptional && !suite.required) {
      results.push({
        name: suite.name,
        success: true,
        skipped: true,
        skipReason: 'Optional test skipped',
        duration: 0,
      });
      log(`⏭️  Skipped (optional)`, 'yellow');
      continue;
    }
    
    if (skipE2E && suite.name === 'E2E Tests') {
      results.push({
        name: suite.name,
        success: true,
        skipped: true,
        skipReason: 'E2E tests skipped by flag',
        duration: 0,
      });
      log(`⏭️  Skipped (--skip-e2e)`, 'yellow');
      continue;
    }
    
    // Run the test suite
    const suiteStartTime = Date.now();
    const result = runCommand(suite.command, suite.description);
    const duration = Date.now() - suiteStartTime;
    
    results.push({
      name: suite.name,
      command: suite.command,
      description: suite.description,
      success: result.success,
      error: result.error,
      duration,
      skipped: false,
    });
    
    if (result.success) {
      log(`✅ ${suite.name} completed successfully (${duration}ms)`, 'green');
    } else {
      log(`❌ ${suite.name} failed`, 'red');
      if (verbose && result.error) {
        log(`Error: ${result.error}`, 'red');
      }
      
      // Stop on critical failures
      if (suite.required && suite.name !== 'E2E Tests') {
        log('\n❌ Critical test failed. Stopping execution.', 'red');
        break;
      }
    }
  }
  
  // Generate and display report
  const totalDuration = Date.now() - startTime;
  const report = generateReport(results);
  
  log('\n');
  printSummary(report);
  
  log(`\nTotal execution time: ${totalDuration}ms`, 'blue');
  
  // Exit with appropriate code
  const hasFailures = report.summary.failed > 0;
  if (hasFailures) {
    log('\n❌ Some tests failed. Please review the results above.', 'red');
    process.exit(1);
  } else {
    log('\n✅ All tests passed successfully!', 'green');
    process.exit(0);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`\n❌ Uncaught exception: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`\n❌ Unhandled rejection at: ${promise}, reason: ${reason}`, 'red');
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  log(`\n❌ Test runner failed: ${error.message}`, 'red');
  process.exit(1);
});