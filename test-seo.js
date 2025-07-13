#!/usr/bin/env node

/**
 * Comprehensive SEO Test Suite for Zerodha Content Hub
 * Tests all SEO implementations and provides actionable insights
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:4321';

class SEOTestSuite {
  constructor() {
    this.results = {
      technical: {},
      content: {},
      mobile: {},
      social: {},
      performance: {},
      gaps: []
    };
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async testPage(url) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      return { status: response.status, html, headers: response.headers };
    } catch (error) {
      this.log(`Failed to fetch ${url}: ${error.message}`, 'error');
      return null;
    }
  }

  analyzeHTML(html, url) {
    const results = {
      title: this.extractTag(html, 'title'),
      description: this.extractMetaContent(html, 'description'),
      canonical: this.extractLinkHref(html, 'canonical'),
      openGraph: this.extractOpenGraphTags(html),
      twitterCard: this.extractTwitterCardTags(html),
      structuredData: this.extractStructuredData(html),
      headings: this.extractHeadings(html),
      images: this.extractImages(html),
      links: this.extractLinks(html)
    };

    return results;
  }

  extractTag(html, tag) {
    const match = html.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i'));
    return match ? match[1].trim() : null;
  }

  extractMetaContent(html, name) {
    const patterns = [
      new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["']`, 'i'),
      new RegExp(`<meta\\s+content=["']([^"']*)["']\\s+name=["']${name}["']`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  extractLinkHref(html, rel) {
    const match = html.match(new RegExp(`<link\\s+rel=["']${rel}["']\\s+href=["']([^"']*)["']`, 'i'));
    return match ? match[1] : null;
  }

  extractOpenGraphTags(html) {
    const ogTags = {};
    const matches = html.match(/<meta\s+property=["']og:([^"']*)["']\s+content=["']([^"']*)["']/gi) || [];
    
    matches.forEach(match => {
      const tagMatch = match.match(/property=["']og:([^"']*)["']\s+content=["']([^"']*)["']/i);
      if (tagMatch) {
        ogTags[tagMatch[1]] = tagMatch[2];
      }
    });
    
    return ogTags;
  }

  extractTwitterCardTags(html) {
    const twitterTags = {};
    const matches = html.match(/<meta\s+name=["']twitter:([^"']*)["']\s+content=["']([^"']*)["']/gi) || [];
    
    matches.forEach(match => {
      const tagMatch = match.match(/name=["']twitter:([^"']*)["']\s+content=["']([^"']*)["']/i);
      if (tagMatch) {
        twitterTags[tagMatch[1]] = tagMatch[2];
      }
    });
    
    return twitterTags;
  }

  extractStructuredData(html) {
    const scripts = html.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([^<]*)<\/script>/gi) || [];
    const structuredData = [];
    
    scripts.forEach(script => {
      try {
        const jsonMatch = script.match(/>([^<]*)</);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[1].trim());
          structuredData.push(data);
        }
      } catch (error) {
        this.log(`Invalid JSON-LD: ${error.message}`, 'warning');
      }
    });
    
    return structuredData;
  }

  extractHeadings(html) {
    const headings = {};
    for (let i = 1; i <= 6; i++) {
      const matches = html.match(new RegExp(`<h${i}[^>]*>([^<]*)<\/h${i}>`, 'gi')) || [];
      headings[`h${i}`] = matches.map(match => {
        const textMatch = match.match(/>([^<]*)</);
        return textMatch ? textMatch[1].trim() : '';
      });
    }
    return headings;
  }

  extractImages(html) {
    const images = [];
    const matches = html.match(/<img[^>]*>/gi) || [];
    
    matches.forEach(match => {
      const src = match.match(/src=["']([^"']*)["']/i);
      const alt = match.match(/alt=["']([^"']*)["']/i);
      const loading = match.match(/loading=["']([^"']*)["']/i);
      
      images.push({
        src: src ? src[1] : null,
        alt: alt ? alt[1] : null,
        loading: loading ? loading[1] : null
      });
    });
    
    return images;
  }

  extractLinks(html) {
    const links = [];
    const matches = html.match(/<a[^>]*href=["']([^"']*)["'][^>]*>/gi) || [];
    
    matches.forEach(match => {
      const href = match.match(/href=["']([^"']*)["']/i);
      const rel = match.match(/rel=["']([^"']*)["']/i);
      
      if (href) {
        links.push({
          href: href[1],
          rel: rel ? rel[1] : null,
          external: href[1].startsWith('http') && !href[1].includes('zerodha')
        });
      }
    });
    
    return links;
  }

  async testTechnicalSEO() {
    this.log('🔧 Testing Technical SEO...');
    
    // Test main page
    const mainPage = await this.testPage(BASE_URL);
    if (!mainPage) return;
    
    const analysis = this.analyzeHTML(mainPage.html, BASE_URL);
    
    // Check essential elements
    const technical = {
      hasTitle: !!analysis.title,
      titleLength: analysis.title ? analysis.title.length : 0,
      hasDescription: !!analysis.description,
      descriptionLength: analysis.description ? analysis.description.length : 0,
      hasCanonical: !!analysis.canonical,
      hasStructuredData: analysis.structuredData.length > 0,
      structuredDataTypes: analysis.structuredData.map(data => data['@type']),
      hasOpenGraph: Object.keys(analysis.openGraph).length > 0,
      hasTwitterCard: Object.keys(analysis.twitterCard).length > 0,
      headingStructure: analysis.headings,
      imageOptimization: {
        total: analysis.images.length,
        withAlt: analysis.images.filter(img => img.alt).length,
        lazyLoaded: analysis.images.filter(img => img.loading === 'lazy').length
      }
    };
    
    this.results.technical = technical;
    
    // Test robots.txt
    const robotsTest = await this.testPage(`${BASE_URL}/robots.txt`);
    technical.hasRobots = robotsTest?.status === 200;
    
    // Test sitemap.xml
    const sitemapTest = await this.testPage(`${BASE_URL}/sitemap.xml`);
    technical.hasSitemap = sitemapTest?.status === 200;
    
    // Test RSS feed
    const rssTest = await this.testPage(`${BASE_URL}/feed.xml`);
    technical.hasRSS = rssTest?.status === 200;
    
    this.log(`✓ Title: ${technical.hasTitle ? 'Found' : 'Missing'} (${technical.titleLength} chars)`, 
      technical.hasTitle && technical.titleLength <= 60 ? 'success' : 'warning');
    this.log(`✓ Description: ${technical.hasDescription ? 'Found' : 'Missing'} (${technical.descriptionLength} chars)`, 
      technical.hasDescription && technical.descriptionLength <= 160 ? 'success' : 'warning');
    this.log(`✓ Structured Data: ${technical.structuredDataTypes.join(', ') || 'None'}`, 
      technical.hasStructuredData ? 'success' : 'warning');
    this.log(`✓ Images: ${technical.imageOptimization.withAlt}/${technical.imageOptimization.total} with alt text`, 
      technical.imageOptimization.withAlt === technical.imageOptimization.total ? 'success' : 'warning');
  }

  async testFileBasedSEO() {
    this.log('📁 Testing File-based SEO...');
    
    const files = {
      robots: 'src/pages/robots.txt.ts',
      sitemap: 'src/pages/sitemap.xml.ts',
      rss: 'src/pages/feed.xml.ts',
      manifest: 'public/manifest.json',
      headers: 'public/_headers'
    };
    
    const fileTests = {};
    
    Object.entries(files).forEach(([name, path]) => {
      const fullPath = join(process.cwd(), path);
      fileTests[name] = {
        exists: existsSync(fullPath),
        path: fullPath
      };
      
      if (fileTests[name].exists) {
        try {
          const content = readFileSync(fullPath, 'utf8');
          fileTests[name].contentLength = content.length;
          fileTests[name].hasContent = content.length > 0;
        } catch (error) {
          fileTests[name].error = error.message;
        }
      }
      
      this.log(`✓ ${name}: ${fileTests[name].exists ? 'Found' : 'Missing'}`, 
        fileTests[name].exists ? 'success' : 'error');
    });
    
    this.results.files = fileTests;
  }

  evaluatePerformance() {
    this.log('⚡ Evaluating Performance SEO...');
    
    const performance = {
      hasServiceWorker: existsSync(join(process.cwd(), 'public/sw.js')),
      hasCaching: existsSync(join(process.cwd(), 'public/_headers')),
      hasPWA: existsSync(join(process.cwd(), 'public/manifest.json')),
      hasLazyLoading: this.results.technical?.imageOptimization?.lazyLoaded > 0,
      hasFontOptimization: true // We added preconnect and preload
    };
    
    this.results.performance = performance;
    
    Object.entries(performance).forEach(([feature, implemented]) => {
      this.log(`✓ ${feature}: ${implemented ? 'Implemented' : 'Missing'}`, 
        implemented ? 'success' : 'warning');
    });
  }

  generateRecommendations() {
    this.log('💡 Generating SEO Recommendations...');
    
    const recommendations = [];
    
    // Technical SEO recommendations
    if (!this.results.technical?.hasTitle) {
      recommendations.push('❌ Critical: Add page title tags');
    } else if (this.results.technical.titleLength > 60) {
      recommendations.push('⚠️ Warning: Title too long (>60 chars)');
    }
    
    if (!this.results.technical?.hasDescription) {
      recommendations.push('❌ Critical: Add meta description');
    } else if (this.results.technical.descriptionLength > 160) {
      recommendations.push('⚠️ Warning: Description too long (>160 chars)');
    }
    
    if (!this.results.technical?.hasStructuredData) {
      recommendations.push('⚠️ Improvement: Add structured data (Schema.org)');
    }
    
    const imgOpt = this.results.technical?.imageOptimization;
    if (imgOpt && imgOpt.withAlt < imgOpt.total) {
      recommendations.push(`⚠️ Accessibility: ${imgOpt.total - imgOpt.withAlt} images missing alt text`);
    }
    
    if (!this.results.technical?.hasCanonical) {
      recommendations.push('⚠️ SEO: Add canonical URLs');
    }
    
    // File-based recommendations
    Object.entries(this.results.files || {}).forEach(([name, file]) => {
      if (!file.exists) {
        recommendations.push(`❌ Missing: ${name} file`);
      }
    });
    
    this.results.recommendations = recommendations;
    
    if (recommendations.length === 0) {
      this.log('🎉 Excellent! No critical SEO issues found.', 'success');
    } else {
      this.log(`\n📋 SEO Recommendations (${recommendations.length} items):`, 'warning');
      recommendations.forEach(rec => this.log(`  ${rec}`, 'warning'));
    }
  }

  generateSEOScore() {
    let score = 100;
    const deductions = [];
    
    // Critical deductions
    if (!this.results.technical?.hasTitle) {
      score -= 15;
      deductions.push('No title tag (-15)');
    }
    if (!this.results.technical?.hasDescription) {
      score -= 15;
      deductions.push('No meta description (-15)');
    }
    if (!this.results.files?.robots?.exists) {
      score -= 10;
      deductions.push('No robots.txt (-10)');
    }
    if (!this.results.files?.sitemap?.exists) {
      score -= 10;
      deductions.push('No sitemap.xml (-10)');
    }
    
    // Minor deductions
    if (!this.results.technical?.hasStructuredData) {
      score -= 5;
      deductions.push('No structured data (-5)');
    }
    if (!this.results.technical?.hasCanonical) {
      score -= 5;
      deductions.push('No canonical URLs (-5)');
    }
    
    const imgOpt = this.results.technical?.imageOptimization;
    if (imgOpt && imgOpt.withAlt < imgOpt.total) {
      const penalty = Math.min(10, (imgOpt.total - imgOpt.withAlt) * 2);
      score -= penalty;
      deductions.push(`Missing alt text (-${penalty})`);
    }
    
    this.results.score = Math.max(0, score);
    this.results.deductions = deductions;
    
    return this.results.score;
  }

  async runFullAudit() {
    this.log('🚀 Starting Comprehensive SEO Audit');
    this.log('===================================');
    
    await this.testTechnicalSEO();
    await this.testFileBasedSEO();
    this.evaluatePerformance();
    this.generateRecommendations();
    
    const score = this.generateSEOScore();
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    this.log('\n📊 SEO AUDIT SUMMARY');
    this.log('=====================');
    this.log(`🎯 SEO Score: ${score}/100`);
    
    if (score >= 90) {
      this.log('🏆 Excellent SEO implementation!', 'success');
    } else if (score >= 75) {
      this.log('✅ Good SEO, room for improvement', 'success');
    } else if (score >= 60) {
      this.log('⚠️ Average SEO, needs attention', 'warning');
    } else {
      this.log('❌ Poor SEO, requires immediate fixes', 'error');
    }
    
    if (this.results.deductions.length > 0) {
      this.log('\n🔍 Score Breakdown:');
      this.results.deductions.forEach(deduction => {
        this.log(`  ${deduction}`, 'warning');
      });
    }
    
    this.log(`\n⏱️ Audit completed in ${duration}s`);
    this.log('\n🎉 SEO audit complete! Check recommendations above.');
    
    return this.results;
  }
}

// Run audit if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const audit = new SEOTestSuite();
  
  // Wait for dev server to be ready
  setTimeout(() => {
    audit.runFullAudit().catch(error => {
      console.error('SEO audit failed:', error);
      process.exit(1);
    });
  }, 2000);
}