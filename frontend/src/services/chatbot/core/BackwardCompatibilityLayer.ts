/**
 * Backward Compatibility Layer - Phase 2 Core Consolidation
 * Maintains existing API interfaces during transition to UnifiedAIService
 * Ensures zero breaking changes for existing components
 */

import { AIResponse, EnhancedAIResponse, AIServiceConfig } from '@/types/chatbot';
import { UnifiedAIService } from './UnifiedAIService';

/**
 * Backward Compatibility Layer
 * Provides legacy API interfaces while routing to UnifiedAIService
 */
export class BackwardCompatibilityLayer {
  private unifiedService: UnifiedAIService;
  private isEnabled: boolean = true;

  constructor(unifiedService: UnifiedAIService) {
    this.unifiedService = unifiedService;
  }

  /**
   * Legacy aiService.processQuery compatibility
   */
  async processQuery(query: string, context?: any): Promise<AIResponse> {
    if (!this.isEnabled) {
      throw new Error('Backward compatibility layer is disabled');
    }

    console.log('🔄 [COMPATIBILITY] Legacy processQuery called, routing to UnifiedAIService');
    return await this.unifiedService.processQuery(query, context);
  }

  /**
   * Legacy aiServiceEnhanced.processEnhancedQuery compatibility
   */
  async processEnhancedQuery(query: string, context?: any): Promise<EnhancedAIResponse> {
    if (!this.isEnabled) {
      throw new Error('Backward compatibility layer is disabled');
    }

    console.log('🔄 [COMPATIBILITY] Legacy processEnhancedQuery called, routing to UnifiedAIService');
    return await this.unifiedService.processEnhancedQuery(query, context);
  }

  /**
   * Legacy aiServiceHuggingFace.processEnhancedQuery compatibility
   */
  async processHuggingFaceQuery(query: string, context?: any): Promise<AIResponse> {
    if (!this.isEnabled) {
      throw new Error('Backward compatibility layer is disabled');
    }

    console.log('🔄 [COMPATIBILITY] Legacy HuggingFace query called, routing to UnifiedAIService');
    
    // Force HuggingFace provider
    const huggingFaceContext = {
      ...context,
      forceProvider: 'huggingface'
    };
    
    return await this.unifiedService.processQuery(query, huggingFaceContext);
  }

  /**
   * Legacy aiServiceTensorFlow.processEnhancedQuery compatibility
   */
  async processTensorFlowQuery(query: string, context?: any): Promise<AIResponse> {
    if (!this.isEnabled) {
      throw new Error('Backward compatibility layer is disabled');
    }

    console.log('🔄 [COMPATIBILITY] Legacy TensorFlow query called, routing to UnifiedAIService');
    
    // Force TensorFlow provider
    const tensorFlowContext = {
      ...context,
      forceProvider: 'tensorflow'
    };
    
    return await this.unifiedService.processQuery(query, tensorFlowContext);
  }

  /**
   * Legacy configuration update compatibility
   */
  updateConfig(config: Partial<AIServiceConfig>): void {
    console.log('🔄 [COMPATIBILITY] Legacy config update called, routing to UnifiedAIService');
    this.unifiedService.updateConfig(config);
  }

  /**
   * Legacy provider status compatibility
   */
  async getProviderStatus(): Promise<Record<string, any>> {
    console.log('🔄 [COMPATIBILITY] Legacy provider status called, routing to UnifiedAIService');
    return await this.unifiedService.getProviderStatus();
  }

  /**
   * Enable/disable backward compatibility
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`🔄 [COMPATIBILITY] Backward compatibility ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if compatibility layer is enabled
   */
  isCompatibilityEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Get migration status
   */
  getMigrationStatus(): {
    compatibilityEnabled: boolean;
    unifiedServiceReady: boolean;
    availableProviders: string[];
    recommendations: string[];
  } {
    const availableProviders = this.unifiedService.getAvailableProviders();
    const recommendations: string[] = [];

    if (availableProviders.length === 0) {
      recommendations.push('No providers available - check provider initialization');
    }

    if (this.isEnabled) {
      recommendations.push('Consider disabling compatibility layer after migration testing');
    }

    if (availableProviders.length < 3) {
      recommendations.push('Some providers may not be available - check provider health');
    }

    return {
      compatibilityEnabled: this.isEnabled,
      unifiedServiceReady: availableProviders.length > 0,
      availableProviders,
      recommendations
    };
  }
}

/**
 * Legacy Service Wrappers
 * Provide drop-in replacements for existing service imports
 */

/**
 * Legacy aiService wrapper
 */
export class LegacyAIService {
  private compatibilityLayer: BackwardCompatibilityLayer;

  constructor(unifiedService: UnifiedAIService) {
    this.compatibilityLayer = new BackwardCompatibilityLayer(unifiedService);
  }

  async processQuery(query: string, context?: any): Promise<AIResponse> {
    return await this.compatibilityLayer.processQuery(query, context);
  }

  updateConfig(config: Partial<AIServiceConfig>): void {
    this.compatibilityLayer.updateConfig(config);
  }

  async getStatus(): Promise<any> {
    return await this.compatibilityLayer.getProviderStatus();
  }
}

/**
 * Legacy aiServiceEnhanced wrapper
 */
export class LegacyEnhancedAIService {
  private compatibilityLayer: BackwardCompatibilityLayer;

  constructor(unifiedService: UnifiedAIService) {
    this.compatibilityLayer = new BackwardCompatibilityLayer(unifiedService);
  }

  async processEnhancedQuery(query: string, context?: any): Promise<EnhancedAIResponse> {
    return await this.compatibilityLayer.processEnhancedQuery(query, context);
  }

  async processQuery(query: string, context?: any): Promise<AIResponse> {
    return await this.compatibilityLayer.processQuery(query, context);
  }
}

/**
 * Legacy aiServiceHuggingFace wrapper
 */
export class LegacyHuggingFaceService {
  private compatibilityLayer: BackwardCompatibilityLayer;

  constructor(unifiedService: UnifiedAIService) {
    this.compatibilityLayer = new BackwardCompatibilityLayer(unifiedService);
  }

  async processEnhancedQuery(query: string, context?: any): Promise<AIResponse> {
    return await this.compatibilityLayer.processHuggingFaceQuery(query, context);
  }

  async processQuery(query: string, context?: any): Promise<AIResponse> {
    return await this.compatibilityLayer.processHuggingFaceQuery(query, context);
  }
}

/**
 * Legacy aiServiceTensorFlow wrapper
 */
export class LegacyTensorFlowService {
  private compatibilityLayer: BackwardCompatibilityLayer;

  constructor(unifiedService: UnifiedAIService) {
    this.compatibilityLayer = new BackwardCompatibilityLayer(unifiedService);
  }

  async processEnhancedQuery(query: string, context?: any): Promise<AIResponse> {
    return await this.compatibilityLayer.processTensorFlowQuery(query, context);
  }

  async processQuery(query: string, context?: any): Promise<AIResponse> {
    return await this.compatibilityLayer.processTensorFlowQuery(query, context);
  }
}

/**
 * Factory for creating legacy service instances
 */
export class LegacyServiceFactory {
  private unifiedService: UnifiedAIService;

  constructor(unifiedService: UnifiedAIService) {
    this.unifiedService = unifiedService;
  }

  createAIService(): LegacyAIService {
    return new LegacyAIService(this.unifiedService);
  }

  createEnhancedAIService(): LegacyEnhancedAIService {
    return new LegacyEnhancedAIService(this.unifiedService);
  }

  createHuggingFaceService(): LegacyHuggingFaceService {
    return new LegacyHuggingFaceService(this.unifiedService);
  }

  createTensorFlowService(): LegacyTensorFlowService {
    return new LegacyTensorFlowService(this.unifiedService);
  }

  createCompatibilityLayer(): BackwardCompatibilityLayer {
    return new BackwardCompatibilityLayer(this.unifiedService);
  }
}

// Export factory instance for easy access
export const createLegacyServices = (unifiedService: UnifiedAIService) => {
  return new LegacyServiceFactory(unifiedService);
};
