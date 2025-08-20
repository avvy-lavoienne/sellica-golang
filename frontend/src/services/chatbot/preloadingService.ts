/**
 * Smart Preloading Service for SELLY Chatbot
 * Anticipates user queries and preloads data to improve perceived performance
 */

import { cacheService } from './cacheService';
import { chatbotDataService } from './dataService';

interface QueryPattern {
  pattern: RegExp;
  priority: number;
  preloadAction: () => Promise<void>;
  description: string;
}

interface UserBehavior {
  commonQueries: string[];
  queryFrequency: Record<string, number>;
  lastQueryTime: number;
  sessionStartTime: number;
}

export class SmartPreloadingService {
  private userBehavior: UserBehavior = {
    commonQueries: [],
    queryFrequency: {},
    lastQueryTime: 0,
    sessionStartTime: Date.now(),
  };

  private preloadPatterns: QueryPattern[] = [
    {
      pattern: /statistik|total|berapa/i,
      priority: 1,
      preloadAction: async () => {
        await Promise.all([
          cacheService.getOrSet(
            'database_overview',
            () => chatbotDataService.getDatabaseOverview(),
            'DATABASE_OVERVIEW'
          ),
          cacheService.getOrSet(
            'user_statistics',
            () => chatbotDataService.getUserStatistics(),
            'USER_STATISTICS'
          ),
        ]);
      },
      description: 'Preload system statistics',
    },
    {
      pattern: /tampilkan.*data|lihat.*data/i,
      priority: 2,
      preloadAction: async () => {
        await cacheService.getOrSet(
          'database_overview',
          () => chatbotDataService.getDatabaseOverview(),
          'DATABASE_OVERVIEW'
        );
      },
      description: 'Preload database overview for data queries',
    },
    {
      pattern: /cari|temukan|pencarian/i,
      priority: 3,
      preloadAction: async () => {
        // Preload common search results or database structure
        await cacheService.getOrSet(
          'database_overview',
          () => chatbotDataService.getDatabaseOverview(),
          'DATABASE_OVERVIEW'
        );
      },
      description: 'Preload database structure for search queries',
    },
    {
      pattern: /salah.*rekam|kesalahan/i,
      priority: 4,
      preloadAction: async () => {
        await cacheService.getOrSet(
          'database_overview',
          () => chatbotDataService.getDatabaseOverview(),
          'DATABASE_OVERVIEW'
        );
      },
      description: 'Preload data for salah rekam queries',
    },
  ];

  /**
   * Analyze user query and trigger predictive preloading
   */
  async analyzeAndPreload(query: string): Promise<void> {
    try {
      // Update user behavior tracking
      this.updateUserBehavior(query);

      // Find matching patterns and preload
      const matchingPatterns = this.preloadPatterns.filter(pattern =>
        pattern.pattern.test(query)
      );

      if (matchingPatterns.length > 0) {
        // Sort by priority and execute preloading
        matchingPatterns
          .sort((a, b) => a.priority - b.priority)
          .forEach(pattern => {
            // Execute preloading in background (don't await)
            pattern.preloadAction().catch(error => {
              console.warn(`Preloading failed for ${pattern.description}:`, error);
            });
          });
      }

      // Predictive preloading based on user behavior
      await this.predictivePreload();

    } catch (error) {
      console.warn('Error in analyze and preload:', error);
    }
  }

  /**
   * Predictive preloading based on user behavior patterns
   */
  private async predictivePreload(): Promise<void> {
    try {
      const sessionDuration = Date.now() - this.userBehavior.sessionStartTime;
      
      // If user has been active for more than 30 seconds, preload common data
      if (sessionDuration > 30000) {
        await this.preloadCommonData();
      }

      // If user frequently asks about statistics, preload stats data
      const statsQueries = Object.keys(this.userBehavior.queryFrequency)
        .filter(query => /statistik|total|berapa/i.test(query));
      
      if (statsQueries.length > 0) {
        this.preloadPatterns[0].preloadAction().catch(console.warn);
      }

      // If user frequently asks about specific tables, preload database overview
      const dataQueries = Object.keys(this.userBehavior.queryFrequency)
        .filter(query => /tampilkan|data|tabel/i.test(query));
      
      if (dataQueries.length > 1) {
        this.preloadPatterns[1].preloadAction().catch(console.warn);
      }

    } catch (error) {
      console.warn('Error in predictive preload:', error);
    }
  }

  /**
   * Preload commonly accessed data
   */
  private async preloadCommonData(): Promise<void> {
    try {
      console.log('Preloading common data in background...');
      
      // Preload database overview (most common)
      await cacheService.getOrSet(
        'database_overview',
        () => chatbotDataService.getDatabaseOverview(),
        'DATABASE_OVERVIEW'
      );

      // Preload user statistics (second most common)
      await cacheService.getOrSet(
        'user_statistics',
        () => chatbotDataService.getUserStatistics(),
        'USER_STATISTICS'
      );

      console.log('Common data preloaded successfully');
    } catch (error) {
      console.warn('Error preloading common data:', error);
    }
  }

  /**
   * Update user behavior tracking
   */
  private updateUserBehavior(query: string): void {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Update query frequency
    this.userBehavior.queryFrequency[normalizedQuery] = 
      (this.userBehavior.queryFrequency[normalizedQuery] || 0) + 1;

    // Update common queries (keep top 10)
    if (!this.userBehavior.commonQueries.includes(normalizedQuery)) {
      this.userBehavior.commonQueries.push(normalizedQuery);
      
      // Keep only top 10 most common queries
      if (this.userBehavior.commonQueries.length > 10) {
        this.userBehavior.commonQueries = Object.entries(this.userBehavior.queryFrequency)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([query]) => query);
      }
    }

    // Update last query time
    this.userBehavior.lastQueryTime = Date.now();
  }

  /**
   * Get preloading statistics for monitoring
   */
  getPreloadingStats(): {
    userBehavior: UserBehavior;
    cacheStats: any;
    recommendations: string[];
  } {
    const cacheStats = cacheService.getStats();
    const recommendations: string[] = [];

    // Generate recommendations based on user behavior
    if (this.userBehavior.commonQueries.length > 5) {
      recommendations.push('User shows consistent query patterns - preloading is beneficial');
    }

    if (cacheStats.hitRate < 50) {
      recommendations.push('Consider more aggressive preloading to improve cache hit rate');
    }

    if (Object.keys(this.userBehavior.queryFrequency).length > 20) {
      recommendations.push('User has diverse query patterns - consider expanding preload patterns');
    }

    return {
      userBehavior: this.userBehavior,
      cacheStats,
      recommendations,
    };
  }

  /**
   * Warm up cache with essential data on initialization
   */
  async warmUpCache(): Promise<void> {
    try {
      console.log('Warming up cache with essential data...');
      
      // Warm up most commonly accessed data
      await Promise.all([
        cacheService.getOrSet(
          'database_overview',
          () => chatbotDataService.getDatabaseOverview(),
          'DATABASE_OVERVIEW'
        ),
        cacheService.getOrSet(
          'user_statistics',
          () => chatbotDataService.getUserStatistics(),
          'USER_STATISTICS'
        ),
      ]);

      console.log('Cache warmed up successfully');
    } catch (error) {
      console.warn('Error warming up cache:', error);
    }
  }

  /**
   * Intelligent preloading based on time of day and usage patterns
   */
  async contextualPreload(): Promise<void> {
    try {
      const hour = new Date().getHours();
      
      // Business hours (9 AM - 5 PM) - preload work-related data
      if (hour >= 9 && hour <= 17) {
        await this.preloadCommonData();
      }
      
      // Early morning (6 AM - 9 AM) - preload summary data
      if (hour >= 6 && hour < 9) {
        this.preloadPatterns[0].preloadAction().catch(console.warn); // Statistics
      }

      // Evening (5 PM - 8 PM) - preload report data
      if (hour >= 17 && hour <= 20) {
        this.preloadPatterns[1].preloadAction().catch(console.warn); // Data queries
      }

    } catch (error) {
      console.warn('Error in contextual preload:', error);
    }
  }

  /**
   * Reset user behavior tracking (for new sessions)
   */
  resetUserBehavior(): void {
    this.userBehavior = {
      commonQueries: [],
      queryFrequency: {},
      lastQueryTime: 0,
      sessionStartTime: Date.now(),
    };
    console.log('User behavior tracking reset for new session');
  }
}

// Export singleton instance
export const preloadingService = new SmartPreloadingService();

// Initialize cache warming on startup
if (typeof window !== 'undefined') {
  // Client-side initialization
  setTimeout(() => {
    preloadingService.warmUpCache().catch(console.warn);
    preloadingService.contextualPreload().catch(console.warn);
  }, 2000); // Wait 2 seconds after page load
}
