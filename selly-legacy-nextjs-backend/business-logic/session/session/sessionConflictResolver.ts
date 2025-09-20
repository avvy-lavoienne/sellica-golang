/**
 * Session Conflict Resolution Service
 * Advanced conflict resolution strategies for concurrent session updates
 */

import { EnhancedSessionData, ConversationTurn, UserPreferences } from './types';
import { SessionUpdate, SessionConflict, ConflictResolution } from './realTimeSyncManager';

export type ConflictResolutionStrategy = 
  | 'last_write_wins' 
  | 'merge_compatible' 
  | 'user_intervention' 
  | 'priority_based'
  | 'semantic_merge';

export interface ConflictResolutionConfig {
  defaultStrategy: ConflictResolutionStrategy;
  conversationMergeStrategy: 'chronological' | 'device_priority' | 'user_choice';
  preferencesMergeStrategy: 'latest' | 'most_specific' | 'user_choice';
  contextMergeStrategy: 'latest' | 'merge_compatible' | 'user_choice';
  enableSemanticMerge: boolean;
  userInterventionTimeout: number; // milliseconds
}

export interface MergeResult {
  success: boolean;
  mergedData: Partial<EnhancedSessionData>;
  conflicts: string[];
  strategy: ConflictResolutionStrategy;
  confidence: number;
}

export class SessionConflictResolver {
  private config: ConflictResolutionConfig;
  private static instance: SessionConflictResolver;

  private constructor() {
    this.config = this.getDefaultConfig();
    console.log('✅ [CONFLICT_RESOLVER] Session conflict resolver initialized');
  }

  public static getInstance(): SessionConflictResolver {
    if (!SessionConflictResolver.instance) {
      SessionConflictResolver.instance = new SessionConflictResolver();
    }
    return SessionConflictResolver.instance;
  }

  /**
   * Resolve conflicts using the most appropriate strategy
   */
  async resolveConflict(conflict: SessionConflict): Promise<ConflictResolution> {
    const startTime = performance.now();
    
    try {
      // Determine the best resolution strategy
      const strategy = this.determineResolutionStrategy(conflict);
      
      let resolution: ConflictResolution;
      
      switch (strategy) {
        case 'last_write_wins':
          resolution = await this.applyLastWriteWins(conflict);
          break;
          
        case 'merge_compatible':
          resolution = await this.applyMergeCompatible(conflict);
          break;
          
        case 'semantic_merge':
          resolution = await this.applySemanticMerge(conflict);
          break;
          
        case 'priority_based':
          resolution = await this.applyPriorityBased(conflict);
          break;
          
        case 'user_intervention':
          resolution = await this.requestUserIntervention(conflict);
          break;
          
        default:
          resolution = await this.applyLastWriteWins(conflict);
      }
      
      resolution.resolutionTime = performance.now() - startTime;
      
      console.log(`✅ [CONFLICT_RESOLVER] Resolved conflict using ${strategy} strategy in ${resolution.resolutionTime.toFixed(2)}ms`);
      return resolution;
      
    } catch (error) {
      console.error('❌ [CONFLICT_RESOLVER] Failed to resolve conflict:', error);
      
      // Fallback to last-write-wins
      const fallbackResolution = await this.applyLastWriteWins(conflict);
      fallbackResolution.resolutionTime = performance.now() - startTime;
      return fallbackResolution;
    }
  }

  /**
   * Determine the best resolution strategy for a conflict
   */
  private determineResolutionStrategy(conflict: SessionConflict): ConflictResolutionStrategy {
    const { updates, conflictType } = conflict;
    
    // Analyze the nature of the updates
    const updateTypes = updates.map(u => u.updateType);
    const hasConversationUpdates = updateTypes.includes('conversation');
    const hasPreferencesUpdates = updateTypes.includes('preferences');
    const hasContextUpdates = updateTypes.includes('context');
    
    // If all updates are of the same type and compatible, try merging
    if (updateTypes.every(type => type === updateTypes[0])) {
      switch (updateTypes[0]) {
        case 'conversation':
          return 'merge_compatible'; // Conversations can usually be merged chronologically
          
        case 'preferences':
          return this.config.enableSemanticMerge ? 'semantic_merge' : 'last_write_wins';
          
        case 'context':
          return 'merge_compatible';
          
        case 'analytics':
          return 'merge_compatible'; // Analytics can be aggregated
      }
    }
    
    // Mixed update types - use priority-based resolution
    if (hasConversationUpdates && (hasPreferencesUpdates || hasContextUpdates)) {
      return 'priority_based';
    }
    
    // For concurrent updates of different types, try semantic merge if enabled
    if (this.config.enableSemanticMerge && updates.length <= 3) {
      return 'semantic_merge';
    }
    
    // Default to configured strategy
    return this.config.defaultStrategy;
  }

  /**
   * Apply last-write-wins resolution
   */
  private async applyLastWriteWins(conflict: SessionConflict): Promise<ConflictResolution> {
    const sortedUpdates = conflict.updates.sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
    
    const winningUpdate = sortedUpdates[0];
    const rejectedUpdates = sortedUpdates.slice(1);

    return {
      strategy: 'last_write_wins',
      appliedUpdate: winningUpdate,
      rejectedUpdates,
      resolutionTime: 0 // Will be set by caller
    };
  }

  /**
   * Apply merge-compatible resolution
   */
  private async applyMergeCompatible(conflict: SessionConflict): Promise<ConflictResolution> {
    const mergeResult = await this.mergeUpdates(conflict.updates);
    
    if (mergeResult.success) {
      // Create a synthetic update with merged data
      const mergedUpdate: SessionUpdate = {
        sessionId: conflict.sessionId,
        sourceDeviceId: 'system_merge',
        timestamp: new Date(),
        updateData: mergeResult.mergedData,
        updateType: conflict.updates[0].updateType,
        version: Math.max(...conflict.updates.map(u => u.version)) + 1
      };

      return {
        strategy: 'merge_compatible',
        appliedUpdate: mergedUpdate,
        rejectedUpdates: [],
        resolutionTime: 0
      };
    } else {
      // Fallback to last-write-wins if merge fails
      return this.applyLastWriteWins(conflict);
    }
  }

  /**
   * Apply semantic merge resolution
   */
  private async applySemanticMerge(conflict: SessionConflict): Promise<ConflictResolution> {
    // For now, this is similar to merge_compatible but with more intelligent merging
    // In a full implementation, this would use AI/ML to understand semantic conflicts
    
    const semanticMergeResult = await this.performSemanticMerge(conflict.updates);
    
    if (semanticMergeResult.success && semanticMergeResult.confidence > 0.8) {
      const mergedUpdate: SessionUpdate = {
        sessionId: conflict.sessionId,
        sourceDeviceId: 'semantic_merge',
        timestamp: new Date(),
        updateData: semanticMergeResult.mergedData,
        updateType: conflict.updates[0].updateType,
        version: Math.max(...conflict.updates.map(u => u.version)) + 1
      };

      return {
        strategy: 'semantic_merge',
        appliedUpdate: mergedUpdate,
        rejectedUpdates: [],
        resolutionTime: 0
      };
    } else {
      // Fallback to merge_compatible
      return this.applyMergeCompatible(conflict);
    }
  }

  /**
   * Apply priority-based resolution
   */
  private async applyPriorityBased(conflict: SessionConflict): Promise<ConflictResolution> {
    // Define priority order for update types
    const priorityOrder: Record<SessionUpdate['updateType'], number> = {
      'conversation': 1, // Highest priority
      'context': 2,
      'preferences': 3,
      'analytics': 4 // Lowest priority
    };

    // Sort updates by priority and timestamp
    const sortedUpdates = conflict.updates.sort((a, b) => {
      const priorityDiff = priorityOrder[a.updateType] - priorityOrder[b.updateType];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Same priority, use timestamp
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    const winningUpdate = sortedUpdates[0];
    const rejectedUpdates = sortedUpdates.slice(1);

    return {
      strategy: 'priority_based',
      appliedUpdate: winningUpdate,
      rejectedUpdates,
      resolutionTime: 0
    };
  }

  /**
   * Request user intervention for conflict resolution
   */
  private async requestUserIntervention(conflict: SessionConflict): Promise<ConflictResolution> {
    // In a full implementation, this would present options to the user
    // For now, we'll timeout and fallback to last-write-wins
    
    console.log(`👤 [CONFLICT_RESOLVER] User intervention requested for session ${conflict.sessionId}`);
    
    // Simulate user intervention timeout
    await new Promise(resolve => setTimeout(resolve, 100)); // Short timeout for demo
    
    console.log(`⏰ [CONFLICT_RESOLVER] User intervention timeout, falling back to last-write-wins`);
    return this.applyLastWriteWins(conflict);
  }

  /**
   * Merge multiple updates intelligently
   */
  private async mergeUpdates(updates: SessionUpdate[]): Promise<MergeResult> {
    try {
      const mergedData: Partial<EnhancedSessionData> = {};
      const conflicts: string[] = [];
      
      // Merge conversation history
      const conversationUpdates = updates.filter(u => u.updateData.conversationHistory);
      if (conversationUpdates.length > 0) {
        const mergedConversations = this.mergeConversationHistory(
          conversationUpdates.map(u => u.updateData.conversationHistory!).flat()
        );
        mergedData.conversationHistory = mergedConversations;
      }
      
      // Merge user preferences
      const preferenceUpdates = updates.filter(u => u.updateData.userPreferences);
      if (preferenceUpdates.length > 0) {
        const mergedPreferences = this.mergeUserPreferences(
          preferenceUpdates.map(u => u.updateData.userPreferences!)
        );
        mergedData.userPreferences = mergedPreferences;
      }
      
      // Merge conversation context
      const contextUpdates = updates.filter(u => u.updateData.conversationContext);
      if (contextUpdates.length > 0) {
        const latestContext = contextUpdates.sort((a, b) => 
          b.timestamp.getTime() - a.timestamp.getTime()
        )[0].updateData.conversationContext;
        mergedData.conversationContext = latestContext;
      }
      
      // Merge analytics (additive)
      const analyticsUpdates = updates.filter(u => u.updateData.analytics);
      if (analyticsUpdates.length > 0) {
        const mergedAnalytics = this.mergeAnalytics(
          analyticsUpdates.map(u => u.updateData.analytics!)
        );
        mergedData.analytics = mergedAnalytics;
      }

      return {
        success: true,
        mergedData,
        conflicts,
        strategy: 'merge_compatible',
        confidence: conflicts.length === 0 ? 1.0 : 0.7
      };
      
    } catch (error) {
      console.error('❌ [CONFLICT_RESOLVER] Failed to merge updates:', error);
      return {
        success: false,
        mergedData: {},
        conflicts: ['Merge operation failed'],
        strategy: 'merge_compatible',
        confidence: 0
      };
    }
  }

  /**
   * Perform semantic merge using AI/ML techniques
   */
  private async performSemanticMerge(updates: SessionUpdate[]): Promise<MergeResult> {
    // This is a placeholder for advanced semantic merging
    // In a full implementation, this would use NLP/ML to understand conflicts
    
    console.log('🧠 [CONFLICT_RESOLVER] Performing semantic merge analysis...');
    
    // For now, fall back to regular merge with higher confidence if successful
    const regularMerge = await this.mergeUpdates(updates);
    
    if (regularMerge.success) {
      return {
        ...regularMerge,
        strategy: 'semantic_merge',
        confidence: Math.min(regularMerge.confidence + 0.1, 1.0)
      };
    }
    
    return regularMerge;
  }

  /**
   * Merge conversation history chronologically
   */
  private mergeConversationHistory(conversations: ConversationTurn[]): ConversationTurn[] {
    // Remove duplicates based on ID and sort chronologically
    const uniqueConversations = conversations.filter((conv, index, array) => 
      array.findIndex(c => c.id === conv.id) === index
    );
    
    return uniqueConversations.sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  /**
   * Merge user preferences intelligently
   */
  private mergeUserPreferences(preferences: UserPreferences[]): UserPreferences {
    // Start with the first preference set
    const merged = { ...preferences[0] };
    
    // Apply subsequent preferences, keeping the most recent non-null values
    for (let i = 1; i < preferences.length; i++) {
      const current = preferences[i];
      
      Object.keys(current).forEach(key => {
        const currentValue = (current as any)[key];
        if (currentValue !== null && currentValue !== undefined) {
          (merged as any)[key] = currentValue;
        }
      });
    }
    
    return merged;
  }

  /**
   * Merge analytics data additively
   */
  private mergeAnalytics(analyticsArray: EnhancedSessionData['analytics'][]): EnhancedSessionData['analytics'] {
    const merged = { ...analyticsArray[0] };
    
    for (let i = 1; i < analyticsArray.length; i++) {
      const current = analyticsArray[i];
      
      // Add numeric values
      merged.totalQueries += current.totalQueries;
      merged.sessionDuration = Math.max(merged.sessionDuration, current.sessionDuration);
      merged.deviceSwitches += current.deviceSwitches;
      
      // Average response time
      merged.averageResponseTime = (merged.averageResponseTime + current.averageResponseTime) / 2;
      
      // Average cache hit rate
      merged.cacheHitRate = (merged.cacheHitRate + current.cacheHitRate) / 2;
      
      // Merge most used services
      const allServices = [...merged.mostUsedServices, ...current.mostUsedServices];
      merged.mostUsedServices = [...new Set(allServices)].slice(0, 10); // Keep top 10 unique
    }
    
    return merged;
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): ConflictResolutionConfig {
    return {
      defaultStrategy: 'merge_compatible',
      conversationMergeStrategy: 'chronological',
      preferencesMergeStrategy: 'latest',
      contextMergeStrategy: 'latest',
      enableSemanticMerge: false, // Disabled until AI/ML implementation
      userInterventionTimeout: 30000 // 30 seconds
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ConflictResolutionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ [CONFLICT_RESOLVER] Configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): ConflictResolutionConfig {
    return { ...this.config };
  }
}
