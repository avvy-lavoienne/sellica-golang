/**
 * Service Response Variation System for SELLY
 * Provides multiple response formats for the same service information
 * to create more natural, varied conversations while maintaining accuracy
 */

export interface ResponseVariation {
  format: 'detailed' | 'concise' | 'step-by-step' | 'conversational';
  template: string;
  tone: 'formal' | 'friendly' | 'casual';
}

export interface ServiceVariationConfig {
  serviceCode: string;
  variations: ResponseVariation[];
  openings: string[];
  closings: string[];
  emphasizers: string[];
}

export class ServiceResponseVariations {
  private variationConfigs: Map<string, ServiceVariationConfig> = new Map();

  constructor() {
    this.initializeVariations();
  }

  /**
   * Initialize response variations for all services
   */
  private initializeVariations(): void {
    // Kepindahan service variations
    this.variationConfigs.set('KEPINDAHAN-001', {
      serviceCode: 'KEPINDAHAN-001',
      variations: [
        {
          format: 'detailed',
          tone: 'formal',
          template: `📋 **Pelayanan Kepindahan WNI**
Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut

{requirements}

⏱️ **Waktu penyelesaian:** {duration}
💰 **Biaya:** {cost}
🕐 **Jam pelayanan:** {officeHours}

📌 **Catatan penting:**
{notes}

📞 **Untuk informasi lebih lanjut:**
WhatsApp: +62-851-8304-3205`
        },
        {
          format: 'conversational',
          tone: 'friendly',
          template: `Baik kak! Untuk mengurus kepindahan domisili, ini yang perlu kak siapkan:

{requirements}

🕐 Prosesnya cepat kok kak, {duration}
💰 Dan yang paling penting, {cost}

📌 Yang perlu kak ingat:
{notes}

Ada yang mau ditanyakan lagi tentang kepindahannya? 😊`
        },
        {
          format: 'step-by-step',
          tone: 'friendly',
          template: `Oke kak! Saya bantu jelaskan langkah-langkah mengurus kepindahan domisili:

📋 **Langkah 1: Siapkan Dokumen**
{requirements}

📋 **Langkah 2: Datang ke Kantor**
• Jam pelayanan: {officeHours}
• Bisa online di pastioke.garutkab.go.id atau offline langsung ke kantor

📋 **Langkah 3: Tunggu Proses**
• {duration}
• {cost}

📌 **Tips penting:**
{notes}

Semoga membantu ya kak! 🤝`
        },
        {
          format: 'concise',
          tone: 'casual',
          template: `Siap! Untuk pindah domisili butuh:

{requirements}

⚡ {duration} | 💰 {cost}
🕐 {officeHours}

⚠️ Ingat: {notes}

Udah jelas? Ada yang mau ditanya lagi? 😊`
        }
      ],
      openings: [
        'Baik kak! Saya bantu dengan informasi kepindahan domisili.',
        'Siap! Untuk mengurus perpindahan domisili, ini infonya:',
        'Oke! Saya jelaskan tentang pelayanan kepindahan WNI ya:',
        'Tentu! Berikut informasi lengkap untuk kepindahan domisili:',
        'Dengan senang hati! Ini panduan lengkap kepindahan domisili:'
      ],
      closings: [
        'Apakah ada yang ingin kak tanyakan lebih lanjut mengenai pelayanan kepindahan?',
        'Ada yang masih kurang jelas tentang kepindahannya kak?',
        'Semoga informasinya membantu! Butuh penjelasan lain?',
        'Gimana kak, sudah jelas? Ada yang mau ditanya lagi?',
        'Silakan tanya lagi kalau ada yang perlu diperjelas ya kak! 😊'
      ],
      emphasizers: [
        'Yang paling penting',
        'Yang perlu diingat',
        'Catatan khusus',
        'Tips dari SELLY',
        'Jangan lupa'
      ]
    });

    // Add more service variations here
    this.initializeKKVariations();
    this.initializeKTPVariations();
  }

  /**
   * Initialize KK service variations
   */
  private initializeKKVariations(): void {
    this.variationConfigs.set('KK-001A', {
      serviceCode: 'KK-001A',
      variations: [
        {
          format: 'detailed',
          tone: 'formal',
          template: `📋 **Panduan Lengkap Pembuatan Kartu Keluarga (KK) Baru**

📋 **KK BARU - Belum Punya Dokumen Kependudukan Sama Sekali**

## 🎯 **Situasi Anda:**
{description}

## 🎯 **Mengapa Perlu KK?**
{importance}

## 📋 **Langkah-Langkah yang Harus Dilakukan:**
{requirements}

⏱️ **Waktu penyelesaian:** {duration}
💰 **Biaya:** {cost}`
        },
        {
          format: 'conversational',
          tone: 'friendly',
          template: `Halo kak! Saya bantu untuk pembuatan KK baru ya.

Karena kak belum punya dokumen kependudukan sama sekali, ini yang perlu kak lakukan:

{requirements}

🕐 Prosesnya memang agak lama kak, sekitar {duration}, tapi tenang aja karena {cost}

{importance}

Ada yang mau ditanya tentang prosesnya kak? 😊`
        }
      ],
      openings: [
        'Baik kak! Saya bantu dengan pembuatan KK baru.',
        'Siap! Untuk KK baru tanpa dokumen, ini panduannya:',
        'Oke! Saya jelaskan proses KK baru untuk yang belum punya dokumen:'
      ],
      closings: [
        'Apakah ada yang ingin kak tanyakan tentang pembuatan KK?',
        'Ada yang masih kurang jelas tentang prosesnya kak?',
        'Semoga informasinya membantu! Butuh penjelasan lain?'
      ],
      emphasizers: [
        'Yang paling penting',
        'Catatan khusus',
        'Tips dari SELLY'
      ]
    });
  }

  /**
   * Initialize KTP service variations
   */
  private initializeKTPVariations(): void {
    // Add KTP variations here
  }

  /**
   * Get varied response for a service
   */
  public getVariedResponse(
    serviceCode: string,
    serviceInfo: any,
    context?: {
      userTone?: 'formal' | 'casual' | 'friendly';
      previousInteractions?: number;
      preferredFormat?: 'detailed' | 'concise' | 'step-by-step' | 'conversational';
    }
  ): string {
    const config = this.variationConfigs.get(serviceCode);
    if (!config) {
      return this.getDefaultResponse(serviceInfo);
    }

    // Select variation based on context
    const selectedVariation = this.selectVariation(config, context);
    
    // Build response with variation
    const response = this.buildVariedResponse(selectedVariation, serviceInfo, config);
    
    return response;
  }

  /**
   * Select appropriate variation based on context
   */
  private selectVariation(
    config: ServiceVariationConfig,
    context?: any
  ): ResponseVariation {
    // If user has preference, use it
    if (context?.preferredFormat) {
      const preferred = config.variations.find(v => v.format === context.preferredFormat);
      if (preferred) return preferred;
    }

    // If user tone is specified, match it
    if (context?.userTone) {
      const toneMatched = config.variations.find(v => v.tone === context.userTone);
      if (toneMatched) return toneMatched;
    }

    // For repeat interactions, use different format
    if (context?.previousInteractions > 0) {
      const alternativeFormats = config.variations.filter(v => v.format !== 'detailed');
      if (alternativeFormats.length > 0) {
        return alternativeFormats[context.previousInteractions % alternativeFormats.length];
      }
    }

    // Default to first variation
    return config.variations[0];
  }

  /**
   * Build response using selected variation
   */
  private buildVariedResponse(
    variation: ResponseVariation,
    serviceInfo: any,
    config: ServiceVariationConfig
  ): string {
    let response = variation.template;

    // Replace placeholders with actual service information
    response = response.replace('{requirements}', this.formatRequirements(serviceInfo.requirements, variation.format));
    response = response.replace('{duration}', serviceInfo.duration || 'Selesai pada hari yang sama');
    response = response.replace('{cost}', serviceInfo.cost || 'Gratis');
    response = response.replace('{officeHours}', serviceInfo.officeHours || '08:00-15:00 WIB (Senin-Jumat)');
    response = response.replace('{notes}', this.formatNotes(serviceInfo.notes, variation.format));
    response = response.replace('{importance}', this.formatImportance(serviceInfo.importance, variation.format));
    response = response.replace('{description}', serviceInfo.description || '');

    // Add random opening and closing
    const opening = this.selectRandom(config.openings);
    const closing = this.selectRandom(config.closings);

    // Return content without SELLY introduction (let the main service formatter handle it)
    const contentResponse = `${opening}

${response}

${closing}`;

    return contentResponse;
  }

  /**
   * Format requirements based on variation format
   */
  private formatRequirements(requirements: any[], format: string): string {
    if (!requirements || requirements.length === 0) return '';

    switch (format) {
      case 'concise':
        return requirements.map((req, index) => `${index + 1}. ${req.name}`).join('\n');
      
      case 'conversational':
        return requirements.map((req, index) => `• ${req.name}`).join('\n');
      
      case 'step-by-step':
        return requirements.map((req, index) => 
          `**${index + 1}. ${req.name}**\n   💡 ${req.description || 'Dokumen yang diperlukan untuk proses kepindahan.'}`
        ).join('\n\n');
      
      default: // detailed
        return requirements.map((req, index) => 
          `${index + 1}. **${req.name}**${req.description ? `\n   💡 ${req.description}` : ''}`
        ).join('\n\n');
    }
  }

  /**
   * Format notes based on variation format
   */
  private formatNotes(notes: string[], format: string): string {
    if (!notes || notes.length === 0) return '';

    switch (format) {
      case 'concise':
        return notes.slice(0, 2).map(note => `• ${note}`).join('\n');
      
      case 'conversational':
        return notes.slice(0, 3).map(note => `• ${note}`).join('\n');
      
      default:
        return notes.map(note => `• ${note}`).join('\n');
    }
  }

  /**
   * Format importance based on variation format
   */
  private formatImportance(importance: string[], format: string): string {
    if (!importance || importance.length === 0) return '';

    return importance.map(item => `• ${item}`).join('\n');
  }

  /**
   * Select random item from array
   */
  private selectRandom(items: string[]): string {
    return items[Math.floor(Math.random() * items.length)];
  }

  /**
   * Get default response if no variations configured
   */
  private getDefaultResponse(serviceInfo: any): string {
    return `Saya SELLY AI Assistant dari Dinas Kependudukan dan Pencatatan Sipil Kabupaten Garut. Saya dapat membantu Anda dengan informasi pelayanan.

📋 ${serviceInfo.serviceName}

Persyaratan yang diperlukan:
${serviceInfo.requirements?.map((req: any, index: number) => `${index + 1}. ${req.name}`).join('\n') || ''}

⏱️ Waktu penyelesaian: ${serviceInfo.duration || 'Selesai pada hari yang sama'}
💰 Biaya: ${serviceInfo.cost || 'Gratis'}

Apakah ada yang ingin kak tanyakan lebih lanjut? 🤔`;
  }
}

// Export singleton instance
export const serviceResponseVariations = new ServiceResponseVariations();
