/**
 * Backend AI Service - Phase 3 Integration
 * Integrates frontend with high-performance Phase 3 backend AI engine
 * Week 1, Day 1: Core Integration Foundation
 */

import { AIResponse } from '@/types/chatbot';
import { AIProvider, ProviderCapabilities } from '@/types/aiProvider';
import { aiLogger } from '../../monitoring/logger';
import { PerformanceMonitor } from '../../monitoring/performanceMonitor';
import { createClient } from '@/lib/conn/server';
import { BackendCacheManager } from './BackendCacheManager';

export interface BackendAIRequest {
  message: string;
  context?: Record<string, any>;
  sessionId?: string;
  enhancementMode?: string;
  userId?: string;
}

export interface BackendAIResponse {
  message: string;
  type: string;
  confidence: number;
  model?: string;
  processingTime?: number;
  workerType?: string;
  metadata?: Record<string, any>;
  sessionId?: string;
}

export interface BackendAuthConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  enableAuth: boolean;
}

/**
 * Backend AI Service
 * Provides integration with Phase 3 high-performance backend AI engine
 */
export class BackendAIService implements AIProvider {
  public readonly id = 'backend';
  public readonly name = 'SELLY Backend High-Performance AI';
  
  public readonly capabilities: ProviderCapabilities = {
    indonesianLanguage: true,
    tensorflowIntegration: false, // Backend handles this
    enhancedIntelligence: true,
    conversationalMode: true,
    realTimeProcessing: true,
    maxTokens: 4000,
    supportedResponseTypes: ['text', 'data', 'administrative', 'government']
  };

  private config: BackendAuthConfig;
  private performanceMonitor: PerformanceMonitor;
  private cacheManager: BackendCacheManager;
  private tokenCache: string | null = null;
  private tokenExpiry: number = 0;
  private isHealthy: boolean = true;
  private lastHealthCheck: number = 0;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  constructor(config?: Partial<BackendAuthConfig>) {
    this.config = {
      baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080',
      timeout: 10000, // 10 seconds
      retryAttempts: 3,
      enableAuth: true,
      ...config
    };
    
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.cacheManager = new BackendCacheManager();

    aiLogger.backend.info('🚀 Backend AI Service initialized', {
      baseURL: this.config.baseURL,
      enableAuth: this.config.enableAuth
    });
  }

  /**
   * Process query with backend AI engine
   */
  async processQuery(query: string, context?: any): Promise<AIResponse> {
    const startTime = performance.now();
    const operationId = `backend_query_${Date.now()}`;

    try {
      // Start performance monitoring
      this.performanceMonitor.startAIOperation(operationId, 'backend', query);

      // Check cache first
      const cachedResponse = await this.cacheManager.getCachedResponse(query, context);
      if (cachedResponse) {
        this.performanceMonitor.completeAIOperation(operationId, true);

        aiLogger.backend.debug('🎯 Cache hit for backend query', {
          query: query.substring(0, 50) + '...',
          cacheAge: Date.now() - (cachedResponse.metadata?.timestamp || 0)
        });

        return cachedResponse;
      }

      // Check backend health
      await this.ensureBackendHealth();
      
      // Prepare request
      const request: BackendAIRequest = {
        message: query,
        context: context || {},
        enhancementMode: 'enhanced',
        userId: await this.getCurrentUserId()
      };
      
      // Make backend request
      const backendResponse = await this.makeBackendRequest('/chat', request);
      
      // Transform response
      const aiResponse = this.transformBackendResponse(backendResponse, startTime);

      // Cache the response
      await this.cacheManager.setCachedResponse(query, context, aiResponse);

      // Complete performance monitoring
      this.performanceMonitor.completeAIOperation(operationId, true);

      aiLogger.backend.info('✅ Backend query processed successfully', {
        query: query.substring(0, 50) + '...',
        processingTime: aiResponse.metadata?.processingTime,
        workerType: aiResponse.metadata?.workerType,
        confidence: aiResponse.confidence
      });

      return aiResponse;
      
    } catch (error) {
      // Complete performance monitoring with error
      this.performanceMonitor.completeAIOperation(operationId, false);
      
      aiLogger.backend.error('❌ Backend query failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: query.substring(0, 50) + '...',
        processingTime: performance.now() - startTime
      });
      
      throw new Error(`Backend AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process session-aware query
   */
  async processSessionQuery(
    query: string, 
    sessionId: string, 
    context?: any
  ): Promise<AIResponse> {
    const startTime = performance.now();
    const operationId = `backend_session_${Date.now()}`;
    
    try {
      // Start performance monitoring
      this.performanceMonitor.startAIOperation(operationId, 'backend-session', query);
      
      // Check backend health
      await this.ensureBackendHealth();
      
      // Prepare session request
      const request: BackendAIRequest = {
        message: query,
        context: context || {},
        sessionId,
        enhancementMode: 'enhanced',
        userId: await this.getCurrentUserId()
      };
      
      // Make backend session request
      const backendResponse = await this.makeBackendRequest('/chat/session', request);
      
      // Transform response
      const aiResponse = this.transformBackendResponse(backendResponse, startTime);
      
      // Complete performance monitoring
      this.performanceMonitor.completeAIOperation(operationId, true);
      
      aiLogger.backend.info('✅ Backend session query processed successfully', {
        sessionId,
        query: query.substring(0, 50) + '...',
        processingTime: aiResponse.metadata?.processingTime,
        workerType: aiResponse.metadata?.workerType
      });
      
      return aiResponse;
      
    } catch (error) {
      // Complete performance monitoring with error
      this.performanceMonitor.completeAIOperation(operationId, false);
      
      aiLogger.backend.error('❌ Backend session query failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
        query: query.substring(0, 50) + '...'
      });
      
      throw new Error(`Backend session processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get authentication token
   */
  private async getAuthToken(): Promise<string> {
    if (!this.config.enableAuth) {
      return '';
    }
    
    // Check cached token
    if (this.tokenCache && Date.now() < this.tokenExpiry) {
      return this.tokenCache;
    }
    
    try {
      // Get token from Supabase
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        aiLogger.backend.warn('⚠️ Auth session error', { error: error.message });
        return '';
      }
      
      if (session?.access_token) {
        this.tokenCache = session.access_token;
        this.tokenExpiry = Date.now() + ((session.expires_in || 3600) * 1000);
        return this.tokenCache;
      }
      
      // No session available, continue without auth
      aiLogger.backend.debug('🔓 No auth session available, continuing without authentication');
      return '';
      
    } catch (error) {
      aiLogger.backend.error('❌ Failed to get auth token', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return '';
    }
  }

  /**
   * Get current user ID
   */
  private async getCurrentUserId(): Promise<string> {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || `guest_${Date.now()}`;
    } catch (error) {
      return `guest_${Date.now()}`;
    }
  }

  /**
   * Make backend API request with retry logic
   */
  private async makeBackendRequest(
    endpoint: string, 
    data: BackendAIRequest
  ): Promise<BackendAIResponse> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const authToken = await this.getAuthToken();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        
        const response = await fetch(`${this.config.baseURL}${endpoint}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Backend API error: ${response.status} - ${errorText}`);
        }
        
        const responseData = await response.json();
        return responseData;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        aiLogger.backend.warn(`⚠️ Backend request attempt ${attempt} failed`, {
          endpoint,
          error: lastError.message,
          attempt,
          maxAttempts: this.config.retryAttempts
        });
        
        // Wait before retry (exponential backoff)
        if (attempt < this.config.retryAttempts) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Backend request failed after all retry attempts');
  }

  /**
   * Transform backend response to frontend format
   */
  private transformBackendResponse(
    backendResponse: BackendAIResponse, 
    startTime: number
  ): AIResponse {
    const processingTime = performance.now() - startTime;
    
    return {
      content: backendResponse.message || 'No response from backend',
      type: backendResponse.type || 'text',
      confidence: backendResponse.confidence || 0.9,
      model: backendResponse.model || 'SELLY-Backend-AI',
      metadata: {
        ...backendResponse.metadata,
        source: 'backend-high-performance',
        workerType: backendResponse.workerType,
        backendProcessingTime: backendResponse.processingTime,
        totalProcessingTime: processingTime,
        sessionId: backendResponse.sessionId,
        provider: 'backend'
      }
    };
  }

  /**
   * Ensure backend health
   */
  private async ensureBackendHealth(): Promise<void> {
    const now = Date.now();
    
    // Skip health check if recently checked
    if (now - this.lastHealthCheck < this.HEALTH_CHECK_INTERVAL && this.isHealthy) {
      return;
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${this.config.baseURL}/api/performance/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      this.isHealthy = response.ok;
      this.lastHealthCheck = now;
      
      if (!this.isHealthy) {
        throw new Error(`Backend health check failed: ${response.status}`);
      }
      
    } catch (error) {
      this.isHealthy = false;
      this.lastHealthCheck = now;
      
      aiLogger.backend.error('❌ Backend health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        baseURL: this.config.baseURL
      });
      
      throw new Error(`Backend is not healthy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get backend health status
   */
  async getHealthStatus(): Promise<{ healthy: boolean; lastCheck: number }> {
    return {
      healthy: this.isHealthy,
      lastCheck: this.lastHealthCheck
    };
  }

  /**
   * Get provider capabilities
   */
  getCapabilities(): ProviderCapabilities {
    return this.capabilities;
  }
}
