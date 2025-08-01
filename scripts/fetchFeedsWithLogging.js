import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Enhanced logging utility
export function setupLogging() {
  const logDir = join(__dirname, '..', 'logs');
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = join(logDir, `feed-fetch-${new Date().toISOString().split('T')[0]}.log`);
  
  const log = (level, message, data = null) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    
    // Log to console
    console.log(`[${timestamp}] [${level}] ${message}`, data || '');
    
    // Log to file
    try {
      appendFileSync(logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  };
  
  return {
    info: (message, data) => log('INFO', message, data),
    error: (message, data) => log('ERROR', message, data),
    warn: (message, data) => log('WARN', message, data),
    debug: (message, data) => log('DEBUG', message, data)
  };
}

// Feed health monitoring
export function createFeedHealthMonitor() {
  const healthFile = join(__dirname, '..', 'logs', 'feed-health.json');
  let healthData = {};
  
  // Load existing health data
  try {
    if (existsSync(healthFile)) {
      healthData = JSON.parse(readFileSync(healthFile, 'utf8'));
    }
  } catch (error) {
    console.error('Failed to load health data:', error);
  }
  
  return {
    recordFetch: (feedName, success, itemCount = 0, error = null) => {
      if (!healthData[feedName]) {
        healthData[feedName] = {
          successCount: 0,
          failureCount: 0,
          lastSuccess: null,
          lastFailure: null,
          averageItemCount: 0,
          totalFetches: 0,
          errors: []
        };
      }
      
      const feed = healthData[feedName];
      feed.totalFetches++;
      
      if (success) {
        feed.successCount++;
        feed.lastSuccess = new Date().toISOString();
        feed.averageItemCount = ((feed.averageItemCount * (feed.successCount - 1)) + itemCount) / feed.successCount;
      } else {
        feed.failureCount++;
        feed.lastFailure = new Date().toISOString();
        if (error) {
          feed.errors.push({
            timestamp: new Date().toISOString(),
            error: error.message || error
          });
          // Keep only last 10 errors
          if (feed.errors.length > 10) {
            feed.errors = feed.errors.slice(-10);
          }
        }
      }
      
      // Save health data
      try {
        writeFileSync(healthFile, JSON.stringify(healthData, null, 2));
      } catch (error) {
        console.error('Failed to save health data:', error);
      }
    },
    
    getHealth: () => healthData,
    
    getUnhealthyFeeds: () => {
      const unhealthy = [];
      for (const [feedName, data] of Object.entries(healthData)) {
        const failureRate = data.failureCount / data.totalFetches;
        if (failureRate > 0.5 || (data.lastFailure && !data.lastSuccess)) {
          unhealthy.push({
            name: feedName,
            failureRate,
            ...data
          });
        }
      }
      return unhealthy;
    }
  };
}