#!/usr/bin/env bun
/**
 * BUNZ Minifier
 * Minifies JavaScript files by removing:
 * - Comments (single-line and multi-line)
 * - Extra whitespace and line breaks
 * - Console.log statements
 * 
 * Usage: bun minify.ts
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join, basename } from 'path';

// Source directories
const CORE_DIR = './src/client/js/core';
const UI_DIR = './src/client/js/ui';
const MODULES_DIR = './src/client/js/modules';
const UTILS_DIR = './src/client/js/utils';
const MAIN_JS = './src/client/main.js';

// Output directories
const OUTPUT_CORE = './src/client/js/min/core';
const OUTPUT_UI = './src/client/js/min/ui';
const OUTPUT_MODULES = './src/client/js/min/modules';
const OUTPUT_UTILS = './src/client/js/min/utils';
const OUTPUT_MAIN = './src/client/js/min';

/**
 * Minify JavaScript code
 * @param {string} code - Source JavaScript code
 * @returns {string} Minified JavaScript code
 */
function minifyJS(code: string): string {
    let minified = code;
    
    // Remove JSDoc comments (/** ... */)
    minified = minified.replace(/\/\*\*[\s\S]*?\*\//g, '');
    
    // Remove multi-line comments (/* ... */)
    minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove single-line comments (// ...)
    minified = minified.replace(/\/\/.*$/gm, '');
    
    // Remove console.log statements (optional - keep for debugging)
    // minified = minified.replace(/console\.(log|info|debug)\([^)]*\);?/g, '');
    
    // Remove empty lines
    minified = minified.replace(/^\s*\n/gm, '');
    
    // Reduce multiple spaces to single space
    minified = minified.replace(/  +/g, ' ');
    
    // Remove spaces around operators (careful with regex)
    minified = minified.replace(/\s*([{}();,:])\s*/g, '$1');
    
    // Remove spaces around = and comparison operators
    minified = minified.replace(/\s*([=<>!+\-*/%&|])\s*/g, '$1');
    
    // Trim each line
    minified = minified.split('\n').map(line => line.trim()).join('\n');
    
    // Remove multiple consecutive newlines
    minified = minified.replace(/\n\n+/g, '\n');
    
    // Final trim
    minified = minified.trim();
    
    return minified;
}

/**
 * Process a single file
 */
async function processFile(sourceDir: string, outputDir: string, filename: string) {
    if (!filename.endsWith('.js')) return;
    
    const sourcePath = join(sourceDir, filename);
    const outputPath = join(outputDir, filename);
    
    console.log(`  Minifying: ${filename}`);
    
    try {
        const code = await readFile(sourcePath, 'utf-8');
        const minified = minifyJS(code);
        await writeFile(outputPath, minified, 'utf-8');
        
        const originalSize = code.length;
        const minifiedSize = minified.length;
        const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1);
        
        console.log(`    ✅ ${originalSize} → ${minifiedSize} bytes (${savings}% reduction)`);
    } catch (error) {
        console.error(`    ❌ Error: ${error}`);
    }
}

/**
 * Process directory
 */
async function processDirectory(sourceDir: string, outputDir: string, name: string) {
    console.log(`\n📦 Minifying ${name} files...`);
    console.log(`   Source: ${sourceDir}`);
    console.log(`   Output: ${outputDir}`);
    
    // Create output directory
    try {
        await mkdir(outputDir, { recursive: true });
    } catch (error) {
        // Directory might already exist
    }
    
    // Read all files
    const files = await readdir(sourceDir);
    const jsFiles = files.filter(f => f.endsWith('.js') && !f.includes('.min.'));
    
    console.log(`   Found ${jsFiles.length} JavaScript files\n`);
    
    // Process each file
    for (const file of jsFiles) {
        await processFile(sourceDir, outputDir, file);
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                                                          ║');
    console.log('║              🗜️  BUNZ JavaScript Minifier  🗜️            ║');
    console.log('║                                                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    
    try {
        // Minify main.js
        console.log('\n📦 Minifying main.js...');
        await processFile('./src/client', OUTPUT_MAIN, 'main.js');
        
        // Minify framework core files
        await processDirectory(CORE_DIR, OUTPUT_CORE, 'Core Framework');
        
        // Minify UI components
        await processDirectory(UI_DIR, OUTPUT_UI, 'UI Components');
        
        // Minify feature modules
        await processDirectory(MODULES_DIR, OUTPUT_MODULES, 'Feature Modules');
        
        // Minify utilities
        await processDirectory(UTILS_DIR, OUTPUT_UTILS, 'Utilities');
        
        // Minify init.js (page scripts now embedded in HTX files)
        console.log('\n📦 Minifying init.js...');
        await processFile('./src/client/js', OUTPUT_MAIN, 'init.js');
        
        console.log('\n╔══════════════════════════════════════════════════════════╗');
        console.log('║                                                          ║');
        console.log('║                 ✅ Minification Complete! ✅             ║');
        console.log('║                                                          ║');
        console.log('╚══════════════════════════════════════════════════════════╝\n');
        
        console.log('📂 Output location:');
        console.log(`   • ./src/client/js/min\n`);
        
        console.log('💡 To use minified files in production:');
        console.log('   Update main.html script tags to use /js/min/ paths\n');
        
    } catch (error) {
        console.error('\n❌ Minification failed:', error);
        process.exit(1);
    }
}

main();

