// src/components/cm/cmCache.js

class CmCache {
  constructor() {
    this.cache = new Map();
  }

  get(clientId) {
    if (!clientId) return {};
    if (!this.cache.has(clientId)) {
      this.cache.set(clientId, {
        integrations: null,          // { meta, linkedin, tiktok }
        googleRules: null,           // { autoOptimizeGoogleAds, maxCpaGoogleUsd, minRoasGoogle, optimizeActionGoogle, googleIntegration }
        threads: null,               // array of threads/comments
        posts: null,                 // array of organic posts
        metaInsights: null,          // key: dateRange, value: insights data
        googleInsights: null,        // key: dateRange, value: insights data
        metaIntegration: null,       // local integration state for MetaAdsSection
        googleIntegrationState: null, // local integration state for GoogleAdsSection
      });
    }
    return this.cache.get(clientId);
  }

  setIntegrations(clientId, integrations) {
    if (!clientId) return;
    this.get(clientId).integrations = integrations;
  }

  setGoogleRules(clientId, googleRules) {
    if (!clientId) return;
    this.get(clientId).googleRules = googleRules;
  }

  setThreads(clientId, threads) {
    if (!clientId) return;
    this.get(clientId).threads = threads;
  }

  setPosts(clientId, posts) {
    if (!clientId) return;
    this.get(clientId).posts = posts;
  }

  setMetaInsights(clientId, dateRange, insights) {
    if (!clientId) return;
    const entry = this.get(clientId);
    if (!entry.metaInsights) entry.metaInsights = {};
    entry.metaInsights[dateRange] = insights;
  }

  getMetaInsights(clientId, dateRange) {
    if (!clientId) return null;
    return this.get(clientId).metaInsights?.[dateRange] || null;
  }

  setGoogleInsights(clientId, dateRange, insights) {
    if (!clientId) return;
    const entry = this.get(clientId);
    if (!entry.googleInsights) entry.googleInsights = {};
    entry.googleInsights[dateRange] = insights;
  }

  getGoogleInsights(clientId, dateRange) {
    if (!clientId) return null;
    return this.get(clientId).googleInsights?.[dateRange] || null;
  }

  setMetaIntegration(clientId, integration) {
    if (!clientId) return;
    this.get(clientId).metaIntegration = integration;
  }

  setGoogleIntegrationState(clientId, integration) {
    if (!clientId) return;
    this.get(clientId).googleIntegrationState = integration;
  }

  clear(clientId) {
    if (clientId) {
      this.cache.delete(clientId);
    } else {
      this.cache.clear();
    }
  }
}

export const cmCache = new CmCache();
