#!/usr/bin/env bun
/**
 * BUNZ Test Runner - "State of the Bunz"
 * Runs all tests: API, E2E, and Lighthouse audits
 * Generates comprehensive HTML report
 */

import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface TestSuite {
  name: string;
  command: string;
  args: string[];
  passed?: boolean;
  duration?: number;
  output?: string;
}

const suites: TestSuite[] = [
  {
    name: 'API Tests',
    command: 'bun',
    args: ['test', 'tests/api']
  },
  {
    name: 'E2E Tests',
    command: 'bunx',
    args: ['playwright', 'test']
  },
  {
    name: 'Lighthouse Audit',
    command: 'bun',
    args: ['run', 'tests/performance/lighthouse.test.ts']
  }
];

async function runSuite(suite: TestSuite): Promise<void> {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🧪 Running: ${suite.name}`);
  console.log('═'.repeat(60));
  
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const proc = spawn(suite.command, suite.args, {
      stdio: 'inherit',
      shell: true
    });
    
    proc.on('close', (code) => {
      suite.duration = Date.now() - startTime;
      suite.passed = code === 0;
      
      if (code === 0) {
        console.log(`\n✅ ${suite.name} PASSED (${suite.duration}ms)`);
        resolve();
      } else {
        console.log(`\n❌ ${suite.name} FAILED (${suite.duration}ms)`);
        resolve(); // Don't reject, we want to run all tests
      }
    });
    
    proc.on('error', (err) => {
      console.error(`❌ Error running ${suite.name}:`, err);
      suite.passed = false;
      resolve();
    });
  });
}

function generateHTMLReport(suites: TestSuite[]): string {
  const allPassed = suites.every(s => s.passed);
  const totalDuration = suites.reduce((sum, s) => sum + (s.duration || 0), 0);
  const timestamp = new Date().toISOString();
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BUNZ Test Report - ${timestamp}</title>
  <style>
    :root {
      --primary: #6366f1;
      --success: #10b981;
      --danger: #ef4444;
      --background: #0f172a;
      --surface: #1e293b;
      --text: #f1f5f9;
      --border: #334155;
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--background);
      color: var(--text);
      padding: 2rem;
      line-height: 1.6;
    }
    
    .container { max-width: 1200px; margin: 0 auto; }
    
    header {
      text-align: center;
      padding: 3rem 0;
      border-bottom: 2px solid var(--border);
      margin-bottom: 2rem;
    }
    
    h1 {
      font-size: 3rem;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, var(--primary), var(--success));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .status {
      font-size: 2rem;
      margin-top: 1rem;
    }
    
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }
    
    .summary-card {
      background: var(--surface);
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid var(--border);
      text-align: center;
    }
    
    .summary-card h3 {
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
      margin-bottom: 0.5rem;
    }
    
    .summary-card .value {
      font-size: 2rem;
      font-weight: 700;
    }
    
    .suite {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    
    .suite-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .suite-name {
      font-size: 1.5rem;
      font-weight: 600;
    }
    
    .badge {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.875rem;
    }
    
    .badge.passed { background: var(--success); color: white; }
    .badge.failed { background: var(--danger); color: white; }
    
    .duration {
      color: #94a3b8;
      font-size: 0.875rem;
    }
    
    footer {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
      text-align: center;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🚀 State of the Bunz</h1>
      <p>Comprehensive Test Report</p>
      <div class="status">
        ${allPassed ? '✅ All Tests Passed' : '❌ Some Tests Failed'}
      </div>
    </header>
    
    <div class="summary">
      <div class="summary-card">
        <h3>Test Suites</h3>
        <div class="value">${suites.length}</div>
      </div>
      <div class="summary-card">
        <h3>Passed</h3>
        <div class="value" style="color: var(--success)">
          ${suites.filter(s => s.passed).length}
        </div>
      </div>
      <div class="summary-card">
        <h3>Failed</h3>
        <div class="value" style="color: var(--danger)">
          ${suites.filter(s => !s.passed).length}
        </div>
      </div>
      <div class="summary-card">
        <h3>Total Time</h3>
        <div class="value">${(totalDuration / 1000).toFixed(1)}s</div>
      </div>
    </div>
    
    <h2 style="margin-bottom: 1.5rem;">Test Suites</h2>
    
    ${suites.map(suite => `
      <div class="suite">
        <div class="suite-header">
          <div class="suite-name">${suite.name}</div>
          <div>
            <span class="badge ${suite.passed ? 'passed' : 'failed'}">
              ${suite.passed ? 'PASSED' : 'FAILED'}
            </span>
          </div>
        </div>
        <div class="duration">
          Duration: ${suite.duration ? `${(suite.duration / 1000).toFixed(2)}s` : 'N/A'}
        </div>
      </div>
    `).join('')}
    
    <footer>
      <p>Generated: ${new Date(timestamp).toLocaleString()}</p>
      <p>BUNZ Framework Test Suite</p>
    </footer>
  </div>
</body>
</html>
  `.trim();
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║            🚀 STATE OF THE BUNZ 🚀                      ║');
  console.log('║        Comprehensive Testing Suite                      ║');
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  const startTime = Date.now();
  
  // Run all test suites
  for (const suite of suites) {
    await runSuite(suite);
  }
  
  const totalDuration = Date.now() - startTime;
  
  // Generate report
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Generating Report...');
  console.log('═'.repeat(60));
  
  const htmlReport = generateHTMLReport(suites);
  
  // Ensure test-results directory exists
  if (!existsSync('test-results')) {
    mkdirSync('test-results', { recursive: true });
  }
  
  // Save HTML report
  const reportPath = join('test-results', 'state-of-the-bunz.html');
  writeFileSync(reportPath, htmlReport);
  
  // Save JSON report
  const jsonReport = {
    timestamp: new Date().toISOString(),
    duration: totalDuration,
    suites: suites.map(s => ({
      name: s.name,
      passed: s.passed,
      duration: s.duration
    })),
    passed: suites.every(s => s.passed)
  };
  
  const jsonPath = join('test-results', 'state-of-the-bunz.json');
  writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
  
  // Summary
  console.log('\n\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                      SUMMARY                             ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  suites.forEach(suite => {
    console.log(`  ${suite.passed ? '✅' : '❌'} ${suite.name}: ${suite.passed ? 'PASSED' : 'FAILED'}`);
  });
  
  console.log(`\n  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`\n  📄 HTML Report: ${reportPath}`);
  console.log(`  📄 JSON Report: ${jsonPath}\n`);
  
  const allPassed = suites.every(s => s.passed);
  if (allPassed) {
    console.log('🎉 All tests PASSED! BUNZ is in great shape! 🚀\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests FAILED. Check the reports for details.\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Test runner error:', err);
  process.exit(1);
});

