/**
 * SELLY API Service - Unified Go Backend Integration
 * 
 * Provides consistent SELLY AI processing across all frontend interfaces
 * Integrates with Phase 1-2 Go backend infrastructure including:
 * - GroqSELLYProvider with persona integration
 * - Indonesian cultural processing
 * - Multi-level caching (Memory L1 + Upstash Redis L2)
 * - Training data collection pipeline
 */

export interface SellyApiContext {
  userId: string;
  timestamp: string;
  enhancedMode: boolean;
  source: 'dashboard' | 'selly-ai-page' | 'mobile-chat';
  sessionId: string;
  userAgent: string;
  metadata: {
    standalone: boolean;
    pageType: string;
    enhanced: boolean;
  };
}

export interface SellyApiResponse {
  success: boolean;
  response: string;
  metadata?: {
    personaApplied?: boolean;
    culturalContext?: any;
    processingTime?: number;
    provider?: string;
  };
  error?: string;
}

export class SellyApiService {
  private static readonly GO_BACKEND_URL = 'http://localhost:8080/chat';
  private static readonly REQUEST_TIMEOUT = 10000; // 10 seconds
  private static readonly MAX_RETRIES = 2;

  /**
   * Process message with SELLY AI using Go backend
   */
  static async processMessage(
    message: string, 
    context: Partial<SellyApiContext>
  ): Promise<string> {
    console.log('🚀 [SELLY_API] Processing message:', message.substring(0, 50) + '...');

    // Build enhanced context
    const enhancedContext = this.buildEnhancedContext(context);

    // Try Go backend with retries
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 [SELLY_API] Attempt ${attempt}/${this.MAX_RETRIES} - Go Backend API call...`);
        
        const response = await this.callGoBackend(message, enhancedContext);
        
        if (response.success && response.response) {
          console.log('✅ [SELLY_API] Go Backend API call successful');
          return response.response;
        }

        console.log(`⚠️ [SELLY_API] Attempt ${attempt} failed, trying again...`);
      } catch (error) {
        console.log(`⚠️ [SELLY_API] Attempt ${attempt} error:`, error);
        
        if (attempt === this.MAX_RETRIES) {
          break;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    // Fallback to intelligent Indonesian response
    console.log('🔄 [SELLY_API] Using intelligent Indonesian fallback...');
    return this.generateIntelligentFallback(message);
  }

  /**
   * Call Go backend API with timeout and error handling
   */
  private static async callGoBackend(
    message: string, 
    context: SellyApiContext
  ): Promise<SellyApiResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    try {
      const response = await fetch(this.GO_BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
          enhancementMode: context.enhancedMode ? 'enhanced' : 'standard',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Build enhanced context for consistent API calls
   */
  private static buildEnhancedContext(context: Partial<SellyApiContext>): SellyApiContext {
    const source = context.source || 'dashboard';
    const userId = context.userId || 'anonymous';
    
    return {
      userId,
      timestamp: new Date().toISOString(),
      enhancedMode: context.enhancedMode || false,
      source,
      sessionId: context.sessionId || `selly-${source}-${userId}`,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
      metadata: {
        standalone: true,
        pageType: source,
        enhanced: context.enhancedMode || false,
        ...context.metadata,
      },
    };
  }

  /**
   * Generate intelligent Indonesian fallback responses based on query analysis
   */
  private static generateIntelligentFallback(message: string): string {
    const lowerMessage = message.toLowerCase();

    // Greeting detection
    if (this.isGreeting(lowerMessage)) {
      return this.generateSellyGreeting();
    }

    // Service-specific responses
    if (lowerMessage.includes('ktp') || lowerMessage.includes('kartu tanda penduduk')) {
      return 'Halo! Saya SELLY dari Dinas Kependudukan Kabupaten Garut. Untuk informasi KTP, Anda bisa mengunjungi kantor dinas atau menggunakan layanan online kami. Ada yang bisa saya bantu terkait KTP?';
    }

    if (lowerMessage.includes('kk') || lowerMessage.includes('kartu keluarga')) {
      return 'Selamat datang! Saya SELLY, asisten AI untuk layanan kependudukan. Untuk urusan Kartu Keluarga, saya siap membantu memberikan informasi prosedur dan persyaratan yang diperlukan.';
    }

    if (lowerMessage.includes('akta') || lowerMessage.includes('kelahiran') || lowerMessage.includes('kematian')) {
      return 'Halo! Saya SELLY dari Dinas Kependudukan Kabupaten Garut. Untuk layanan akta sipil (kelahiran, kematian, perkawinan), saya dapat membantu menjelaskan prosedur dan persyaratan yang dibutuhkan.';
    }

    // General helpful response
    return 'Halo! Saya SELLY, asisten AI dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. Saya siap membantu Anda dengan informasi layanan administrasi kependudukan. Bagaimana saya bisa membantu Anda hari ini?';
  }

  /**
   * Detect greeting patterns
   */
  private static isGreeting(message: string): boolean {
    const greetingPatterns = [
      'halo', 'hai', 'hello', 'selamat', 'assalamualaikum', 'salam',
      'pagi', 'siang', 'sore', 'malam', 'apa kabar', 'hallo'
    ];
    
    return greetingPatterns.some(pattern => message.includes(pattern));
  }

  /**
   * Generate SELLY persona greeting
   */
  private static generateSellyGreeting(): string {
    const hour = new Date().getHours();
    let timeGreeting = '';

    if (hour >= 5 && hour < 12) {
      timeGreeting = 'Selamat pagi';
    } else if (hour >= 12 && hour < 17) {
      timeGreeting = 'Selamat siang';
    } else if (hour >= 17 && hour < 21) {
      timeGreeting = 'Selamat sore';
    } else {
      timeGreeting = 'Selamat malam';
    }

    return `${timeGreeting}! Saya SELLY, asisten AI dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. Saya di sini untuk membantu Anda dengan layanan administrasi kependudukan. Bagaimana saya bisa membantu Anda hari ini?`;
  }

  /**
   * Health check for Go backend availability
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('http://localhost:8080/health', {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('[SELLY_API] Health check failed:', error);
      return false;
    }
  }
}
