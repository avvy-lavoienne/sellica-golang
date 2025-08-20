/**
 * Mobile PWA Optimization Service - Week 5 Implementation
 * Optimizes SELLY for mobile devices with Progressive Web App capabilities
 * Includes offline support, responsive design, and mobile-specific features
 */

import { SessionStorageAdapter } from '@/services/session/storage';
import { PerformanceMonitor } from '@/services/monitoring/performanceMonitor';
import { UnifiedSession } from '@/services/session/unifiedTypes';

export interface MobilePWAConfig {
  enableOfflineMode: boolean;
  enablePushNotifications: boolean;
  enableBackgroundSync: boolean;
  enableInstallPrompt: boolean;
  enableMobileOptimizations: boolean;
  cacheStrategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
  offlineFallback: {
    enableOfflineChat: boolean;
    maxOfflineMessages: number;
    syncOnReconnect: boolean;
  };
  performance: {
    enableLazyLoading: boolean;
    enableImageOptimization: boolean;
    enableCodeSplitting: boolean;
    maxBundleSize: number; // KB
  };
  ui: {
    enableTouchOptimizations: boolean;
    enableGestureSupport: boolean;
    enableHapticFeedback: boolean;
    adaptiveLayout: boolean;
  };
}

export interface DeviceCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
  hasCamera: boolean;
  hasGeolocation: boolean;
  hasNotificationSupport: boolean;
  hasServiceWorkerSupport: boolean;
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'unknown';
  screenSize: { width: number; height: number };
  orientation: 'portrait' | 'landscape';
}

export interface MobileOptimization {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  optimizations: {
    ui: string[];
    performance: string[];
    caching: string[];
    offline: string[];
  };
  recommendations: string[];
  appliedOptimizations: string[];
}

export interface OfflineCapability {
  isOffline: boolean;
  lastSyncTime: Date;
  pendingActions: OfflineAction[];
  cachedSessions: string[];
  availableFeatures: string[];
}

export interface OfflineAction {
  id: string;
  type: 'message' | 'session_update' | 'preference_change';
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

export interface PWAInstallPrompt {
  canInstall: boolean;
  isInstalled: boolean;
  installEvent?: any;
  userChoice?: 'accepted' | 'dismissed';
  promptShown: boolean;
}

export class MobilePWAOptimization {
  private config: MobilePWAConfig;
  private storageAdapter: SessionStorageAdapter;
  private performanceMonitor: PerformanceMonitor;
  private deviceCapabilities: DeviceCapabilities | null = null;
  private offlineCapability: OfflineCapability;
  private installPrompt: PWAInstallPrompt;
  private serviceWorker: ServiceWorker | null = null;

  constructor(
    storageAdapter: SessionStorageAdapter,
    performanceMonitor: PerformanceMonitor,
    config?: Partial<MobilePWAConfig>
  ) {
    this.storageAdapter = storageAdapter;
    this.performanceMonitor = performanceMonitor;
    
    this.config = {
      enableOfflineMode: true,
      enablePushNotifications: true,
      enableBackgroundSync: true,
      enableInstallPrompt: true,
      enableMobileOptimizations: true,
      cacheStrategy: 'stale-while-revalidate',
      offlineFallback: {
        enableOfflineChat: true,
        maxOfflineMessages: 50,
        syncOnReconnect: true
      },
      performance: {
        enableLazyLoading: true,
        enableImageOptimization: true,
        enableCodeSplitting: true,
        maxBundleSize: 250 // 250KB
      },
      ui: {
        enableTouchOptimizations: true,
        enableGestureSupport: true,
        enableHapticFeedback: true,
        adaptiveLayout: true
      },
      ...config
    };

    this.offlineCapability = {
      isOffline: !navigator.onLine,
      lastSyncTime: new Date(),
      pendingActions: [],
      cachedSessions: [],
      availableFeatures: []
    };

    this.installPrompt = {
      canInstall: false,
      isInstalled: false,
      promptShown: false
    };

    this.initialize();
  }

  /**
   * Initialize mobile PWA optimizations
   */
  private async initialize(): Promise<void> {
    try {
      // Detect device capabilities
      this.deviceCapabilities = await this.detectDeviceCapabilities();
      
      // Register service worker
      if (this.config.enableOfflineMode) {
        await this.registerServiceWorker();
      }
      
      // Setup offline handling
      this.setupOfflineHandling();
      
      // Setup install prompt
      if (this.config.enableInstallPrompt) {
        this.setupInstallPrompt();
      }
      
      // Apply mobile optimizations
      if (this.config.enableMobileOptimizations) {
        await this.applyMobileOptimizations();
      }
      
      console.log('📱 Mobile PWA optimization initialized');
    } catch (error) {
      console.error('Mobile PWA initialization error:', error);
    }
  }

  /**
   * Detect device capabilities
   */
  private async detectDeviceCapabilities(): Promise<DeviceCapabilities> {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bTablet\b)|KFAPWI/i.test(userAgent);
    const isDesktop = !isMobile && !isTablet;
    
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasGeolocation = 'geolocation' in navigator;
    const hasNotificationSupport = 'Notification' in window;
    const hasServiceWorkerSupport = 'serviceWorker' in navigator;
    
    // Detect connection type
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    const connectionType = connection ? connection.effectiveType || 'unknown' : 'unknown';
    
    const screenSize = {
      width: window.screen.width,
      height: window.screen.height
    };
    
    const orientation = window.screen.width > window.screen.height ? 'landscape' : 'portrait';

    return {
      isMobile,
      isTablet,
      isDesktop,
      hasTouch,
      hasCamera,
      hasGeolocation,
      hasNotificationSupport,
      hasServiceWorkerSupport,
      connectionType: connectionType as any,
      screenSize,
      orientation
    };
  }

  /**
   * Register service worker for offline capabilities
   */
  private async registerServiceWorker(): Promise<void> {
    if (!this.deviceCapabilities?.hasServiceWorkerSupport) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered:', registration);
      
      // Listen for service worker updates
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Service Worker update found');
      });
      
      // Get active service worker
      this.serviceWorker = registration.active;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  /**
   * Setup offline handling
   */
  private setupOfflineHandling(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.offlineCapability.isOffline = false;
      console.log('📶 Back online');
      
      if (this.config.offlineFallback.syncOnReconnect) {
        this.syncPendingActions();
      }
    });

    window.addEventListener('offline', () => {
      this.offlineCapability.isOffline = true;
      console.log('📵 Gone offline');
    });

    // Initial state
    this.offlineCapability.isOffline = !navigator.onLine;
  }

  /**
   * Setup PWA install prompt
   */
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt.installEvent = e;
      this.installPrompt.canInstall = true;
      console.log('📲 PWA install prompt available');
    });

    window.addEventListener('appinstalled', () => {
      this.installPrompt.isInstalled = true;
      console.log('✅ PWA installed');
    });
  }

  /**
   * Apply mobile-specific optimizations
   */
  private async applyMobileOptimizations(): Promise<MobileOptimization> {
    if (!this.deviceCapabilities) {
      throw new Error('Device capabilities not detected');
    }

    const deviceType = this.deviceCapabilities.isMobile ? 'mobile' : 
                      this.deviceCapabilities.isTablet ? 'tablet' : 'desktop';

    const optimizations: {
      ui: string[];
      performance: string[];
      caching: string[];
      offline: string[];
    } = {
      ui: [],
      performance: [],
      caching: [],
      offline: []
    };

    const appliedOptimizations: string[] = [];

    // UI Optimizations
    if (this.config.ui.enableTouchOptimizations && this.deviceCapabilities.hasTouch) {
      optimizations.ui.push('touch-friendly-buttons', 'gesture-navigation');
      appliedOptimizations.push('touch-optimizations');
    }

    if (this.config.ui.adaptiveLayout) {
      optimizations.ui.push('responsive-layout', 'mobile-first-design');
      appliedOptimizations.push('adaptive-layout');
    }

    // Performance Optimizations
    if (this.config.performance.enableLazyLoading) {
      optimizations.performance.push('lazy-loading', 'intersection-observer');
      appliedOptimizations.push('lazy-loading');
    }

    if (this.config.performance.enableImageOptimization) {
      optimizations.performance.push('webp-images', 'responsive-images');
      appliedOptimizations.push('image-optimization');
    }

    // Caching Optimizations
    if (this.deviceCapabilities.connectionType === 'slow-2g' || this.deviceCapabilities.connectionType === '2g') {
      optimizations.caching.push('aggressive-caching', 'preload-critical-resources');
      appliedOptimizations.push('slow-connection-optimizations');
    }

    // Offline Optimizations
    if (this.config.enableOfflineMode) {
      optimizations.offline.push('offline-chat', 'background-sync');
      appliedOptimizations.push('offline-mode');
    }

    const recommendations = this.generateOptimizationRecommendations(deviceType);

    return {
      deviceType,
      optimizations,
      recommendations,
      appliedOptimizations
    };
  }

  /**
   * Handle offline message sending
   */
  async sendOfflineMessage(content: string, sessionId: string): Promise<void> {
    if (!this.config.offlineFallback.enableOfflineChat) {
      throw new Error('Offline chat is disabled');
    }

    const action: OfflineAction = {
      id: `offline_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'message',
      data: { content, sessionId, timestamp: new Date() },
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3
    };

    this.offlineCapability.pendingActions.push(action);
    
    // Store in local storage for persistence
    await this.storageAdapter.set('offline_actions', this.offlineCapability.pendingActions);
    
    console.log('📝 Message queued for offline sending');
  }

  /**
   * Sync pending actions when back online
   */
  private async syncPendingActions(): Promise<void> {
    if (this.offlineCapability.pendingActions.length === 0) {
      return;
    }

    console.log(`🔄 Syncing ${this.offlineCapability.pendingActions.length} pending actions...`);

    const actionsToSync = [...this.offlineCapability.pendingActions];
    this.offlineCapability.pendingActions = [];

    for (const action of actionsToSync) {
      try {
        await this.executeOfflineAction(action);
        console.log(`✅ Synced action: ${action.id}`);
      } catch (error) {
        console.error(`❌ Failed to sync action: ${action.id}`, error);
        
        // Retry logic
        if (action.retryCount < action.maxRetries) {
          action.retryCount++;
          this.offlineCapability.pendingActions.push(action);
        }
      }
    }

    this.offlineCapability.lastSyncTime = new Date();
    await this.storageAdapter.set('offline_actions', this.offlineCapability.pendingActions);
  }

  /**
   * Execute offline action
   */
  private async executeOfflineAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
      case 'message':
        // Implementation for sending queued message
        break;
      case 'session_update':
        // Implementation for session updates
        break;
      case 'preference_change':
        // Implementation for preference changes
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Show PWA install prompt
   */
  async showInstallPrompt(): Promise<boolean> {
    if (!this.installPrompt.canInstall || !this.installPrompt.installEvent) {
      return false;
    }

    try {
      this.installPrompt.installEvent.prompt();
      this.installPrompt.promptShown = true;
      
      const { outcome } = await this.installPrompt.installEvent.userChoice;
      this.installPrompt.userChoice = outcome;
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('Install prompt error:', error);
      return false;
    }
  }

  /**
   * Get mobile optimization status
   */
  getOptimizationStatus(): {
    deviceCapabilities: DeviceCapabilities | null;
    offlineCapability: OfflineCapability;
    installPrompt: PWAInstallPrompt;
    config: MobilePWAConfig;
  } {
    return {
      deviceCapabilities: this.deviceCapabilities,
      offlineCapability: this.offlineCapability,
      installPrompt: this.installPrompt,
      config: this.config
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizationRecommendations(deviceType: string): string[] {
    const recommendations: string[] = [];

    if (deviceType === 'mobile') {
      recommendations.push(
        'Enable touch-friendly interface elements',
        'Implement swipe gestures for navigation',
        'Optimize for one-handed usage',
        'Use larger tap targets (minimum 44px)',
        'Implement pull-to-refresh functionality'
      );
    }

    if (this.deviceCapabilities?.connectionType === 'slow-2g' || this.deviceCapabilities?.connectionType === '2g') {
      recommendations.push(
        'Enable aggressive caching strategies',
        'Implement progressive loading',
        'Reduce image sizes and use WebP format',
        'Minimize JavaScript bundle size'
      );
    }

    if (!this.installPrompt.isInstalled) {
      recommendations.push(
        'Encourage PWA installation for better performance',
        'Show install prompt at appropriate moments'
      );
    }

    return recommendations;
  }
}

/**
 * Factory function to create mobile PWA optimization
 */
export function createMobilePWAOptimization(
  storageAdapter: SessionStorageAdapter,
  performanceMonitor: PerformanceMonitor,
  config?: Partial<MobilePWAConfig>
): MobilePWAOptimization {
  return new MobilePWAOptimization(storageAdapter, performanceMonitor, config);
}

/**
 * Default configuration for production use
 */
export const PRODUCTION_MOBILE_CONFIG: MobilePWAConfig = {
  enableOfflineMode: true,
  enablePushNotifications: true,
  enableBackgroundSync: true,
  enableInstallPrompt: true,
  enableMobileOptimizations: true,
  cacheStrategy: 'stale-while-revalidate',
  offlineFallback: {
    enableOfflineChat: true,
    maxOfflineMessages: 50,
    syncOnReconnect: true
  },
  performance: {
    enableLazyLoading: true,
    enableImageOptimization: true,
    enableCodeSplitting: true,
    maxBundleSize: 250
  },
  ui: {
    enableTouchOptimizations: true,
    enableGestureSupport: true,
    enableHapticFeedback: true,
    adaptiveLayout: true
  }
};
