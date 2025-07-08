# CVKonnekt Ethical Web Crawler - Compliance Documentation

## Overview

The CVKonnekt Ethical Web Crawler is designed to comply with South African legal requirements and international best practices for web scraping and data collection.

## Legal Compliance

### South African Legal Framework

1. **Protection of Personal Information Act (POPIA)**
   - Only public job listings are collected
   - No personal information is stored beyond what's publicly available
   - Data retention policies are enforced (30 days default)
   - Users can request data deletion

2. **Electronic Communications and Transactions Act (ECTA)**
   - Proper identification in User-Agent strings
   - Contact information provided for site owners
   - Respect for website terms of service

3. **Copyright Act**
   - Only factual job information is extracted
   - No copyrighted content is reproduced
   - Attribution to original sources maintained

## Technical Compliance Features

### 1. Robots.txt Compliance
- **Automatic robots.txt fetching and parsing**
- **Respect for crawl delays and disallow directives**
- **User-agent specific rule handling**
- **Graceful fallback when robots.txt is unavailable**

```typescript
// Example: Checking robots.txt before crawling
const robotsTxt = await robotsParser.getRobotsTxt(domain)
if (!robotsParser.isAllowed(robotsTxt, url, userAgent)) {
  throw new Error('Crawling blocked by robots.txt')
}
```

### 2. Rate Limiting
- **Default 10-second delay between requests**
- **Domain-specific rate limiting**
- **Exponential backoff for 429 responses**
- **Concurrent request limits (max 5)**

```typescript
// Rate limiting configuration
const rateLimiter = new RateLimiter({
  defaultCrawlDelay: 10000, // 10 seconds
  maxConcurrentRequests: 5,
  maxRequestsPerHour: 100,
  backoffMultiplier: 2
})
```

### 3. Caching System
- **Configurable TTL per domain**
- **Conditional requests (If-Modified-Since, ETag)**
- **Automatic cache cleanup**
- **Data retention policy enforcement**

### 4. User-Agent Identification
```
CVKonnekt Job Crawler (+https://cvkonnekt.co.za/crawler-info)
```
- **Clear identification as a crawler**
- **Contact information provided**
- **Link to crawler information page**

## Data Handling Policies

### 1. Data Collection
- **Only publicly available job listings**
- **No personal contact information**
- **No user-generated content**
- **Factual information only (title, company, location, description)**

### 2. Data Storage
- **Encrypted storage**
- **Regular cleanup of expired data**
- **No permanent storage of scraped content**
- **Audit logs for compliance tracking**

### 3. Data Retention
- **Default 30-day retention period**
- **Automatic purging of old data**
- **User-requested deletion support**
- **Compliance reporting available**

## Ethical Guidelines

### 1. Respectful Crawling
- **Reasonable request intervals**
- **Respect for server resources**
- **Graceful error handling**
- **No aggressive retry patterns**

### 2. Content Usage
- **Attribution to original sources**
- **No content reproduction**
- **Factual information extraction only**
- **Respect for intellectual property**

### 3. Site Relationships
- **Preference for official APIs**
- **RSS feed utilization where available**
- **Communication with site owners when needed**
- **Compliance with terms of service**

## Implementation Guidelines

### 1. Adding New Sources
```typescript
// Example of compliant source configuration
{
  name: 'Example Job Site',
  type: 'rss', // Prefer RSS over scraping
  url: 'https://example.com/jobs.rss',
  active: true,
  parseFunction: parseExampleRSS,
  crawlConfig: {
    priority: 'normal',
    timeout: 15000,
    respectCache: true
  },
  complianceNotes: 'RSS feed - publicly available, no robots.txt restrictions'
}
```

### 2. Error Handling
- **Graceful degradation on failures**
- **Proper logging for debugging**
- **No aggressive retry mechanisms**
- **Respect for error responses**

### 3. Monitoring
- **Regular compliance audits**
- **Performance monitoring**
- **Error rate tracking**
- **Cache hit rate optimization**

## Contact Information

For questions about our crawling practices or to request exclusion:

- **Email**: crawler@cvkonnekt.co.za
- **Website**: https://cvkonnekt.co.za/crawler-info
- **Legal**: legal@cvkonnekt.co.za

## Compliance Checklist

- [ ] Robots.txt checked and respected
- [ ] Rate limiting implemented (min 10s between requests)
- [ ] User-Agent properly identifies crawler
- [ ] Contact information provided
- [ ] Data retention policies enforced
- [ ] Only public data collected
- [ ] No personal information stored
- [ ] Attribution maintained
- [ ] Terms of service reviewed
- [ ] Legal compliance verified

## Updates and Changes

This document is reviewed quarterly and updated as needed to maintain compliance with evolving legal requirements and best practices.

**Last Updated**: January 2024
**Next Review**: April 2024
**Version**: 1.0
