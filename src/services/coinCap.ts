const COINCAP_API_URL = 'https://api.coincap.io/v2';
const CACHE_DURATION = 300000; // 5 minutes cache

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const cache: {
  assets?: CacheItem<Asset[]>;
  history: { [key: string]: CacheItem<any[]> };
} = {
  history: {}
};

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  priceUsd: string;
  changePercent24Hr: string;
}

export const coinCapService = {
  async getAssets(): Promise<Asset[]> {
    // Check cache first
    if (cache.assets && Date.now() - cache.assets.timestamp < CACHE_DURATION) {
      return cache.assets.data;
    }

    try {
      const response = await fetch(`${COINCAP_API_URL}/assets`);
      if (!response.ok) throw new Error('Failed to fetch assets');
      const data = await response.json();
      
      // Store in cache
      cache.assets = {
        data: data.data,
        timestamp: Date.now()
      };
      
      return data.data;
    } catch (error) {
      console.error('Error fetching assets:', error);
      return [];
    }
  },

  async getAssetHistory(id: string, interval: string = 'd1'): Promise<any[]> {
    const cacheKey = `${id}-${interval}`;
    
    // Check cache first
    if (cache.history[cacheKey] && 
        Date.now() - cache.history[cacheKey].timestamp < CACHE_DURATION) {
      return cache.history[cacheKey].data;
    }

    const start = this.returnDayForInterval(interval);
    const end = Date.now();
    
    try {
      const response = await fetch(
        `${COINCAP_API_URL}/assets/${id}/history?interval=${interval}&start=${start}&end=${end}`
      );
      if (!response.ok) throw new Error('Failed to fetch asset history');
      const data = await response.json();
      
      // Store in cache
      cache.history[cacheKey] = {
        data: data.data,
        timestamp: Date.now()
      };
      
      return data.data;
    } catch (error) {
      console.error('Error fetching asset history:', error);
      return [];
    }
  },

  async getAssetData(id: string): Promise<any> {
    const response = await fetch(`${COINCAP_API_URL}/assets/${id}`);
    const data = await response.json();
    return data.data;
  },

  returnDayForInterval: function (interval: string) {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000; // one day in milliseconds
    
    switch (interval) {
      case 'm1': return now - oneDayMs; // last 24 hours
      case 'm5': return now - (2 * oneDayMs); // last 2 days
      case 'm15': return now - (3 * oneDayMs); // last 3 days
      case 'm30': return now - (5 * oneDayMs); // last 5 days
      case 'h1': return now - (7 * oneDayMs); // last week
      case 'h2': return now - (14 * oneDayMs); // last 2 weeks
      case 'h6': return now - (30 * oneDayMs); // last month
      case 'h12': return now - (60 * oneDayMs); // last 2 months
      case 'd1': return now - (90 * oneDayMs); // last 3 months
      default: return now - (30 * oneDayMs); // default to last month
    }
  }
}; 