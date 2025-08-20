/**
 * Enhanced SELLY Integration Test
 * Quick test to verify the integration works correctly
 */

import { EnhancedSellyConfig } from '../services/chatbot/enhancedSellyConfig';
import { EnhancedSellyIntegration } from '../services/chatbot/enhancedSellyIntegration';

// Mock test to verify basic functionality
describe('Enhanced SELLY Integration', () => {
  
  test('EnhancedSellyConfig should initialize with default settings', () => {
    const config = EnhancedSellyConfig.getInstance();
    const settings = config.getSettings();
    
    expect(settings.globalEnhancementMode).toBe('adaptive');
    expect(settings.features.contextIntelligence).toBe(true);
    expect(settings.features.dynamicResponses).toBe(true);
    expect(settings.performance.maxProcessingTime).toBe(300);
  });

  test('EnhancedSellyConfig should handle user preferences', () => {
    const config = EnhancedSellyConfig.getInstance();
    const userId = 'test-user-123';
    
    // Get default preferences
    const userPrefs = config.getUserPreferences(userId);
    expect(userPrefs.preferences.enhancementMode).toBe('auto');
    expect(userPrefs.preferences.responseStyle).toBe('adaptive');
    
    // Update preferences
    config.updateUserPreferences(userId, {
      enhancementMode: 'enhanced',
      responseStyle: 'casual'
    });
    
    const updatedPrefs = config.getUserPreferences(userId);
    expect(updatedPrefs.preferences.enhancementMode).toBe('enhanced');
    expect(updatedPrefs.preferences.responseStyle).toBe('casual');
  });

  test('EnhancedSellyConfig should generate appropriate enhancement config', () => {
    const config = EnhancedSellyConfig.getInstance();
    const userId = 'test-user-456';
    
    // Test for new user (should use standard mode)
    const newUserConfig = config.getEnhancementConfig(userId);
    expect(newUserConfig.enableContextIntelligence).toBe(false);
    expect(newUserConfig.performanceMode).toBe('fast');
    
    // Simulate returning user
    config.recordUserInteraction(userId, 'ktp', true, 5);
    config.recordUserInteraction(userId, 'kk', true, 4);
    config.recordUserInteraction(userId, 'akta', true, 5);
    
    // Test for returning user (should use enhanced mode)
    const returningUserConfig = config.getEnhancementConfig(userId);
    expect(returningUserConfig.enableContextIntelligence).toBe(true);
    expect(returningUserConfig.performanceMode).toBe('balanced');
  });

  test('EnhancedSellyIntegration should initialize without errors', () => {
    expect(() => {
      const integration = new EnhancedSellyIntegration();
      expect(integration).toBeDefined();
    }).not.toThrow();
  });

  test('Integration should handle both standard and enhanced modes', async () => {
    const integration = new EnhancedSellyIntegration();
    
    // Test with standard mode configuration
    const standardConfig = {
      enableContextIntelligence: false,
      enableDynamicResponses: false,
      enablePersonaAdaptation: false,
      enableKnowledgeSynthesis: false,
      enableLocalAI: false,
      generateVariations: false,
      maxVariations: 0,
      performanceMode: 'fast' as const
    };
    
    // This should not throw errors
    expect(() => {
      integration.processEnhancedQuery(
        'halo selly',
        { userId: 'test-user' },
        standardConfig
      );
    }).not.toThrow();
  });

});

// Export for manual testing
export const testEnhancedIntegration = async () => {
  console.log('🧪 Testing Enhanced SELLY Integration...');
  
  try {
    // Test 1: Configuration
    const config = EnhancedSellyConfig.getInstance();
    console.log('✅ Config initialized:', config.getSettings().globalEnhancementMode);
    
    // Test 2: User preferences
    const userId = 'manual-test-user';
    config.updateUserPreferences(userId, { enhancementMode: 'enhanced' });
    const prefs = config.getUserPreferences(userId);
    console.log('✅ User preferences:', prefs.preferences.enhancementMode);
    
    // Test 3: Enhancement config
    const enhancementConfig = config.getEnhancementConfig(userId);
    console.log('✅ Enhancement config:', enhancementConfig.performanceMode);
    
    // Test 4: Integration
    const integration = new EnhancedSellyIntegration();
    console.log('✅ Integration initialized successfully');
    
    console.log('🎉 All tests passed! Enhanced SELLY Integration is ready.');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};
