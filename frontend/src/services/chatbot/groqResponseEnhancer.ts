/**
 * Groq API Response Enhancer
 * Fast alternative to DeepSeek with 0.5-2 second response times
 */

interface GroqConfig {
  apiKey: string;
  model: string;
  timeout: number;
  temperature: number;
  maxTokens: number;
}

interface GroqResponse {
  success: boolean;
  originalResponse: string;
  enhancedResponse: string;
  enhancementMetadata: {
    enhanced: boolean;
    processingTime: number;
    confidence: number;
    model: string;
    fallbackUsed: boolean;
  };
}

export class GroqResponseEnhancer {
  private config: GroqConfig;

  constructor() {
    this.config = {
      apiKey: process.env.GROQ_API_KEY || '',
      model: process.env.GROQ_MODEL || 'mixtral-8x7b-32768',
      timeout: parseInt(process.env.GROQ_TIMEOUT || '5000'), // 5 seconds max
      temperature: parseFloat(process.env.GROQ_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.GROQ_MAX_TOKENS || '1000')
    };
  }

  /**
   * Check if Groq enhancement is enabled and configured
   */
  isEnabled(): boolean {
    return !!(
      process.env.NEXT_PUBLIC_ENABLE_GROQ_ENHANCEMENT === 'true' &&
      this.config.apiKey
    );
  }

  /**
   * Check if response should be enhanced (Smart Enhancement criteria)
   */
  private shouldEnhanceResponse(response: any): boolean {
    // Only enhance responses that have substantial content from training material
    const content = response.content || '';

    // Skip enhancement for very short responses
    if (content.length < 100) return false;

    // Skip if response is already very natural (contains multiple casual indicators)
    const casualIndicators = [
      content.includes('kak') && content.includes('😊'),
      content.includes('ya!') || content.includes('nih'),
      content.includes('🎯') && content.includes('💡'),
      /halo\s+kak/i.test(content)
    ];
    const casualCount = casualIndicators.filter(Boolean).length;
    if (casualCount >= 2) return false;

    // Enhance if response contains formal administrative language that could be improved
    const formalPatterns = /prosedur|persyaratan|dokumen|administrasi|pelayanan|formulir|berkas|kelengkapan/i;
    const hasFormality = formalPatterns.test(content);

    // Also enhance if response is very long and structured (like comprehensive guides)
    const isLongStructured = content.length > 500 && (content.includes('###') || content.includes('**') || content.includes('•'));

    return hasFormality || isLongStructured;
  }

  /**
   * Enhance response using Groq API (Smart Enhancement)
   */
  async enhanceResponse(response: any): Promise<GroqResponse> {
    const startTime = Date.now();

    try {
      if (!this.isEnabled()) {
        return this.createFallbackResponse(response, 'Groq enhancement disabled');
      }

      // Check if response should be enhanced
      if (!this.shouldEnhanceResponse(response)) {
        console.log('ℹ️ [GROQ] Response doesn\'t need enhancement, using original');
        return this.createFallbackResponse(response, 'Enhancement not needed');
      }

      console.log('🚀 [GROQ] Smart Enhancement: Polishing training material response...');

      const enhancedContent = await this.callGroqAPI(response.content);
      const processingTime = Date.now() - startTime;

      console.log(`✅ [GROQ] Enhancement completed in ${processingTime}ms`);

      return {
        success: true,
        originalResponse: response.content,
        enhancedResponse: enhancedContent,
        enhancementMetadata: {
          enhanced: true,
          processingTime,
          confidence: 0.9,
          model: this.config.model,
          fallbackUsed: false
        }
      };

    } catch (error) {
      console.error('❌ [GROQ] Enhancement failed:', error);
      const processingTime = Date.now() - startTime;
      
      return this.createFallbackResponse(response, `Groq API error: ${error}`, processingTime);
    }
  }

  /**
   * Call Groq API with timeout and content optimization for Smart Enhancement
   */
  private async callGroqAPI(content: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      // Optimize content length for Groq API
      const optimizedContent = this.optimizeContentForGroq(content);

      // Smart Enhancement Prompt: Polish existing knowledge, don't replace it
      const enhancementPrompt = `Sebagai asisten AI untuk Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut, tolong perbaiki dan tingkatkan kualitas respons berikut agar lebih natural, ramah, dan mudah dipahami. PENTING: Jangan mengubah informasi faktual atau prosedur yang sudah benar, hanya perbaiki cara penyampaiannya.

Respons asli:
${optimizedContent}

Perbaiki respons di atas dengan:
1. Bahasa yang lebih natural dan ramah
2. Struktur yang lebih jelas dan mudah dibaca
3. Tetap mempertahankan semua informasi penting
4. Gunakan emoticon yang sesuai
5. Pastikan tetap profesional namun bersahabat

Respons yang diperbaiki:`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: 'Anda adalah SELLY, asisten AI untuk Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. Tugas Anda adalah memperbaiki kualitas respons yang sudah ada tanpa mengubah informasi faktual. Fokus pada: 1) Bahasa yang lebih natural dan ramah, 2) Struktur yang jelas, 3) Tetap profesional namun bersahabat, 4) Pertahankan semua prosedur dan informasi penting.'
            },
            {
              role: 'user',
              content: enhancementPrompt
            }
          ],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Get detailed error information
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = JSON.stringify(errorData, null, 2);
        } catch (e) {
          errorDetails = await response.text();
        }

        console.error('🚨 [GROQ] Detailed API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorDetails
        });

        throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorDetails}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid Groq API response format');
      }

      return data.choices[0].message.content;

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Optimize content length for Groq API (max ~4000 characters)
   */
  private optimizeContentForGroq(content: string): string {
    const maxLength = 4000;

    if (content.length <= maxLength) {
      return content;
    }

    // Try to truncate at natural break points
    const truncated = content.substring(0, maxLength);
    const lastParagraph = truncated.lastIndexOf('\n\n');
    const lastSentence = truncated.lastIndexOf('.');
    const lastLine = truncated.lastIndexOf('\n');

    // Choose best truncation point
    let cutPoint = maxLength;
    if (lastParagraph > maxLength * 0.7) {
      cutPoint = lastParagraph;
    } else if (lastSentence > maxLength * 0.8) {
      cutPoint = lastSentence + 1;
    } else if (lastLine > maxLength * 0.9) {
      cutPoint = lastLine;
    }

    return content.substring(0, cutPoint) + '\n\n[Respons dipotong untuk optimasi...]';
  }

  /**
   * Create fallback response when enhancement fails
   */
  private createFallbackResponse(
    response: any,
    _reason: string,
    processingTime: number = 0
  ): GroqResponse {
    return {
      success: false,
      originalResponse: response.content,
      enhancedResponse: response.content,
      enhancementMetadata: {
        enhanced: false,
        processingTime,
        confidence: 0.8,
        model: 'fallback',
        fallbackUsed: true
      }
    };
  }

  /**
   * Get configuration status
   */
  getStatus() {
    return {
      enabled: this.isEnabled(),
      apiKeyConfigured: !!this.config.apiKey,
      model: this.config.model,
      timeout: this.config.timeout,
      expectedResponseTime: '0.5-2 seconds'
    };
  }
}

// Export singleton instance
export const groqResponseEnhancer = new GroqResponseEnhancer();
