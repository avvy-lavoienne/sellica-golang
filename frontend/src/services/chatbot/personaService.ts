/**
 * SELLY Persona Service
 * Implements the comprehensive persona framework for civil registration AI agent
 * Based on docs/selly-personas/ specifications
 */

// DISABLED FOR CORE BUILD
// // DISABLED FOR CORE BUILD
// import { getTrainingDataCollector } from '../../../selly-legacy-nextjs-backend/business-logic/training/trainingDataCollector';
import { KnowledgeService } from './knowledgeService';
import { AdministrativeResponseCache } from './administrativeResponseCache';
import { SmartGreetingManager } from './smartGreetingManager';

export interface PersonaConfig {
  identity: {
    name: string;
    role: string;
    institution: string;
    developer: string;
  };
  personality: {
    traits: string[];
    values: string[];
    communicationStyle: 'formal-friendly' | 'professional' | 'warm-professional';
  };
  knowledge: {
    domains: string[];
    specializations: string[];
    limitations: string[];
  };
  behavioral: {
    greetingProtocols: GreetingProtocol[];
    escalationRules: EscalationRule[];
    culturalSensitivity: CulturalRule[];
  };
}

export interface GreetingProtocol {
  timeRange: string;
  template: string;
  tone: string;
  context: string;
}

export interface EscalationRule {
  trigger: string;
  level: number;
  action: string;
  message: string;
}

export interface CulturalRule {
  pattern: string;
  response: string;
  context: string;
}

export interface ConversationContext {
  isFirstInteraction: boolean;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  userGreeting?: string;
  previousInteractions: number;
  currentTopic?: string;
  userId?: string;
  sessionId?: string; // Phase 2: Added for session continuity
  conversationLength?: 'short' | 'medium' | 'long';
  userTone?: 'formal' | 'casual' | 'friendly';
}

export interface PersonaEnhancedResponse {
  content: string;
  type: 'text' | 'greeting' | 'information' | 'escalation';
  metadata: {
    personaApplied: boolean;
    greetingProtocolUsed?: string;
    culturalSensitivityApplied?: boolean;
    escalationTriggered?: boolean;
    fallbackUsed?: boolean;
    trainingNeeded?: boolean;
    trainingQueryId?: string;
    knowledgeUsed?: boolean;
    serviceType?: string;
    confidence: number;
  };
}

export class PersonaService {
  private config?: PersonaConfig;
  private knowledgeService?: KnowledgeService;
  private administrativeCache?: AdministrativeResponseCache;
  private smartGreetingManager?: SmartGreetingManager;

  constructor() {
    // Lazy-load dependencies to prevent circular references
  }

  /**
   * Initialize PersonaService dependencies (lazy-loaded)
   */
  private async initializeDependencies(): Promise<void> {
    if (!this.config) {
      this.config = this.loadPersonaConfig();
    }
    if (!this.knowledgeService) {
      this.knowledgeService = KnowledgeService.getInstance();
    }
    if (!this.administrativeCache) {
      this.administrativeCache = AdministrativeResponseCache.getInstance();
    }
    if (!this.smartGreetingManager) {
      this.smartGreetingManager = new SmartGreetingManager();
    }
  }

  /**
   * Load SELLY persona configuration
   */
  private loadPersonaConfig(): PersonaConfig {
    return {
      identity: {
        name: "SELLY",
        role: "AI Agent Specialist Pelayanan Publik",
        institution: "Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut",
        developer: "VyuApp Technology Solutions"
      },
      personality: {
        traits: ["profesional", "empati", "responsif", "budaya-lokal"],
        values: ["integritas", "akuntabilitas", "inovasi", "inklusivitas"],
        communicationStyle: "formal-friendly"
      },
      knowledge: {
        domains: ["KTP", "KK", "akta-kelahiran", "akta-kematian", "akta-perkawinan", "pindah-datang"],
        specializations: ["administrasi-kependudukan", "pelayanan-publik", "regulasi-pemerintah"],
        limitations: ["tidak-dapat-memproses-dokumen", "tidak-dapat-mengubah-data", "tidak-dapat-memberikan-keputusan-final"]
      },
      behavioral: {
        greetingProtocols: this.loadGreetingProtocols(),
        escalationRules: this.loadEscalationRules(),
        culturalSensitivity: this.loadCulturalRules()
      }
    };
  }

  /**
   * Load greeting protocols from training data
   */
  private loadGreetingProtocols(): GreetingProtocol[] {
    return [
      {
        timeRange: "05:00-11:59",
        template: "Selamat pagi juga, Bapak/Ibu! Semoga hari ini menjadi hari yang produktif. Saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. Bagaimana saya bisa membantu Anda dengan layanan administrasi kependudukan? SELLY dapat memberikan informasi terkait dengan Persyaratan Pengajuan Dokumen Kependudukan atau mungkin ingin berkonsultasi terkait data kependudukan mungkin SELLY bisa membantu Bapak/Ibu",
        tone: "formal-friendly",
        context: "morning_greeting"
      },
      {
        timeRange: "12:00-14:59",
        template: "Selamat siang, Bapak/Ibu! Saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. Saya siap membantu Anda dengan informasi dan panduan layanan administrasi. SELLY dapat memberikan informasi terkait dengan Persyaratan Pengajuan Dokumen Kependudukan atau mungkin ingin berkonsultasi terkait data kependudukan mungkin SELLY bisa membantu Bapak/Ibu",
        tone: "professional-helpful",
        context: "afternoon_greeting"
      },
      {
        timeRange: "15:00-18:59",
        template: "Selamat sore, Bapak/Ibu! Saya SELLY AI Assistant untuk layanan kependudukan Kabupaten Garut. Meskipun hari sudah sore, saya tetap siap membantu Anda 24 jam. SELLY dapat memberikan informasi terkait dengan Persyaratan Pengajuan Dokumen Kependudukan atau mungkin ingin berkonsultasi terkait data kependudukan mungkin SELLY bisa membantu Bapak/Ibu",
        tone: "reassuring-professional",
        context: "evening_greeting"
      },
      {
        timeRange: "19:00-04:59",
        template: "Selamat malam, Bapak/Ibu! Saya SELLY AI Assistant dari Dinas Kependudukan Kabupaten Garut. Walaupun kantor sudah tutup, saya tetap tersedia untuk memberikan informasi dan panduan. SELLY dapat memberikan informasi terkait dengan Persyaratan Pengajuan Dokumen Kependudukan atau mungkin ingin berkonsultasi terkait data kependudukan mungkin SELLY bisa membantu Bapak/Ibu",
        tone: "available-professional",
        context: "night_greeting"
      }
    ];
  }

  /**
   * Load escalation rules
   */
  private loadEscalationRules(): EscalationRule[] {
    return [
      {
        trigger: "complex_case",
        level: 1,
        action: "provide_contact_info",
        message: "Untuk kasus seperti ini, saya sarankan Anda menghubungi bagian informasi di nomor (0262) 232XXX untuk mendapat panduan lebih detail."
      },
      {
        trigger: "formal_complaint",
        level: 2,
        action: "escalate_to_specialist",
        message: "Situasi Anda memerlukan konsultasi dengan petugas spesialis. Silakan hubungi bagian pelayanan di (0262) 232XXX untuk penanganan lebih lanjut."
      },
      {
        trigger: "urgent_case",
        level: 3,
        action: "escalate_to_supervisor",
        message: "Mengingat kompleksitas kasus Anda, saya merekomendasikan untuk berbicara langsung dengan supervisor kami. Silakan datang langsung ke kantor pada jam 08:00-15:00 WIB."
      }
    ];
  }

  /**
   * Load cultural sensitivity rules
   */
  private loadCulturalRules(): CulturalRule[] {
    return [
      {
        pattern: "assalamualaikum",
        response: "Waalaikumsalam warahmatullahi wabarakatuh, Bapak/Ibu. Selamat {time}. Saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. SELLY dapat memberikan informasi terkait dengan Persyaratan Pengajuan Dokumen Kependudukan atau mungkin ingin berkonsultasi terkait data kependudukan mungkin SELLY bisa membantu Bapak/Ibu",
        context: "islamic_greeting"
      },
      {
        pattern: "halo|hai|hello",
        response: "Halo juga, Bapak/Ibu! Selamat {time}. Saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. SELLY dapat memberikan informasi terkait dengan Persyaratan Pengajuan Dokumen Kependudukan atau mungkin ingin berkonsultasi terkait data kependudukan mungkin SELLY bisa membantu Bapak/Ibu",
        context: "casual_greeting"
      }
    ];
  }

  /**
   * Main method to apply persona to any response
   */
  public async applyPersona(
    originalResponse: string,
    query: string,
    context: ConversationContext
  ): Promise<PersonaEnhancedResponse> {

    // Initialize dependencies if needed
    this.initializeDependencies().catch(error => {
      console.warn('⚠️ [PERSONA_SERVICE] Dependency initialization failed:', error);
    });

    // Performance Optimization: Check administrative cache first
    this.checkAdministrativeCacheAsync(query, context);

    // Check if this is a greeting
    if (this.isGreeting(query)) {
      return await this.handleGreeting(query, context);
    }

    // Check if this is a service request that needs proper handling
    if (this.isServiceRequest(query)) {
      return await this.handleServiceRequest(query, originalResponse, context);
    }

    // Apply persona characteristics to existing response
    const enhancedResponse = this.enhanceWithPersona(originalResponse, context);

    // Apply response variation for natural conversation
    const variedResponse = this.generateResponseVariation(enhancedResponse, context);

    return {
      content: variedResponse,
      type: 'text',
      metadata: {
        personaApplied: true,
        confidence: 0.9
      }
    };
  }

  /**
   * Check if query is a greeting
   */
  private isGreeting(query: string): boolean {
    const greetingPatterns = [
      /^(halo|hai|hello)(\s+selly)?$/i,  // "halo", "hai", "hello", optionally with "selly"
      /^selamat (pagi|siang|sore|malam)(\s+selly)?$/i,  // Time-based greetings, optionally with "selly"
      /^assalamualaikum(\s+selly)?$/i,  // Islamic greeting, optionally with "selly"
      /^(halo|hai|hello)\s+(kak|kakak|selly)$/i,  // Casual greetings with address
      /^selly$/i  // Just "selly" alone
    ];

    // Additional check: if query contains service keywords, it's NOT a greeting
    const serviceKeywords = /\b(buat|bikin|mau|ingin|butuh|perlu|syarat|persyaratan|cetak|daftar|ajukan|pengajuan|ktp|kk|akta|surat|dokumen|berkas)\b/i;

    if (serviceKeywords.test(query)) {
      return false;
    }

    return greetingPatterns.some(pattern => pattern.test(query.trim()));
  }

  /**
   * Check if query is a service request
   */
  private isServiceRequest(query: string): boolean {
    const servicePatterns = [
      /mengajukan|ajukan|buat|bikin|membuat|pencetakan|cetak/i,
      /akta|ktp|kartu keluarga|kk|e-ktp|ktp-el/i,
      /kartu kuning|kartu kerja|work permit/i,
      /kartu identitas anak|kia/i,
      /kelahiran|kematian|perkawinan|perceraian/i,
      /pengakuan anak|pengesahan anak/i,
      /pindah|domisili|alamat|skpwni|skdwni/i,
      /biodata penduduk|biodata/i,
      /kutipan akta|duplikat|salinan akta/i,
      /legalisir|pengesahan/i,
      /syarat|persyaratan|cara|prosedur/i,
      /berapa lama|waktu|proses/i,
      /biaya|tarif|gratis/i,
      /hilang|kehilangan|rusak|ganti|penggantian/i,
      // KTP specific patterns
      /syarat.*ktp|persyaratan.*ktp|cara.*ktp|prosedur.*ktp/i,
      /dokumen.*ktp|bikin.*ktp|buat.*ktp|membuat.*ktp|mengurus.*ktp/i,
      /pengurusan.*ktp|cetak.*ktp|pembuatan.*ktp/i,
      /kartu tanda penduduk|ktp.*elektronik|ktp-el/i,
      // Casual KTP expressions
      /mau.*buat.*ktp|mau.*bikin.*ktp|mau.*membuat.*ktp|mau.*mengurus.*ktp/i,
      /pengen.*ktp|butuh.*ktp/i,
      // Conditional and question patterns
      /kalau.*ktp|kalo.*ktp|gimana.*ktp|bagaimana.*ktp/i,
      // Formal inquiry patterns - FIXED for flexible matching
      /saya.*ingin.*mengetahui.*ktp|saya.*ingin.*tahu.*ktp|ingin.*mengetahui.*ktp|ingin.*tahu.*ktp/i,
      /saya.*ingin.*mengetahui.*persyaratan.*cetak.*ktp|saya.*ingin.*tahu.*persyaratan.*cetak.*ktp/i,
      /mohon.*informasi.*ktp|persyaratan.*cetak.*ktp|syarat.*cetak.*ktp/i,
      /persyaratan.*untuk.*ktp|syarat.*untuk.*ktp/i,
      // Enhanced KTP patterns (20 additional variations)
      /bagaimana cara bikin ktp.*dokumen|syarat.*dibutuhkan.*cetak.*ktp-el/i,
      /persyaratan.*pengurusan.*ktp.*disdukcapil|dokumen.*harus dibawa.*membuat.*ktp/i,
      /ketentuan syarat.*pembuatan.*ktp|apa.*diperlukan.*mengurus.*kartu tanda penduduk/i,
      /syarat.*bikin.*ktp.*disdukcapil|dokumen.*diperlukan.*cetak.*ktp baru/i,
      /persyaratan.*mendapatkan.*ktp elektronik|dokumen.*dibutuhkan.*mengurus.*ktp/i,
      /syarat.*pembuatan.*ktp baru.*disdukcapil|apa.*harus dipenuhi.*cetak.*kartu tanda penduduk/i,
      /cara mengurus ktp.*syarat.*dibutuhkan|dokumen.*diperlukan.*bikin.*ktp-el/i,
      /syarat.*harus disiapkan.*ktp baru|persyaratan.*membuat.*kartu tanda penduduk/i,
      /syarat.*pengurusan.*ktp.*kantor disdukcapil|dokumen.*harus disiapkan.*cetak.*ktp/i,
      /apa.*dibutuhkan.*pembuatan.*ktp elektronik baru|syarat.*diperlukan.*mengurus.*ktp.*disdukcapil/i,
      // Complete service overview patterns
      /dokumen apa saja yang dilayani|dokumen apa saja|layanan apa saja|pelayanan apa saja/i,
      /jenis dokumen apa|dokumen apa yang bisa diurus/i,
      /pembuatan dokumen apa saja|melayani pembuatan dokumen/i,
      /disdukcapil melayani|bisa membuat dokumen apa|bisa bikin dokumen apa/i,
      /dokumen kependudukan.*diterbitkan|jenis dokumen.*diurus|layanan.*dokumen kependudukan/i,
      /dokumen resmi.*dibuat|akta.*dokumen.*dikeluarkan|administrasi kependudukan/i,
      /layanan pembuatan akta|dokumen.*diperoleh|jenis dokumen.*ditangani/i,
      /daftar lengkap|semua layanan|semua dokumen/i,
      /disdukcapil|dinas kependudukan|pencatatan sipil|dukcapil|catatan sipil/i
    ];

    return servicePatterns.some(pattern => pattern.test(query));
  }

  /**
   * Handle service requests with proper fallback when not trained
   */
  private async handleServiceRequest(
    query: string,
    originalResponse: string,
    context: ConversationContext
  ): Promise<PersonaEnhancedResponse> {

    // First, check if we have knowledge about this service
    const serviceInfo = this.knowledgeService?.getServiceInfo(query);

    if (serviceInfo && this.knowledgeService) {
      // We have specific knowledge, provide detailed response
      const knowledgeResponse = this.knowledgeService.formatServiceResponse(serviceInfo);

      // Handle string responses (like KTP scenarios) - return directly
      if (typeof serviceInfo === 'string') {
        return {
          content: knowledgeResponse,
          type: 'information',
          metadata: {
            personaApplied: true,
            knowledgeUsed: true,
            serviceType: 'Direct Response',
            confidence: 1.0
          }
        };
      }

      // For interactive assessments, return the response directly without duplicate greeting
      if (serviceInfo.serviceCode.includes('ASSESS')) {
        return {
          content: knowledgeResponse,
          type: 'information',
          metadata: {
            personaApplied: true,
            knowledgeUsed: true,
            serviceType: serviceInfo.serviceType,
            confidence: 1.0
          }
        };
      } else {
        // Check if the knowledge response already includes SELLY introduction
        const alreadyHasIntroduction = knowledgeResponse.includes('Saya SELLY AI Assistant');

        let finalResponse: string;
        if (alreadyHasIntroduction) {
          // Knowledge service already added introduction (e.g., for services with variations)
          finalResponse = knowledgeResponse;
        } else {
          // For regular services, add institutional context
          finalResponse = `Saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. Saya dapat membantu Anda dengan informasi ${serviceInfo.serviceType.toLowerCase()}.

${knowledgeResponse}`;
        }

        return {
          content: finalResponse,
          type: 'information',
          metadata: {
            personaApplied: true,
            knowledgeUsed: true,
            serviceType: serviceInfo.serviceCode,
            confidence: 0.95
          }
        };
      }
    }

    // Check if the original response looks like a generic AI response
    const isGenericResponse = this.isGenericAIResponse(originalResponse);

    if (isGenericResponse) {
      // Log this query for training purposes
      const serviceType = this.identifyServiceType(query);
      const trainingCollector = await getTrainingDataCollector();
      const queryId = trainingCollector.logUnansweredQuery(
        query,
        serviceType,
        originalResponse,
        {
          userId: context.userId,
          timeOfDay: context.timeOfDay,
          isFirstInteraction: context.isFirstInteraction,
          previousMessages: [] // Could be enhanced to include conversation history
        }
      );

      // Provide proper fallback response
      const fallbackResponse = this.generateServiceFallbackResponse(query);

      return {
        content: fallbackResponse,
        type: 'information',
        metadata: {
          personaApplied: true,
          fallbackUsed: true,
          trainingNeeded: true,
          trainingQueryId: queryId,
          confidence: 0.8
        }
      };
    }

    // If we have a good response, enhance it with persona
    const enhancedResponse = this.enhanceWithPersona(originalResponse, context);

    return {
      content: enhancedResponse,
      type: 'information',
      metadata: {
        personaApplied: true,
        confidence: 0.9
      }
    };
  }

  /**
   * Check if response is a generic AI response that needs fallback
   */
  private isGenericAIResponse(response: string): boolean {
    const genericIndicators = [
      // IndoBERT-specific responses
      /telah selesai memproses teks/i,
      /menggunakan IndoBERT/i,
      /model bahasa/i,
      /analisis ini menggunakan/i,
      /indobert-/i,

      // Generic AI assistant responses
      /jika anda membutuhkan bantuan lebih lanjut/i,
      /silakan beritahu saya/i,
      /maaf, sepertinya anda belum memberikan/i,
      /tolong berikan kalimat yang ingin/i,
      /sehingga saya dapat membantu anda dengan lebih efektif/i,
      /belum memberikan kalimat lengkap/i,
      /topik yang ingin dibahas/i,

      // Other generic patterns
      /saya adalah asisten AI/i,
      /sebagai AI assistant/i,
      /maaf, saya tidak memahami/i,
      /bisakah anda menjelaskan lebih detail/i,
      /pertanyaan anda kurang jelas/i
    ];

    return genericIndicators.some(pattern => pattern.test(response));
  }

  /**
   * Generate appropriate fallback response for service requests
   */
  private generateServiceFallbackResponse(query: string): string {
    const serviceType = this.identifyServiceType(query);
    const thinkingEmoticon = this.getContextualEmoticon('thinking');
    const processingEmoticon = this.getContextualEmoticon('processing');

    return `Mohon maaf, kak ${thinkingEmoticon} Saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut.

Saat ini saya masih dalam tahap pembelajaran untuk layanan ${serviceType} yang kak tanyakan. Pertanyaan kak sangat penting dan akan saya catat untuk meningkatkan kemampuan saya.

${processingEmoticon} **Yang sedang saya lakukan:**
• Mencatat pertanyaan kak ke database pembelajaran
• Melaporkan ke tim pengembang untuk pelatihan lebih lanjut
• Memastikan saya dapat memberikan jawaban yang akurat di masa depan

📞 **Untuk bantuan segera, silakan hubungi:**
**WhatsApp: +62-851-8304-3205**

Tim pelayanan kami akan dengan senang hati membantu kak dengan informasi lengkap mengenai ${serviceType}.

Terima kasih atas kesabaran kak. Saya terus belajar untuk melayani masyarakat Kabupaten Garut dengan lebih baik 😊`;
  }

  /**
   * Identify the type of service being requested
   */
  private identifyServiceType(query: string): string {
    const serviceTypes = {
      'layanan lengkap Disdukcapil': /dokumen apa saja yang dilayani|dokumen apa saja|layanan apa saja|pelayanan apa saja|jenis dokumen apa|dokumen apa yang bisa diurus|pembuatan dokumen apa saja|melayani pembuatan dokumen|disdukcapil melayani|bisa membuat dokumen apa|bisa bikin dokumen apa|dokumen kependudukan.*diterbitkan|jenis dokumen.*diurus|layanan.*dokumen kependudukan|dokumen resmi.*dibuat|akta.*dokumen.*dikeluarkan|administrasi kependudukan|layanan pembuatan akta|dokumen.*diperoleh|jenis dokumen.*ditangani|daftar lengkap|semua layanan|semua dokumen|disdukcapil|dinas kependudukan|pencatatan sipil|dukcapil|catatan sipil/i,
      'KTP Interactive Assessment': /syarat.*ktp|persyaratan.*ktp|cara.*ktp|prosedur.*ktp|dokumen.*ktp|bikin.*ktp|buat.*ktp|membuat.*ktp|mengurus.*ktp|pengurusan.*ktp|cetak.*ktp|pembuatan.*ktp|kartu tanda penduduk|ktp.*elektronik|ktp.*baru|ktp-el|mau.*buat.*ktp|mau.*bikin.*ktp|mau.*membuat.*ktp|mau.*mengurus.*ktp|pengen.*ktp|butuh.*ktp|kalau.*ktp|kalo.*ktp|gimana.*ktp|bagaimana.*ktp|saya.*ingin.*mengetahui.*ktp|saya.*ingin.*tahu.*ktp|ingin.*mengetahui.*ktp|ingin.*tahu.*ktp|mohon.*informasi.*ktp|persyaratan.*cetak.*ktp|syarat.*cetak.*ktp|saya.*ingin.*mengetahui.*persyaratan.*cetak.*ktp|saya.*ingin.*tahu.*persyaratan.*cetak.*ktp|persyaratan.*untuk.*ktp|syarat.*untuk.*ktp|bagaimana cara bikin ktp.*dokumen|syarat.*dibutuhkan.*cetak.*ktp-el|persyaratan.*pengurusan.*ktp.*disdukcapil|dokumen.*harus dibawa.*membuat.*ktp|ketentuan syarat.*pembuatan.*ktp|apa.*diperlukan.*mengurus.*kartu tanda penduduk|syarat.*bikin.*ktp.*disdukcapil|dokumen.*diperlukan.*cetak.*ktp baru|persyaratan.*mendapatkan.*ktp elektronik|dokumen.*dibutuhkan.*mengurus.*ktp|syarat.*pembuatan.*ktp baru.*disdukcapil|apa.*harus dipenuhi.*cetak.*kartu tanda penduduk|cara mengurus ktp.*syarat.*dibutuhkan|dokumen.*diperlukan.*bikin.*ktp-el|syarat.*harus disiapkan.*ktp baru|persyaratan.*membuat.*kartu tanda penduduk|syarat.*pengurusan.*ktp.*kantor disdukcapil|dokumen.*harus disiapkan.*cetak.*ktp|apa.*dibutuhkan.*pembuatan.*ktp elektronik baru|syarat.*diperlukan.*mengurus.*ktp.*disdukcapil/i,
      'Kartu Keluarga': /kk|kartu keluarga/i,
      'akta kelahiran': /akta kelahiran|kelahiran|lahir/i,
      'akta perkawinan': /akta perkawinan|nikah|kawin/i,
      'akta perceraian': /akta perceraian|cerai/i,
      'akta kematian': /akta kematian|kematian|meninggal/i,
      'akta pengakuan anak': /akta pengakuan anak|pengakuan anak/i,
      'akta pengesahan anak': /akta pengesahan anak|pengesahan anak/i,
      'Kartu Identitas Anak': /kia|kartu identitas anak/i,
      'surat pindah WNI': /skpwni|surat keterangan pindah wni|pindah wni/i,
      'surat kedatangan WNI': /skdwni|surat kedatangan pindah wni|kedatangan pindah/i,
      'biodata penduduk': /biodata penduduk|biodata/i,
      'kutipan akta': /kutipan akta|duplikat akta/i,
      'salinan akta': /salinan lengkap akta|salinan akta/i,
      'kartu kuning': /kartu kuning|kartu kerja|work permit/i,
      'pindah domisili': /pindah|domisili|alamat/i,
      'legalisir dokumen': /legalisir|pengesahan/i
    };

    for (const [service, pattern] of Object.entries(serviceTypes)) {
      if (pattern.test(query)) {
        return service;
      }
    }

    return 'administrasi kependudukan';
  }

  /**
   * Handle greeting with enhanced smart greeting logic
   */
  private async handleGreeting(query: string, context: ConversationContext): Promise<PersonaEnhancedResponse> {
    try {
      // Initialize smart greeting manager if needed
      if (!this.smartGreetingManager) {
        this.smartGreetingManager = new SmartGreetingManager();
      }

      // Use SmartGreetingManager for intelligent greeting processing with session continuity
      const smartGreetingResponse = await this.smartGreetingManager.processGreetingQuery(
        query,
        context.userId,
        context.sessionId
      );

      if (smartGreetingResponse.isGreeting && smartGreetingResponse.response) {
        return {
          content: smartGreetingResponse.response,
          type: smartGreetingResponse.type === 'full_greeting' ? 'greeting' : 'text',
          metadata: {
            personaApplied: true,
            knowledgeUsed: true,
            greetingProtocolUsed: smartGreetingResponse.metadata?.greetingProtocol || 'smart_greeting',
            culturalSensitivityApplied: true,
            confidence: smartGreetingResponse.metadata?.confidence || 0.95
          }
        };
      }

      // Fallback to original greeting logic if smart greeting fails
      return this.handleLegacyGreeting(query, context);

    } catch (error) {
      console.error('❌ [PERSONA_SERVICE] Smart greeting failed, using fallback:', error);
      return this.handleLegacyGreeting(query, context);
    }
  }

  /**
   * Legacy greeting handler as fallback
   */
  private handleLegacyGreeting(query: string, _context: ConversationContext): PersonaEnhancedResponse {
    const timeOfDay = this.getTimeOfDay();
    let greetingResponse = "";
    let protocolUsed = "";

    // Check for Islamic greeting
    if (/assalamualaikum/i.test(query)) {
      greetingResponse = this.generateVariedIslamicGreeting(timeOfDay);
      protocolUsed = "islamic_dual_mode_greeting_varied";
    }
    // Check for casual greeting
    else if (/halo|hai|hello/i.test(query)) {
      greetingResponse = this.generateVariedCasualGreeting(query, timeOfDay);
      protocolUsed = "casual_dual_mode_greeting_varied";
    }
    // Use time-based greeting
    else {
      greetingResponse = this.generateVariedTimeBasedGreeting(timeOfDay);
      protocolUsed = `${timeOfDay}_formal_greeting_varied`;
    }

    // Fallback greeting with friendly "kak" and dual mode introduction
    if (!greetingResponse) {
      greetingResponse = this.generateVariedCasualGreeting('halo', timeOfDay);
      protocolUsed = "friendly_dual_mode_greeting_varied";
    }

    return {
      content: greetingResponse,
      type: 'greeting',
      metadata: {
        personaApplied: true,
        knowledgeUsed: true,
        greetingProtocolUsed: protocolUsed,
        culturalSensitivityApplied: true,
        confidence: 0.95
      }
    };
  }

  /**
   * Get current time of day
   */
  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 15) return 'afternoon';
    if (hour >= 15 && hour < 19) return 'evening';
    return 'night';
  }

  /**
   * Get appropriate greeting protocol for time of day
   */
  private getGreetingProtocol(_timeOfDay: string): GreetingProtocol | undefined {
    const hour = new Date().getHours();

    return this.config?.behavioral.greetingProtocols.find(protocol => {
      const [startHour, endHour] = protocol.timeRange.split('-').map(time => {
        const [h] = time.split(':').map(Number);
        return h;
      });
      
      if (startHour > endHour) {
        // Handles overnight range like 19:00-04:59
        return hour >= startHour || hour < endHour;
      } else {
        return hour >= startHour && hour < endHour;
      }
    });
  }

  /**
   * Get time-appropriate greeting text
   */
  private getTimeGreeting(timeOfDay: string): string {
    const greetings: Record<string, string> = {
      morning: 'Selamat pagi',
      afternoon: 'Selamat siang',
      evening: 'Selamat sore',
      night: 'Selamat malam'
    };

    return greetings[timeOfDay] || 'Selamat hari';
  }

  /**
   * Get contextual emoticon based on conversation context
   */
  private getContextualEmoticon(context: string, timeOfDay?: string): string {
    const greetingEmoticons = {
      morning: '🌅',
      afternoon: '☀️',
      evening: '🌇',
      night: '🌙',
      default: '😊'
    };

    const contextEmoticons: Record<string, string> = {
      service_info: '📋',
      consultation: '💡',
      help: '🤝',
      success: '✅',
      processing: '⏳',
      error: '❌',
      warning: '⚠️',
      celebration: '🎉',
      thinking: '🤔',
      default: '😊'
    };

    if (context === 'greeting' && timeOfDay) {
      return greetingEmoticons[timeOfDay as keyof typeof greetingEmoticons] || greetingEmoticons.default;
    }

    return contextEmoticons[context] || contextEmoticons.default;
  }

  /**
   * Enhance existing response with persona characteristics
   */
  private enhanceWithPersona(response: string, _context: ConversationContext): string {
    // Check if response needs complete replacement due to generic AI content
    if (this.isGenericAIResponse(response)) {
      return this.generateServiceFallbackResponse('layanan administrasi');
    }

    // Add institutional context if missing
    if (!response.includes('SELLY') && !response.includes('Dinas Kependudukan')) {
      response = `Saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. ${response}`;
    }

    // Ensure formal-friendly tone
    response = this.adjustTone(response);

    return response;
  }

  /**
   * Adjust response tone to match persona
   */
  private adjustTone(response: string): string {
    // Ensure proper address
    if (!response.includes('Bapak/Ibu') && !response.includes('Anda')) {
      response = response.replace(/anda/gi, 'Anda');
    }

    return response;
  }

  /**
   * Get persona configuration
   */
  public getPersonaConfig(): PersonaConfig {
    if (!this.config) {
      this.config = this.loadPersonaConfig();
    }
    return this.config;
  }

  /**
   * Update persona configuration
   */
  public updatePersonaConfig(updates: Partial<PersonaConfig>): void {
    if (!this.config) {
      this.config = this.loadPersonaConfig();
    }
    this.config = { ...this.config, ...updates };
  }

  /**
   * Determine appropriate address form: "kak" vs "kakak"
   * Rules:
   * - "kak" for casual, friendly, short interactions
   * - "kakak" for more formal, longer explanations, or emphasis
   */
  private getAppropriateAddress(context: ConversationContext, sentenceContext: 'greeting' | 'question' | 'explanation' | 'closing'): string {
    // Use "kakak" for:
    // 1. First interactions (more polite)
    // 2. Formal contexts
    // 3. Explanations (sounds more respectful)
    // 4. When emphasizing care/attention

    if (context.isFirstInteraction && sentenceContext === 'greeting') {
      return 'kakak';
    }

    if (context.userTone === 'formal') {
      return 'kakak';
    }

    if (sentenceContext === 'explanation') {
      return 'kakak';
    }

    if (context.conversationLength === 'long') {
      return 'kakak';
    }

    // Use "kak" for:
    // 1. Casual, friendly interactions
    // 2. Quick questions
    // 3. Follow-up messages
    // 4. When conversation is flowing naturally

    return 'kak';
  }

  /**
   * Apply natural address variation to response
   */
  private applyAddressVariation(response: string, context: ConversationContext): string {
    // Split response into sentences for context-aware processing
    const sentences = response.split(/[.!?]\s+/);
    let result = '';

    sentences.forEach((sentence, index) => {
      let sentenceContext: 'greeting' | 'question' | 'explanation' | 'closing' = 'explanation';

      // Determine sentence context
      if (index === 0 && (sentence.includes('Halo') || sentence.includes('Selamat'))) {
        sentenceContext = 'greeting';
      } else if (sentence.includes('?')) {
        sentenceContext = 'question';
      } else if (index === sentences.length - 1) {
        sentenceContext = 'closing';
      }

      const appropriateAddress = this.getAppropriateAddress(context, sentenceContext);

      // Replace generic "kak" with contextually appropriate form
      let processedSentence = sentence
        .replace(/\bkak\b/gi, appropriateAddress)
        .replace(/\bkakak\b/gi, appropriateAddress);

      result += processedSentence;
      if (index < sentences.length - 1) {
        result += '. ';
      }
    });

    return result;
  }

  /**
   * Generate response variations for natural conversation
   */
  public generateResponseVariation(baseResponse: string, context: ConversationContext): string {
    // Apply address variation
    let variedResponse = this.applyAddressVariation(baseResponse, context);

    // Add natural conversation elements
    variedResponse = this.addConversationalElements(variedResponse, context);

    return variedResponse;
  }

  /**
   * Add conversational elements for natural flow
   */
  private addConversationalElements(response: string, context: ConversationContext): string {
    const conversationalElements = {
      casual_connectors: ['Nah', 'Jadi', 'Oh iya', 'Btw', 'Oya'],
      friendly_fillers: ['nih', 'ya', 'loh', 'kan'],
      emphasis_words: ['banget', 'sekali', 'sangat'],
      confirmation_seekers: ['ya kan?', 'gimana?', 'setuju?', 'paham?']
    };

    // Apply variations based on context
    if (context.userTone === 'casual' && Math.random() > 0.7) {
      const connector = conversationalElements.casual_connectors[
        Math.floor(Math.random() * conversationalElements.casual_connectors.length)
      ];
      response = `${connector}, ${response.charAt(0).toLowerCase() + response.slice(1)}`;
    }

    return response;
  }

  /**
   * Generate varied casual greeting responses
   */
  private generateVariedCasualGreeting(query: string, timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'): string {
    const timeGreeting = this.getTimeGreeting(timeOfDay);
    const greetingEmoticon = this.getContextualEmoticon('greeting', timeOfDay);

    const greetingVariations = {
      responses: [
        'Halo juga, kak!',
        'Hai kakak!',
        'Halo kak!',
        'Hai juga kak!',
        'Halo kakak!',
        'Hai kak!',
        'Halo, kak!',
        'Hai, kakak!'
      ],
      introductions: [
        'Saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut.',
        'SELLY di sini, AI Assistant dari Disdukcapil Kabupaten Garut.',
        'Saya SELLY dari Dinas Kependudukan Kabupaten Garut.',
        'SELLY siap membantu, dari Disdukcapil Garut.',
        'Saya SELLY, AI Assistant Dinas Kependudukan Garut.',
        'SELLY hadir untuk membantu dari Disdukcapil Kabupaten Garut.'
      ],
      serviceDescriptions: [
        'SELLY dapat memberikan informasi terkait:',
        'SELLY bisa bantu kakak dengan:',
        'Saya bisa membantu kak untuk:',
        'SELLY siap membantu dengan:',
        'Ada beberapa hal yang bisa SELLY bantu:',
        'SELLY dapat membantu kakak dalam:'
      ],
      closings: [
        'Apakah ada yang SELLY bisa bantu kak? 😊',
        'Ada yang bisa SELLY bantu kakak? 😊',
        'Gimana, ada yang perlu dibantu kak? 😊',
        'Silakan, ada yang ingin ditanyakan kakak? 😊',
        'Apa yang bisa SELLY bantu hari ini kak? 😊',
        'Ada keperluan apa nih kak? 😊',
        'Mau tanya apa kakak? SELLY siap bantu! 😊',
        'Ceritakan kebutuhan kakak, SELLY siap membantu! 😊'
      ]
    };

    // Select random variations
    const greetingResponse = this.selectRandomVariation(greetingVariations.responses);
    const introduction = this.selectRandomVariation(greetingVariations.introductions);
    const serviceDescription = this.selectRandomVariation(greetingVariations.serviceDescriptions);
    const closing = this.selectRandomVariation(greetingVariations.closings);

    return `${greetingResponse} ${timeGreeting} ${greetingEmoticon} ${introduction}

${serviceDescription}

📋 **Persyaratan Pengajuan Dokumen Kependudukan**
💡 **Konsultasi terkait permasalahan data kependudukan** yang mungkin SELLY bisa carikan solusinya

${closing}`;
  }

  /**
   * Generate varied Islamic greeting responses
   */
  private generateVariedIslamicGreeting(timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'): string {
    const timeGreeting = this.getTimeGreeting(timeOfDay);
    const greetingEmoticon = this.getContextualEmoticon('greeting', timeOfDay);

    const islamicVariations = {
      responses: [
        'Wa\'alaikumussalam warahmatullahi wabarakatuh, kak!',
        'Wa\'alaikumussalam warahmatullahi wabarakatuh, kakak!',
        'Wa\'alaikumussalam warahmatullahi wabarakatuh kak!',
        'Wa\'alaikumussalam warahmatullahi wabarakatuh kakak!',
        'Wa\'alaikumussalam warahmatullahi wabarakatuh, kak! 🤲',
        'Wa\'alaikumussalam warahmatullahi wabarakatuh kakak! 🤲'
      ],
      introductions: [
        'Saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut.',
        'SELLY di sini, siap membantu dari Disdukcapil Kabupaten Garut.',
        'Saya SELLY dari Dinas Kependudukan Kabupaten Garut.',
        'SELLY hadir untuk membantu, dari Disdukcapil Garut.',
        'Saya SELLY, AI Assistant Dinas Kependudukan Garut.'
      ],
      serviceDescriptions: [
        'SELLY dapat memberikan informasi terkait:',
        'SELLY bisa membantu kakak dengan:',
        'Saya siap membantu kak untuk:',
        'SELLY dapat membantu dengan:',
        'Ada beberapa hal yang bisa SELLY bantu:'
      ],
      closings: [
        'Apakah ada yang SELLY bisa bantu kak? 😊',
        'Ada yang bisa SELLY bantu kakak? 😊',
        'Silakan, ada yang ingin ditanyakan kakak? 😊',
        'Apa yang bisa SELLY bantu hari ini kak? 😊',
        'Barakallahu fiikum, ada yang bisa dibantu kak? 😊',
        'Semoga Allah mudahkan urusan kakak, ada yang perlu dibantu? 😊'
      ]
    };

    const greetingResponse = this.selectRandomVariation(islamicVariations.responses);
    const introduction = this.selectRandomVariation(islamicVariations.introductions);
    const serviceDescription = this.selectRandomVariation(islamicVariations.serviceDescriptions);
    const closing = this.selectRandomVariation(islamicVariations.closings);

    return `${greetingResponse} ${timeGreeting} ${greetingEmoticon} ${introduction}

${serviceDescription}

📋 **Persyaratan Pengajuan Dokumen Kependudukan**
💡 **Konsultasi terkait permasalahan data kependudukan** yang mungkin SELLY bisa carikan solusinya

${closing}`;
  }

  /**
   * Generate varied time-based formal greeting responses
   */
  private generateVariedTimeBasedGreeting(timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'): string {
    const timeBasedVariations = {
      morning: {
        greetings: [
          'Selamat pagi juga, Bapak/Ibu!',
          'Selamat pagi, Bapak/Ibu!',
          'Pagi yang baik, Bapak/Ibu!',
          'Selamat pagi! Semoga hari ini penuh berkah, Bapak/Ibu.'
        ],
        wishes: [
          'Semoga hari ini menjadi hari yang produktif.',
          'Semoga hari ini penuh berkah dan lancar.',
          'Semoga pagi ini membawa kebaikan untuk Bapak/Ibu.',
          'Semoga aktivitas hari ini berjalan lancar.'
        ],
        closings: [
          'Bagaimana saya bisa membantu Anda dengan layanan administrasi kependudukan?',
          'Ada yang bisa saya bantu terkait layanan kependudukan hari ini?',
          'Silakan sampaikan kebutuhan Anda terkait administrasi kependudukan.',
          'Apa yang bisa SELLY bantu untuk layanan kependudukan Anda?'
        ]
      },
      afternoon: {
        greetings: [
          'Selamat siang, Bapak/Ibu!',
          'Siang yang baik, Bapak/Ibu!',
          'Selamat siang! Semoga hari ini berjalan lancar, Bapak/Ibu.'
        ],
        wishes: [
          'Semoga siang ini membawa solusi untuk kebutuhan Anda.',
          'Semoga aktivitas siang ini berjalan dengan baik.',
          'Semoga hari ini penuh produktivitas untuk Bapak/Ibu.'
        ],
        closings: [
          'Bagaimana SELLY bisa membantu Anda dengan layanan administrasi kependudukan?',
          'Ada keperluan administrasi kependudukan yang bisa saya bantu?',
          'Silakan sampaikan kebutuhan layanan kependudukan Anda.'
        ]
      },
      evening: {
        greetings: [
          'Selamat sore, Bapak/Ibu!',
          'Sore yang baik, Bapak/Ibu!',
          'Selamat sore! Semoga hari ini telah berjalan baik, Bapak/Ibu.'
        ],
        wishes: [
          'Semoga sore ini membawa kemudahan untuk urusan Anda.',
          'Semoga aktivitas hari ini telah berjalan lancar.',
          'Semoga sore ini penuh berkah untuk Bapak/Ibu.'
        ],
        closings: [
          'Ada yang bisa SELLY bantu untuk layanan administrasi kependudukan?',
          'Bagaimana saya bisa membantu kebutuhan administrasi Anda?',
          'Silakan sampaikan keperluan layanan kependudukan Anda.'
        ]
      },
      night: {
        greetings: [
          'Selamat malam, Bapak/Ibu!',
          'Malam yang baik, Bapak/Ibu!',
          'Selamat malam! Walaupun kantor sudah tutup, SELLY tetap siap membantu.'
        ],
        wishes: [
          'Walaupun kantor sudah tutup, saya tetap tersedia untuk memberikan informasi dan panduan.',
          'SELLY siap membantu Anda 24/7 untuk informasi layanan kependudukan.',
          'Meskipun di luar jam kerja, SELLY tetap dapat memberikan panduan yang Anda butuhkan.'
        ],
        closings: [
          'Ada informasi layanan kependudukan yang bisa SELLY berikan?',
          'Bagaimana SELLY bisa membantu dengan informasi administrasi kependudukan?',
          'Silakan tanyakan informasi layanan yang Anda butuhkan.'
        ]
      }
    };

    const variations = timeBasedVariations[timeOfDay];
    const greeting = this.selectRandomVariation(variations.greetings);
    const wish = this.selectRandomVariation(variations.wishes);
    const closing = this.selectRandomVariation(variations.closings);

    return `${greeting} ${wish} Saya SELLY dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. ${closing} SELLY dapat memberikan informasi terkait dengan Persyaratan Pengajuan Dokumen Kependudukan atau mungkin ingin berkonsultasi terkait data kependudukan mungkin SELLY bisa membantu Bapak/Ibu`;
  }

  /**
   * Select random variation from array (helper method)
   */
  private selectRandomVariation(variations: string[]): string {
    const randomIndex = Math.floor(Math.random() * variations.length);
    return variations[randomIndex];
  }

  /**
   * PERFORMANCE OPTIMIZATION: Check administrative cache asynchronously
   * This pre-warms the cache for future requests
   */
  private async checkAdministrativeCacheAsync(query: string, context: ConversationContext): Promise<void> {
    try {
      // Initialize cache if needed (non-blocking)
      this.administrativeCache?.initialize().catch(error => {
        console.warn('⚠️ [PERSONA_SERVICE] Cache initialization warning:', error);
      });

      // Pre-warm cache for similar queries (non-blocking)
      this.administrativeCache?.getCachedResponse(query).catch(error => {
        console.warn('⚠️ [PERSONA_SERVICE] Cache pre-warm warning:', error);
      });
    } catch (error) {
      // Silent fail - don't impact main flow
      console.warn('⚠️ [PERSONA_SERVICE] Administrative cache check failed:', error);
    }
  }
}
