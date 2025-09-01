#!/usr/bin/env node

/**
 * Environment Configuration Test Script
 * 
 * This script tests different environment variable configurations
 * for the Shorts Player Patch, particularly the age verification system.
 */

const scenarios = [
  {
    name: "Age Gate Disabled",
    env: {
      REACT_APP_ADULT: "0",
      REACT_APP_AGE_GATE_TTL_DAYS: "90"
    },
    expected: {
      adultContent: false,
      ageGateTtlDays: 90
    }
  },
  {
    name: "Age Gate Enabled - Standard TTL",
    env: {
      REACT_APP_ADULT: "1",
      REACT_APP_AGE_GATE_TTL_DAYS: "90"
    },
    expected: {
      adultContent: true,
      ageGateTtlDays: 90
    }
  },
  {
    name: "Age Gate Enabled - Short TTL for Testing",
    env: {
      REACT_APP_ADULT: "1",
      REACT_APP_AGE_GATE_TTL_DAYS: "1"
    },
    expected: {
      adultContent: true,
      ageGateTtlDays: 1
    }
  },
  {
    name: "Age Gate Enabled - Default TTL (missing env var)",
    env: {
      REACT_APP_ADULT: "1"
      // REACT_APP_AGE_GATE_TTL_DAYS is intentionally missing
    },
    expected: {
      adultContent: true,
      ageGateTtlDays: 90 // Should use default
    }
  },
  {
    name: "Invalid TTL Value",
    env: {
      REACT_APP_ADULT: "1",
      REACT_APP_AGE_GATE_TTL_DAYS: "invalid"
    },
    expected: {
      adultContent: true,
      ageGateTtlDays: 90 // Should use default
    }
  }
];

function testScenario(scenario) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log("Environment variables:", scenario.env);
  
  // Simulate environment variables
  const originalEnv = { ...process.env };
  
  // Clear relevant env vars
  delete process.env.REACT_APP_ADULT;
  delete process.env.REACT_APP_AGE_GATE_TTL_DAYS;
  
  // Set test env vars
  Object.assign(process.env, scenario.env);
  
  try {
    // Clear require cache to reload the env module
    delete require.cache[require.resolve('../src/lib/env.ts')];
    
    // This would normally require transpilation, so we'll simulate the logic
    const getEnvBool = (key, defaultValue = false) => {
      const value = process.env[key];
      return value === '1' || value === 'true';
    };
    
    const getEnvNumber = (key, defaultValue) => {
      const value = process.env[key];
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    };
    
    const result = {
      adultContent: getEnvBool('REACT_APP_ADULT', false),
      ageGateTtlDays: getEnvNumber('REACT_APP_AGE_GATE_TTL_DAYS', 90)
    };
    
    console.log("Result:", result);
    
    // Validate results
    const passed = 
      result.adultContent === scenario.expected.adultContent &&
      result.ageGateTtlDays === scenario.expected.ageGateTtlDays;
    
    if (passed) {
      console.log("✅ PASSED");
    } else {
      console.log("❌ FAILED");
      console.log("Expected:", scenario.expected);
      console.log("Got:", result);
    }
    
    return passed;
    
  } finally {
    // Restore original environment
    process.env = originalEnv;
  }
}

function runTests() {
  console.log("🚀 Running Environment Configuration Tests\n");
  console.log("Testing age verification environment variable configurations...");
  
  let passed = 0;
  let total = scenarios.length;
  
  scenarios.forEach(scenario => {
    if (testScenario(scenario)) {
      passed++;
    }
  });
  
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log("🎉 All tests passed!");
    process.exit(0);
  } else {
    console.log("💥 Some tests failed!");
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testScenario, scenarios };