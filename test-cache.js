#!/usr/bin/env node

/**
 * Cache Implementation Test Suite
 * Tests all caching mechanisms in the Zerodha Content Hub
 */

import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:4321';
const ENDPOINTS = [
  '/content.json',
  '/feed.xml',
  '/cache-version.json',
  '/api/content',
  '/sitemap.xml',
  '/robots.txt'
];

class CacheTestSuite {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async testEndpoint(endpoint) {
    this.log(`Testing ${endpoint}...`);
    
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'HEAD'
      });
      
      const headers = Object.fromEntries(response.headers.entries());
      
      const result = {
        endpoint,
        status: response.status,
        headers,
        hasETag: !!headers.etag,
        hasLastModified: !!headers['last-modified'],
        hasCacheControl: !!headers['cache-control'],
        cacheControl: headers['cache-control'],
        etag: headers.etag,
        lastModified: headers['last-modified']
      };
      
      this.results.push(result);
      
      if (response.ok) {
        this.log(`✓ ${endpoint} - Status: ${response.status}`, 'success');
      } else {
        this.log(`✗ ${endpoint} - Status: ${response.status}`, 'error');
      }
      
      return result;
    } catch (error) {
      this.log(`✗ ${endpoint} - Error: ${error.message}`, 'error');
      return { endpoint, error: error.message };
    }
  }

  async testServiceWorker() {
    this.log('Testing Service Worker...');
    
    try {
      const swPath = join(process.cwd(), 'public', 'sw.js');
      if (existsSync(swPath)) {
        const swContent = readFileSync(swPath, 'utf8');
        
        const checks = {
          hasNetworkFirst: swContent.includes('networkFirst'),
          hasCacheFirst: swContent.includes('cacheFirst'),
          hasVersioning: swContent.includes('CACHE_VERSION'),
          hasExpiration: swContent.includes('isCacheExpired'),
          hasCleanup: swContent.includes('cleanOldCaches')
        };
        
        this.log(`Service Worker Analysis:`, 'info');
        Object.entries(checks).forEach(([check, passed]) => {
          this.log(`  ${passed ? '✓' : '✗'} ${check}`, passed ? 'success' : 'error');
        });
        
        return checks;
      } else {
        this.log('Service Worker file not found', 'error');
        return { error: 'File not found' };
      }
    } catch (error) {
      this.log(`Service Worker test failed: ${error.message}`, 'error');
      return { error: error.message };
    }
  }

  async testCacheVersion() {
    this.log('Testing Cache Version System...');
    
    try {
      const versionPath = join(process.cwd(), 'public', 'cache-version.json');
      if (existsSync(versionPath)) {
        const versionData = JSON.parse(readFileSync(versionPath, 'utf8'));
        
        const hasRequiredFields = !!(
          versionData.version &&
          versionData.contentHash &&
          versionData.timestamp
        );
        
        this.log(`Cache Version Data:`, 'info');
        this.log(`  Version: ${versionData.version}`, 'info');
        this.log(`  Content Hash: ${versionData.contentHash}`, 'info');
        this.log(`  Timestamp: ${versionData.timestamp}`, 'info');
        this.log(`  Valid: ${hasRequiredFields ? 'Yes' : 'No'}`, hasRequiredFields ? 'success' : 'error');
        
        return { valid: hasRequiredFields, data: versionData };
      } else {
        this.log('Cache version file not found', 'error');
        return { error: 'File not found' };
      }
    } catch (error) {
      this.log(`Cache version test failed: ${error.message}`, 'error');
      return { error: error.message };
    }
  }

  async testCloudflareHeaders() {
    this.log('Testing Cloudflare Headers Configuration...');
    
    try {
      const headersPath = join(process.cwd(), 'public', '_headers');
      if (existsSync(headersPath)) {
        const headersContent = readFileSync(headersPath, 'utf8');
        
        const checks = {
          hasApiHeaders: headersContent.includes('/api/*'),
          hasContentHeaders: headersContent.includes('/content.json'),
          hasStaticAssetHeaders: headersContent.includes('*.js'),
          hasSecurityHeaders: headersContent.includes('X-Content-Type-Options'),
          hasCSP: headersContent.includes('Content-Security-Policy')
        };
        
        this.log(`Cloudflare Headers Analysis:`, 'info');
        Object.entries(checks).forEach(([check, passed]) => {
          this.log(`  ${passed ? '✓' : '✗'} ${check}`, passed ? 'success' : 'error');
        });
        
        return checks;
      } else {
        this.log('Cloudflare headers file not found', 'error');
        return { error: 'File not found' };
      }
    } catch (error) {
      this.log(`Cloudflare headers test failed: ${error.message}`, 'error');
      return { error: error.message };
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Cache Implementation Test Suite');
    this.log('==========================================');
    
    // Test individual endpoints
    this.log('\n📡 Testing API Endpoints...');
    for (const endpoint of ENDPOINTS) {
      await this.testEndpoint(endpoint);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    }
    
    // Test Service Worker
    this.log('\n🔧 Testing Service Worker...');
    await this.testServiceWorker();
    
    // Test Cache Version System
    this.log('\n🔄 Testing Cache Version System...');
    await this.testCacheVersion();
    
    // Test Cloudflare Headers
    this.log('\n☁️ Testing Cloudflare Configuration...');
    await this.testCloudflareHeaders();
    
    // Generate Summary
    this.generateSummary();
  }

  generateSummary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    this.log('\n📋 TEST SUMMARY');
    this.log('================');
    
    // Endpoint Summary
    const successfulEndpoints = this.results.filter(r => !r.error && r.status === 200).length;
    this.log(`\n🔗 Endpoints: ${successfulEndpoints}/${ENDPOINTS.length} successful`);
    
    this.results.forEach(result => {
      if (result.error) {
        this.log(`  ❌ ${result.endpoint}: ${result.error}`, 'error');
      } else {
        const features = [];
        if (result.hasETag) features.push('ETag');
        if (result.hasLastModified) features.push('Last-Modified');
        if (result.hasCacheControl) features.push('Cache-Control');
        
        this.log(`  ✅ ${result.endpoint}: ${features.join(', ')}`, 'success');
      }
    });
    
    this.log(`\n⏱️ Total test duration: ${duration}s`);
    this.log('\n🎉 Cache implementation verification complete!');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new CacheTestSuite();
  
  // Wait a moment for the dev server to be ready
  setTimeout(() => {
    testSuite.runAllTests().catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
  }, 2000);
}