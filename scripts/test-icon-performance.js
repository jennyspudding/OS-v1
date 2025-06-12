#!/usr/bin/env node

/**
 * Category Icon Performance Testing Script
 * Tests loading times before and after optimizations
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TEST_URL = process.env.TEST_URL || 'http://localhost:3000';
const OUTPUT_FILE = path.join(__dirname, '../performance-results.json');

async function testIconPerformance() {
  console.log('🚀 Starting Category Icon Performance Test...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Enable performance monitoring
  await page.setCacheEnabled(false); // Test without cache first
  
  const results = {
    timestamp: new Date().toISOString(),
    url: TEST_URL,
    tests: []
  };

  try {
    // Test 1: Initial page load with category icons
    console.log('📊 Test 1: Initial page load performance...');
    
    const startTime = Date.now();
    await page.goto(TEST_URL, { waitUntil: 'networkidle0' });
    
    // Wait for category icons to load
    await page.waitForSelector('.category-icon-container img', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Count loaded icons
    const iconCount = await page.$$eval('.category-icon-container img', imgs => 
      imgs.filter(img => img.complete && img.naturalHeight !== 0).length
    );
    
    // Get performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const resources = performance.getEntriesByType('resource')
        .filter(resource => resource.name.includes('data:image/') || resource.name.includes('icon'));
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        resourceCount: resources.length,
        totalResourceTime: resources.reduce((sum, r) => sum + r.duration, 0)
      };
    });

    results.tests.push({
      name: 'Initial Load (No Cache)',
      totalTime: loadTime,
      iconsLoaded: iconCount,
      ...performanceMetrics
    });

    console.log(`✅ Initial load: ${loadTime}ms, ${iconCount} icons loaded`);

    // Test 2: Reload with cache
    console.log('📊 Test 2: Reload with cache...');
    
    await page.setCacheEnabled(true);
    const reloadStartTime = Date.now();
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.category-icon-container img', { timeout: 5000 });
    
    const reloadTime = Date.now() - reloadStartTime;
    const cachedIconCount = await page.$$eval('.category-icon-container img', imgs => 
      imgs.filter(img => img.complete && img.naturalHeight !== 0).length
    );

    results.tests.push({
      name: 'Reload (With Cache)',
      totalTime: reloadTime,
      iconsLoaded: cachedIconCount
    });

    console.log(`✅ Cached reload: ${reloadTime}ms, ${cachedIconCount} icons loaded`);

    // Test 3: Individual icon loading times
    console.log('📊 Test 3: Individual icon performance...');
    
    const iconPerformance = await page.evaluate(() => {
      const icons = Array.from(document.querySelectorAll('.category-icon-container img'));
      return icons.map((img, index) => {
        const isBase64 = img.src.startsWith('data:image/');
        const isCompressed = img.dataset.compressed === 'true';
        const isPriority = img.closest('.priority') !== null;
        
        return {
          index,
          isBase64,
          isCompressed,
          isPriority,
          loaded: img.complete && img.naturalHeight !== 0,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          fileSize: isBase64 ? Math.round(img.src.length * 0.75) : null // Approximate base64 size
        };
      });
    });

    results.tests.push({
      name: 'Individual Icon Analysis',
      icons: iconPerformance,
      summary: {
        totalIcons: iconPerformance.length,
        base64Icons: iconPerformance.filter(i => i.isBase64).length,
        compressedIcons: iconPerformance.filter(i => i.isCompressed).length,
        priorityIcons: iconPerformance.filter(i => i.isPriority).length,
        averageFileSize: iconPerformance
          .filter(i => i.fileSize)
          .reduce((sum, i) => sum + i.fileSize, 0) / iconPerformance.filter(i => i.fileSize).length || 0
      }
    });

    // Test 4: Network throttling simulation
    console.log('📊 Test 4: Slow network performance...');
    
    await page.emulateNetworkConditions({
      offline: false,
      downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
      uploadThroughput: 750 * 1024 / 8, // 750 Kbps
      latency: 40 // 40ms
    });

    await page.setCacheEnabled(false);
    const slowStartTime = Date.now();
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.category-icon-container img', { timeout: 15000 });
    
    const slowLoadTime = Date.now() - slowStartTime;
    const slowIconCount = await page.$$eval('.category-icon-container img', imgs => 
      imgs.filter(img => img.complete && img.naturalHeight !== 0).length
    );

    results.tests.push({
      name: 'Slow Network (1.5 Mbps)',
      totalTime: slowLoadTime,
      iconsLoaded: slowIconCount
    });

    console.log(`✅ Slow network: ${slowLoadTime}ms, ${slowIconCount} icons loaded`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    results.error = error.message;
  } finally {
    await browser.close();
  }

  // Save results
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`📄 Results saved to: ${OUTPUT_FILE}`);

  // Print summary
  console.log('\n📈 Performance Summary:');
  results.tests.forEach(test => {
    if (test.totalTime) {
      console.log(`  ${test.name}: ${test.totalTime}ms (${test.iconsLoaded || 0} icons)`);
    }
  });

  // Performance recommendations
  const initialLoad = results.tests.find(t => t.name.includes('Initial Load'));
  const cachedLoad = results.tests.find(t => t.name.includes('Reload'));
  
  if (initialLoad && cachedLoad) {
    const improvement = ((initialLoad.totalTime - cachedLoad.totalTime) / initialLoad.totalTime * 100).toFixed(1);
    console.log(`\n🎯 Cache improvement: ${improvement}% faster on reload`);
  }

  const iconAnalysis = results.tests.find(t => t.name.includes('Individual Icon'));
  if (iconAnalysis) {
    console.log(`\n🖼️  Icon Analysis:`);
    console.log(`  Total icons: ${iconAnalysis.summary.totalIcons}`);
    console.log(`  Base64 icons: ${iconAnalysis.summary.base64Icons}`);
    console.log(`  Compressed icons: ${iconAnalysis.summary.compressedIcons}`);
    console.log(`  Priority icons: ${iconAnalysis.summary.priorityIcons}`);
    console.log(`  Average file size: ${Math.round(iconAnalysis.summary.averageFileSize)} bytes`);
  }

  return results;
}

// Run the test
if (require.main === module) {
  testIconPerformance()
    .then(() => {
      console.log('\n✅ Performance test completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Performance test failed:', error);
      process.exit(1);
    });
}

module.exports = { testIconPerformance }; 