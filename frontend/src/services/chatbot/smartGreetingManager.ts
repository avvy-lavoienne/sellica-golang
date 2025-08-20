/**
 * Smart Greeting Manager
 * Phase 1: Foundation Enhancement - Intelligent Greeting Logic
 * 
 * Implements conversation-aware greeting system that prevents repetition
 * and provides personalized greetings using user profile data.
 * 
 * Created: 2025-08-13
 * Version: 1.0
 * Compliance: WCAG 2.1 AA, Indonesian Cultural Protocols
 */

import { EnhancedUserContext, EnhancedUserContextService } from './enhancedUserContextService';
import { SessionContinuityManager } from './sessionContinuityManager';

export interface SmartGreetingContext {
  isFirstInteraction: boolean;
  lastGreetingTime?: Date;
  conversationStage: 'new' | 'ongoing' | 'returning';
  userProfile?: {
    nama_lengkap: string;
    role: string;
  };
  sessionContinuity: boolean;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface SmartGreetingResponse {
  isGreeting: boolean;
  response?: string;
  type?: 'full_greeting' | 'acknowledgment' | 'continuation';
  shouldPreventRepetition?: boolean;
  metadata?: {
    personalized: boolean;
    culturalContext: string;
    greetingProtocol: string;
    confidence: number;
    continuityApplied?: boolean; // Phase 2: Session continuity indicator
  };
}

export interface GreetingVariation {
  template: string;
  context: string;
  formality: 'formal' | 'friendly' | 'casual';
  cultural: 'islamic' | 'general' | 'time_based';
}

/**
 * Smart Greeting Manager
 * Handles intelligent greeting logic with conversation awareness
 */
export class SmartGreetingManager {
  private userContextService: EnhancedUserContextService;
  private sessionContinuityManager: SessionContinuityManager;
  private greetingPatterns: RegExp[] = [];
  private greetingVariations: Map<string, GreetingVariation[]> = new Map();

  constructor() {
    this.userContextService = EnhancedUserContextService.getInstance();
    this.sessionContinuityManager = SessionContinuityManager.getInstance();
    this.initializeGreetingPatterns();
    this.initializeGreetingVariations();
  }

  /**
   * Process greeting query with intelligent context awareness and session continuity
   */
  public async processGreetingQuery(
    query: string,
    userId?: string,
    sessionId?: string
  ): Promise<SmartGreetingResponse> {
    try {
      // Check if this is actually a greeting
      if (!this.isGreeting(query)) {
        return { isGreeting: false };
      }

      // Phase 2: Check session continuity for intelligent greeting decisions
      let continuityDecision = null;
      if (sessionId) {
        try {
          continuityDecision = await this.sessionContinuityManager.analyzeContinuity(sessionId, userId);
        } catch (error) {
          console.warn('⚠️ [SMART_GREETING] Session continuity analysis failed:', error);
        }
      }

      // Get enhanced user context if available
      const userContext = userId
        ? await this.userContextService.getEnhancedUserContext(userId)
        : null;

      // Build greeting context with continuity awareness
      const greetingContext = this.buildGreetingContext(userContext, query, continuityDecision);

      // Phase 2: Use continuity decision to determine greeting approach
      if (continuityDecision) {
        if (!continuityDecision.shouldGreet || continuityDecision.greetingType === 'none') {
          return {
            isGreeting: true,
            response: continuityDecision.contextualOpener || 'Ada yang bisa dibantu?',
            type: 'continuation',
            shouldPreventRepetition: true,
            metadata: {
              personalized: !!userContext,
              culturalContext: 'session_continuity',
              greetingProtocol: 'continuation',
              confidence: 0.95,
              continuityApplied: true
            }
          };
        }

        if (continuityDecision.greetingType === 'acknowledgment' || continuityDecision.greetingType === 'brief') {
          return {
            isGreeting: true,
            response: continuityDecision.contextualOpener || await this.generateAcknowledgment(greetingContext, query),
            type: 'acknowledgment',
            shouldPreventRepetition: true,
            metadata: {
              personalized: !!userContext,
              culturalContext: greetingContext.userProfile ? 'indonesian_formal' : 'general',
              greetingProtocol: continuityDecision.greetingType,
              confidence: 0.90,
              continuityApplied: true
            }
          };
        }
      }

      // Determine if we should provide full greeting or acknowledgment (fallback logic)
      const shouldGreet = continuityDecision?.shouldGreet ?? this.shouldProvideFullGreeting(greetingContext);

      if (!shouldGreet) {
        // Return acknowledgment without full greeting
        return {
          isGreeting: true,
          response: await this.generateAcknowledgment(greetingContext, query),
          type: 'acknowledgment',
          shouldPreventRepetition: true,
          metadata: {
            personalized: !!userContext,
            culturalContext: greetingContext.userProfile ? 'indonesian_formal' : 'general',
            greetingProtocol: 'acknowledgment',
            confidence: 0.85
          }
        };
      }

      // Generate personalized greeting
      const greetingResponse = await this.generatePersonalizedGreeting(greetingContext, query);

      return {
        isGreeting: true,
        response: greetingResponse,
        type: 'full_greeting',
        shouldPreventRepetition: false,
        metadata: {
          personalized: !!userContext,
          culturalContext: userContext?.preferences.cultural_context || 'general',
          greetingProtocol: this.detectGreetingProtocol(query),
          confidence: 0.95,
          continuityApplied: !!continuityDecision
        }
      };

    } catch (error) {
      console.error('❌ [SMART_GREETING] Processing error:', error);

      // Fallback to simple greeting
      return {
        isGreeting: true,
        response: this.generateFallbackGreeting(query),
        type: 'full_greeting',
        metadata: {
          personalized: false,
          culturalContext: 'general',
          greetingProtocol: 'fallback',
          confidence: 0.7
        }
      };
    }
  }

  /**
   * Check if query is a greeting
   */
  private isGreeting(query: string): boolean {
    const normalizedQuery = query.toLowerCase().trim();
    return this.greetingPatterns.some(pattern => pattern.test(normalizedQuery));
  }

  /**
   * Build greeting context from user data with continuity awareness
   */
  private buildGreetingContext(
    userContext: EnhancedUserContext | null,
    query: string,
    continuityDecision?: any
  ): SmartGreetingContext {
    const timeOfDay = this.getTimeOfDay();

    return {
      isFirstInteraction: continuityDecision ?
        (continuityDecision.greetingType === 'full') :
        (userContext?.isFirstInteraction ?? true),
      lastGreetingTime: userContext?.lastInteraction,
      conversationStage: this.determineConversationStage(userContext),
      userProfile: userContext?.userProfile ? {
        nama_lengkap: userContext.userProfile.nama_lengkap,
        role: userContext.userProfile.role
      } : undefined,
      sessionContinuity: continuityDecision ?
        (continuityDecision.greetingType !== 'full') :
        (userContext?.sessionContinuity ?? false),
      timeOfDay
    };
  }

  /**
   * Determine if full greeting should be provided
   */
  private shouldProvideFullGreeting(context: SmartGreetingContext): boolean {
    // Always greet if first interaction
    if (context.isFirstInteraction) {
      return true;
    }

    // Don't repeat greeting if session is continuous
    if (context.sessionContinuity) {
      return false;
    }

    // Check time since last greeting
    if (context.lastGreetingTime) {
      const now = new Date();
      const hoursSinceLastGreeting = (now.getTime() - context.lastGreetingTime.getTime()) / (1000 * 60 * 60);
      
      // Greet if more than 4 hours since last interaction
      return hoursSinceLastGreeting > 4;
    }

    // Default to greeting for returning users
    return context.conversationStage === 'returning';
  }

  /**
   * Generate personalized greeting with user context
   */
  private async generatePersonalizedGreeting(
    context: SmartGreetingContext,
    query: string
  ): Promise<string> {
    const timeGreeting = this.getTimeGreeting(context.timeOfDay);
    const greetingEmoticon = this.getContextualEmoticon('greeting');

    // Personalized greeting with nama_lengkap
    if (context.userProfile?.nama_lengkap) {
      const name = context.userProfile.nama_lengkap;
      const role = context.userProfile.role;
      const address = this.getAppropriateAddress(role);
      const isReturningUser = context.conversationStage === 'returning';

      return this.generatePersonalizedGreetingContent(
        query,
        timeGreeting,
        name,
        address,
        isReturningUser,
        greetingEmoticon
      );
    }

    // Default greeting for guest users
    return this.generateDefaultGreeting(query, timeGreeting, greetingEmoticon);
  }

  /**
   * Generate personalized greeting content
   */
  private generatePersonalizedGreetingContent(
    query: string,
    timeGreeting: string,
    name: string,
    address: string,
    isReturningUser: boolean,
    emoticon: string
  ): string {
    // Islamic greeting response
    if (/assalamualaikum/i.test(query)) {
      const islamicResponse = isReturningUser
        ? `Wa'alaikumussalam warahmatullahi wabarakatuh, ${address} ${name}! ${emoticon}`
        : `Wa'alaikumussalam warahmatullahi wabarakatuh, ${address} ${name}! ${emoticon} ${timeGreeting}`;

      return `${islamicResponse}

${isReturningUser ? 'Senang bertemu lagi dengan' : 'Selamat datang kembali,'} ${address} ${name}! Saya SELLY dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut.

📋 **Mode Persyaratan**: Informasi lengkap persyaratan dokumen kependudukan
💡 **Mode Konsultasi**: Bantuan analisis dan solusi permasalahan data

Ada yang bisa SELLY bantu hari ini, ${address} ${name}?`;
    }

    // Casual greeting response
    if (/halo|hai|hello/i.test(query)) {
      return `Halo juga, ${address} ${name}! ${emoticon} ${timeGreeting}

${isReturningUser ? 'Senang bisa membantu lagi!' : 'Selamat datang!'} Saya SELLY, asisten AI untuk pelayanan administrasi kependudukan Kabupaten Garut.

📋 **Mode Persyaratan**: Tanyakan persyaratan dokumen apa saja
💡 **Mode Konsultasi**: Konsultasi permasalahan data kependudukan

Apa yang bisa SELLY bantu untuk ${address} ${name} hari ini?`;
    }

    // Time-based formal greeting
    return `${timeGreeting}, ${address} ${name}! ${emoticon}

${isReturningUser ? 'Senang bertemu kembali dengan' : 'Selamat datang,'} ${address} ${name}. Saya SELLY dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut.

SELLY siap membantu ${address} ${name} dengan:
📋 **Informasi Persyaratan** dokumen kependudukan
💡 **Konsultasi Permasalahan** data dan solusinya

Ada yang ingin ${address} ${name} tanyakan hari ini?`;
  }

  /**
   * Generate acknowledgment for ongoing conversations
   */
  private async generateAcknowledgment(
    context: SmartGreetingContext,
    query: string
  ): Promise<string> {
    const emoticon = this.getContextualEmoticon('acknowledgment');

    // Get user name, but treat "Pengguna" as no name (fallback case)
    const rawName = context.userProfile?.nama_lengkap;
    const hasRealName = rawName && rawName !== 'Pengguna' && rawName.trim() !== '';
    const name = hasRealName ? rawName : null;
    const address = hasRealName ? this.getAppropriateAddress(context.userProfile?.role) : 'kak';

    if (/assalamualaikum/i.test(query)) {
      return name
        ? `Wa'alaikumussalam, ${address} ${name}! ${emoticon} Saya SELLY siap membantu lagi. Ada yang ingin ditanyakan?

💡 **Tips**: Jangan ragu untuk bertanya apa saja tentang layanan kependudukan!`
        : `Wa'alaikumussalam ${address}! ${emoticon} Saya SELLY siap membantu. Ada yang bisa dibantu?

💡 **Tips**: Jangan ragu untuk bertanya apa saja tentang layanan kependudukan!`;
    }

    if (/halo|hai|hello/i.test(query)) {
      return name
        ? `Halo lagi, ${address} ${name}! ${emoticon} Saya SELLY siap membantu. Ada yang ingin ditanyakan?

💡 **Tips**: Jangan ragu untuk bertanya apa saja tentang layanan kependudukan!`
        : `Halo ${address}! ${emoticon} Saya SELLY siap membantu. Ada yang ingin ditanyakan?

💡 **Tips**: Jangan ragu untuk bertanya apa saja tentang layanan kependudukan!`;
    }

    return name
      ? `${address} ${name}, saya SELLY siap membantu lagi! ${emoticon} Ada yang ingin ditanyakan?

💡 **Tips**: Jangan ragu untuk bertanya apa saja tentang layanan kependudukan!`
      : `Halo ${address}! ${emoticon} Saya SELLY siap membantu. Ada yang ingin ditanyakan?

💡 **Tips**: Jangan ragu untuk bertanya apa saja tentang layanan kependudukan!`;
  }

  /**
   * Generate default greeting for guest users
   */
  private generateDefaultGreeting(query: string, timeGreeting: string, emoticon: string): string {
    if (/assalamualaikum/i.test(query)) {
      return `Wa'alaikumussalam warahmatullahi wabarakatuh! ${emoticon} ${timeGreeting}

Selamat datang! Saya SELLY dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut.

📋 **Mode Persyaratan**: Informasi persyaratan dokumen kependudukan
💡 **Mode Konsultasi**: Bantuan analisis dan solusi permasalahan

Ada yang bisa SELLY bantu hari ini?`;
    }

    if (/halo|hai|hello/i.test(query)) {
      return `Halo! ${emoticon} ${timeGreeting}

Selamat datang! Saya SELLY, asisten AI untuk pelayanan administrasi kependudukan Kabupaten Garut.

📋 **Mode Persyaratan**: Tanyakan persyaratan dokumen apa saja
💡 **Mode Konsultasi**: Konsultasi permasalahan data kependudukan

Apa yang bisa SELLY bantu hari ini?`;
    }

    return `${timeGreeting}! ${emoticon}

Selamat datang di layanan SELLY, asisten AI Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut.

SELLY siap membantu dengan:
📋 **Informasi Persyaratan** dokumen kependudukan
💡 **Konsultasi Permasalahan** data dan solusinya

Ada yang ingin ditanyakan hari ini?`;
  }

  /**
   * Generate fallback greeting for error cases
   */
  private generateFallbackGreeting(query: string): string {
    const emoticon = this.getContextualEmoticon('greeting');
    
    if (/assalamualaikum/i.test(query)) {
      return `Wa'alaikumussalam! ${emoticon} Selamat datang di SELLY. Ada yang bisa dibantu?`;
    }

    return `Halo! ${emoticon} Selamat datang di SELLY. Ada yang bisa dibantu hari ini?`;
  }

  /**
   * Get appropriate address based on user role
   */
  private getAppropriateAddress(role?: string): string {
    if (!role) return 'kak';

    switch (role.toLowerCase()) {
      case 'admin':
      case 'supervisor':
      case 'manager':
        return 'Bapak/Ibu';
      case 'staff':
      case 'operator':
        return 'kak';
      default:
        return 'kak';
    }
  }

  /**
   * Get time-based greeting
   */
  private getTimeGreeting(timeOfDay: string): string {
    switch (timeOfDay) {
      case 'morning': return 'Selamat pagi';
      case 'afternoon': return 'Selamat siang';
      case 'evening': return 'Selamat sore';
      case 'night': return 'Selamat malam';
      default: return 'Selamat datang';
    }
  }

  /**
   * Get current time of day
   */
  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 15) return 'afternoon';
    if (hour >= 15 && hour < 19) return 'evening';
    return 'night';
  }

  /**
   * Get contextual emoticon
   */
  private getContextualEmoticon(context: 'greeting' | 'acknowledgment'): string {
    const greetingEmoticons = ['😊', '🙏', '✨', '🌟'];
    const acknowledgmentEmoticons = ['😊', '👍', '✨'];
    
    const emoticons = context === 'greeting' ? greetingEmoticons : acknowledgmentEmoticons;
    return emoticons[Math.floor(Math.random() * emoticons.length)];
  }

  /**
   * Determine conversation stage
   */
  private determineConversationStage(userContext: EnhancedUserContext | null): 'new' | 'ongoing' | 'returning' {
    if (!userContext) return 'new';
    
    if (userContext.isFirstInteraction) return 'new';
    if (userContext.sessionContinuity) return 'ongoing';
    return 'returning';
  }

  /**
   * Detect greeting protocol from query
   */
  private detectGreetingProtocol(query: string): string {
    if (/assalamualaikum/i.test(query)) return 'islamic';
    if (/halo|hai|hello/i.test(query)) return 'casual';
    if (/selamat/i.test(query)) return 'formal';
    return 'general';
  }

  /**
   * Initialize greeting patterns
   */
  private initializeGreetingPatterns(): void {
    this.greetingPatterns = [
      /^(halo|hai|hello)(\s+selly)?$/i,
      /^selamat\s+(pagi|siang|sore|malam)(\s+selly)?$/i,
      /^assalamualaikum(\s+selly)?$/i,
      /^(hi|hey)(\s+selly)?$/i,
      /^good\s+(morning|afternoon|evening|night)(\s+selly)?$/i,
      /^salam(\s+selly)?$/i,
      /^(permisi|excuse\s+me)(\s+selly)?$/i
    ];
  }

  /**
   * Initialize greeting variations
   */
  private initializeGreetingVariations(): void {
    this.greetingVariations = new Map();
    // Implementation for greeting variations can be added here
  }
}
