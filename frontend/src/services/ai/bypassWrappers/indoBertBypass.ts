/**
 * IndoBERT Bypass Wrapper
 * Provides feature flag-based bypass for IndoBERT services
 */

import { isFeatureEnabled } from '@/config/featureFlags';
import { aiLogger } from '../../monitoring/logger';
import { PerformanceMonitor } from '../../monitoring/performanceMonitor';

export interface IndoBERTBypassConfig {
  enableFallback: boolean;
  fallbackTimeout: number;
  mockResponses: boolean;
  logBypass: boolean;
  useSimpleNLP: boolean;
}

export interface IndoBERTAnalysis {
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    dominant: 'positive' | 'neutral' | 'negative';
  };
  entities: Array<{
    text: string;
    label: string;
    confidence: number;
  }>;
  intent: {
    category: string;
    confidence: number;
    subcategory?: string;
  };
  language: {
    detected: 'indonesian' | 'english' | 'mixed';
    confidence: number;
  };
  complexity: 'simple' | 'moderate' | 'complex';
  processingTime: number;
  modelUsed: string;
  isMocked: boolean;
}

/**
 * IndoBERT Bypass Wrapper
 * Routes IndoBERT calls through feature flag checks
 */
export class IndoBERTBypass {
  private performanceMonitor: PerformanceMonitor;
  private config: IndoBERTBypassConfig;
  private isInitialized = false;

  constructor(config: Partial<IndoBERTBypassConfig> = {}) {
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.config = {
      enableFallback: true,
      fallbackTimeout: 1500,
      mockResponses: true,
      logBypass: true,
      useSimpleNLP: true,
      ...config
    };
  }

  /**
   * Initialize the bypass wrapper
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.isInitialized = true;
      
      if (this.config.logBypass) {
        aiLogger.enhancedQuery.info('IndoBERT Bypass Wrapper initialized', {
          config: this.config
        });
      }
    } catch (error) {
      aiLogger.enhancedQuery.error('Failed to initialize IndoBERT Bypass', { error });
      throw error;
    }
  }

  /**
   * Analyze text with bypass logic
   */
  async analyzeText(
    text: string,
    options: {
      includeSentiment?: boolean;
      includeEntities?: boolean;
      includeIntent?: boolean;
      includeLanguage?: boolean;
    } = {}
  ): Promise<IndoBERTAnalysis> {
    const startTime = performance.now();

    try {
      // Check if IndoBERT is disabled
      const indoBERTDisabled = isFeatureEnabled('disable_indobert');
      
      if (indoBERTDisabled) {
        return this.generateMockAnalysis(text, options, startTime);
      }

      // If not disabled, attempt real IndoBERT processing
      return await this.attemptRealAnalysis(text, options, startTime);

    } catch (error) {
      aiLogger.enhancedQuery.error('IndoBERT analysis failed, using fallback', {
        error,
        textLength: text.length
      });

      return this.generateMockAnalysis(text, options, startTime);
    }
  }

  /**
   * Attempt real IndoBERT analysis
   */
  private async attemptRealAnalysis(
    text: string,
    options: any,
    startTime: number
  ): Promise<IndoBERTAnalysis> {
    
    // This would normally call the real IndoBERT service
    // For now, we'll simulate the call and return enhanced mock data
    // since we're in the process of removing IndoBERT
    
    const processingTime = performance.now() - startTime;
    
    if (this.config.logBypass) {
      aiLogger.enhancedQuery.debug('IndoBERT real analysis attempted (mocked)', {
        textLength: text.length,
        processingTime: processingTime.toFixed(2)
      });
    }

    // Return enhanced mock analysis as if it came from real IndoBERT
    return this.generateEnhancedMockAnalysis(text, options, startTime);
  }

  /**
   * Generate mock analysis for bypass
   */
  private generateMockAnalysis(
    text: string,
    options: any,
    startTime: number
  ): IndoBERTAnalysis {
    const processingTime = performance.now() - startTime;

    if (this.config.logBypass) {
      aiLogger.enhancedQuery.debug('IndoBERT bypassed, using mock analysis', {
        textLength: text.length,
        processingTime: processingTime.toFixed(2)
      });
    }

    return this.generateSimpleMockAnalysis(text, options, startTime);
  }

  /**
   * Generate enhanced mock analysis (simulating real IndoBERT)
   */
  private generateEnhancedMockAnalysis(
    text: string,
    options: any,
    startTime: number
  ): IndoBERTAnalysis {
    const processingTime = performance.now() - startTime;
    
    // Enhanced analysis using simple NLP patterns
    const sentiment = this.analyzeSentimentSimple(text);
    const entities = this.extractEntitiesSimple(text);
    const intent = this.analyzeIntentSimple(text);
    const language = this.detectLanguageSimple(text);
    const complexity = this.analyzeComplexitySimple(text);

    return {
      sentiment,
      entities,
      intent,
      language,
      complexity,
      processingTime,
      modelUsed: 'enhanced-mock-indobert',
      isMocked: true
    };
  }

  /**
   * Generate simple mock analysis
   */
  private generateSimpleMockAnalysis(
    text: string,
    options: any,
    startTime: number
  ): IndoBERTAnalysis {
    const processingTime = performance.now() - startTime;

    return {
      sentiment: {
        positive: 0.4,
        neutral: 0.5,
        negative: 0.1,
        dominant: 'neutral'
      },
      entities: [],
      intent: {
        category: 'general_inquiry',
        confidence: 0.6
      },
      language: {
        detected: 'indonesian',
        confidence: 0.8
      },
      complexity: 'moderate',
      processingTime,
      modelUsed: 'simple-mock-indobert',
      isMocked: true
    };
  }

  /**
   * Simple sentiment analysis using keyword patterns
   */
  private analyzeSentimentSimple(text: string) {
    const positiveWords = ['baik', 'bagus', 'senang', 'terima kasih', 'mantap', 'oke'];
    const negativeWords = ['buruk', 'jelek', 'marah', 'kecewa', 'susah', 'sulit'];
    
    const textLower = text.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;

    positiveWords.forEach(word => {
      if (textLower.includes(word)) positiveScore += 0.2;
    });

    negativeWords.forEach(word => {
      if (textLower.includes(word)) negativeScore += 0.2;
    });

    const neutral = Math.max(0.1, 1 - positiveScore - negativeScore);
    const positive = Math.min(0.8, positiveScore);
    const negative = Math.min(0.8, negativeScore);

    let dominant: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (positive > neutral && positive > negative) dominant = 'positive';
    else if (negative > neutral && negative > positive) dominant = 'negative';

    return { positive, neutral, negative, dominant };
  }

  /**
   * Simple entity extraction using patterns
   */
  private extractEntitiesSimple(text: string) {
    const entities: Array<{ text: string; label: string; confidence: number }> = [];
    
    // Extract common Indonesian administrative entities
    const patterns = [
      { regex: /\b\d{16}\b/g, label: 'NIK' },
      { regex: /\b\d{4}-\d{2}-\d{2}\b/g, label: 'DATE' },
      { regex: /\bKTP\b/gi, label: 'DOCUMENT_TYPE' },
      { regex: /\bKK\b/gi, label: 'DOCUMENT_TYPE' },
      { regex: /\bAkta\s+Kelahiran\b/gi, label: 'DOCUMENT_TYPE' }
    ];

    patterns.forEach(pattern => {
      const matches = text.match(pattern.regex);
      if (matches) {
        matches.forEach(match => {
          entities.push({
            text: match,
            label: pattern.label,
            confidence: 0.7
          });
        });
      }
    });

    return entities;
  }

  /**
   * Simple intent analysis using keyword patterns
   */
  private analyzeIntentSimple(text: string) {
    const textLower = text.toLowerCase();
    
    const intentPatterns = [
      { keywords: ['apa', 'apakah'], category: 'question', confidence: 0.8 },
      { keywords: ['bagaimana', 'gimana'], category: 'how_to', confidence: 0.8 },
      { keywords: ['bantuan', 'tolong'], category: 'help_request', confidence: 0.7 },
      { keywords: ['terima kasih', 'makasih'], category: 'gratitude', confidence: 0.9 },
      { keywords: ['ktp', 'kartu tanda penduduk'], category: 'ktp_inquiry', confidence: 0.8 },
      { keywords: ['pengajuan', 'ajukan'], category: 'application', confidence: 0.7 }
    ];

    for (const pattern of intentPatterns) {
      for (const keyword of pattern.keywords) {
        if (textLower.includes(keyword)) {
          return {
            category: pattern.category,
            confidence: pattern.confidence
          };
        }
      }
    }

    return {
      category: 'general_inquiry',
      confidence: 0.5
    };
  }

  /**
   * Simple language detection
   */
  private detectLanguageSimple(text: string) {
    const indonesianWords = ['apa', 'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'dengan', 'ini', 'itu'];
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of'];
    
    const textLower = text.toLowerCase();
    let indonesianCount = 0;
    let englishCount = 0;

    indonesianWords.forEach(word => {
      if (textLower.includes(word)) indonesianCount++;
    });

    englishWords.forEach(word => {
      if (textLower.includes(word)) englishCount++;
    });

    if (indonesianCount > englishCount) {
      return { detected: 'indonesian' as const, confidence: 0.8 };
    } else if (englishCount > indonesianCount) {
      return { detected: 'english' as const, confidence: 0.8 };
    } else {
      return { detected: 'mixed' as const, confidence: 0.6 };
    }
  }

  /**
   * Simple complexity analysis
   */
  private analyzeComplexitySimple(text: string): 'simple' | 'moderate' | 'complex' {
    const wordCount = text.split(' ').length;
    const sentenceCount = text.split(/[.!?]+/).length;
    
    if (wordCount < 5 || sentenceCount <= 1) return 'simple';
    if (wordCount < 15 || sentenceCount <= 2) return 'moderate';
    return 'complex';
  }

  /**
   * Check if IndoBERT is available (always returns false during removal)
   */
  isAvailable(): boolean {
    const indoBERTDisabled = isFeatureEnabled('disable_indobert');
    return !indoBERTDisabled;
  }

  /**
   * Get bypass status
   */
  getBypassStatus(): {
    isBypassed: boolean;
    reason: string;
    fallbackEnabled: boolean;
  } {
    const indoBERTDisabled = isFeatureEnabled('disable_indobert');
    
    return {
      isBypassed: indoBERTDisabled,
      reason: indoBERTDisabled ? 'IndoBERT disabled via feature flag' : 'IndoBERT enabled',
      fallbackEnabled: this.config.enableFallback
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.config.logBypass) {
      aiLogger.enhancedQuery.info('IndoBERT Bypass cleanup completed');
    }
  }
}

// Singleton instance
let indoBERTBypassInstance: IndoBERTBypass | null = null;

export function getIndoBERTBypass(): IndoBERTBypass {
  if (!indoBERTBypassInstance) {
    indoBERTBypassInstance = new IndoBERTBypass();
  }
  return indoBERTBypassInstance;
}
