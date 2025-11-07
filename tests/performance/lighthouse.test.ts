/**
 * Lighthouse Performance Tests
 * Audits performance, accessibility, SEO, and best practices
 */

import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { writeFileSync } from 'fs';

interface LighthouseScore {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

interface TestResult {
  url: string;
  scores: LighthouseScore;
  metrics: {
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    tbt: number; // Total Blocking Time
    cls: number; // Cumulative Layout Shift
    si: number;  // Speed Index
  };
  passed: boolean;
  timestamp: string;
}

const BASE_URL = 'http://localhost:3000';

// Minimum passing scores
const THRESHOLDS = {
  performance: 85,
  accessibility: 90,
  bestPractices: 85,
  seo: 85
};

async function runLighthouse(url: string): Promise<any> {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info' as const,
    output: 'json' as const,
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
  };

  const runnerResult = await lighthouse(url, options);
  await chrome.kill();
  
  return runnerResult;
}

function extractScores(lhr: any): LighthouseScore {
  return {
    performance: Math.round(lhr.categories.performance.score * 100),
    accessibility: Math.round(lhr.categories.accessibility.score * 100),
    bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
    seo: Math.round(lhr.categories.seo.score * 100),
  };
}

function extractMetrics(lhr: any) {
  return {
    fcp: lhr.audits['first-contentful-paint'].numericValue,
    lcp: lhr.audits['largest-contentful-paint'].numericValue,
    tbt: lhr.audits['total-blocking-time'].numericValue,
    cls: lhr.audits['cumulative-layout-shift'].numericValue,
    si: lhr.audits['speed-index'].numericValue,
  };
}

function checkThresholds(scores: LighthouseScore): boolean {
  return (
    scores.performance >= THRESHOLDS.performance &&
    scores.accessibility >= THRESHOLDS.accessibility &&
    scores.bestPractices >= THRESHOLDS.bestPractices &&
    scores.seo >= THRESHOLDS.seo
  );
}

function formatScore(score: number, threshold: number): string {
  const emoji = score >= threshold ? '✅' : '❌';
  return `${emoji} ${score}/100`;
}

function formatMetric(value: number, unit: string = 'ms'): string {
  if (unit === 'ms') {
    return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(2)}s`;
  }
  return `${value.toFixed(3)}`;
}

async function auditPage(url: string): Promise<TestResult> {
  console.log(`\n🔍 Auditing: ${url}`);
  
  const runnerResult = await runLighthouse(url);
  const lhr = runnerResult.lhr;
  
  const scores = extractScores(lhr);
  const metrics = extractMetrics(lhr);
  const passed = checkThresholds(scores);
  
  return {
    url,
    scores,
    metrics,
    passed,
    timestamp: new Date().toISOString()
  };
}

async function runAllAudits() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║          BUNZ LIGHTHOUSE PERFORMANCE AUDIT               ║');
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  const pagesToTest = [
    '/',
    '/dashboard',
    '/room/lobby',
  ];
  
  const results: TestResult[] = [];
  
  for (const path of pagesToTest) {
    const url = `${BASE_URL}${path}`;
    const result = await auditPage(url);
    results.push(result);
    
    // Print results
    console.log(`\n📊 Results for ${path}:`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Performance:    ${formatScore(result.scores.performance, THRESHOLDS.performance)}`);
    console.log(`  Accessibility:  ${formatScore(result.scores.accessibility, THRESHOLDS.accessibility)}`);
    console.log(`  Best Practices: ${formatScore(result.scores.bestPractices, THRESHOLDS.bestPractices)}`);
    console.log(`  SEO:            ${formatScore(result.scores.seo, THRESHOLDS.seo)}`);
    console.log('\n  Core Web Vitals:');
    console.log(`  FCP (First Contentful Paint):   ${formatMetric(result.metrics.fcp)}`);
    console.log(`  LCP (Largest Contentful Paint): ${formatMetric(result.metrics.lcp)}`);
    console.log(`  TBT (Total Blocking Time):      ${formatMetric(result.metrics.tbt)}`);
    console.log(`  CLS (Cumulative Layout Shift):  ${formatMetric(result.metrics.cls, '')}`);
    console.log(`  SI (Speed Index):               ${formatMetric(result.metrics.si)}`);
  }
  
  // Summary
  console.log('\n\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                      SUMMARY                             ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  const allPassed = results.every(r => r.passed);
  const avgScores = {
    performance: Math.round(results.reduce((sum, r) => sum + r.scores.performance, 0) / results.length),
    accessibility: Math.round(results.reduce((sum, r) => sum + r.scores.accessibility, 0) / results.length),
    bestPractices: Math.round(results.reduce((sum, r) => sum + r.scores.bestPractices, 0) / results.length),
    seo: Math.round(results.reduce((sum, r) => sum + r.scores.seo, 0) / results.length),
  };
  
  console.log('Average Scores:');
  console.log(`  Performance:    ${avgScores.performance}/100`);
  console.log(`  Accessibility:  ${avgScores.accessibility}/100`);
  console.log(`  Best Practices: ${avgScores.bestPractices}/100`);
  console.log(`  SEO:            ${avgScores.seo}/100`);
  console.log(`\n${allPassed ? '✅ All tests PASSED!' : '❌ Some tests FAILED'}\n`);
  
  // Save detailed results
  const report = {
    timestamp: new Date().toISOString(),
    passed: allPassed,
    averageScores: avgScores,
    results
  };
  
  writeFileSync('lighthouse-report.json', JSON.stringify(report, null, 2));
  console.log('📄 Detailed report saved to: lighthouse-report.json\n');
  
  return allPassed ? 0 : 1;
}

// Run if called directly
if (import.meta.main) {
  runAllAudits()
    .then(exitCode => process.exit(exitCode))
    .catch(err => {
      console.error('❌ Lighthouse audit failed:', err);
      process.exit(1);
    });
}

export { runAllAudits, auditPage };

