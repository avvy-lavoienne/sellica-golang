/**
 * Conversational Enhancement Layer for SELLY
 * Makes responses more natural and human-like
 */

export interface ConversationalContext {
  userTone: 'formal' | 'casual' | 'friendly';
  queryComplexity: 'simple' | 'complex';
  previousInteractions: string[];
  userPreferences?: {
    responseStyle: 'detailed' | 'concise';
    language: 'formal' | 'informal';
  };
}

export interface EnhancedResponse {
  content: string;
  tone: string;
  suggestions: string[];
  followUpQuestions?: string[];
}

export class ConversationalEnhancer {
  
  /**
   * Enhance response to be more conversational and natural
   */
  enhanceResponse(
    originalResponse: string,
    userQuery: string,
    context?: ConversationalContext
  ): EnhancedResponse {
    const userTone = this.detectUserTone(userQuery);
    const responseStyle = this.determineResponseStyle(userQuery, userTone);
    
    // Make response more conversational
    const enhancedContent = this.makeConversational(originalResponse, userTone, responseStyle);
    
    // Generate contextual suggestions
    const suggestions = this.generateContextualSuggestions(userQuery, originalResponse);
    
    // Generate follow-up questions
    const followUpQuestions = this.generateFollowUpQuestions(userQuery, originalResponse);
    
    return {
      content: enhancedContent,
      tone: userTone,
      suggestions,
      followUpQuestions
    };
  }

  /**
   * Detect user's tone from their query
   */
  private detectUserTone(query: string): 'formal' | 'casual' | 'friendly' {
    const lowerQuery = query.toLowerCase();
    
    // Casual indicators
    const casualMarkers = ['gak', 'dong', 'sih', 'nih', 'yah', 'deh', 'kan', 'gimana'];
    const hasCasualMarkers = casualMarkers.some(marker => lowerQuery.includes(marker));
    
    // Friendly indicators
    const friendlyMarkers = ['tolong', 'bisa', 'minta', 'please', 'makasih', 'terima kasih'];
    const hasFriendlyMarkers = friendlyMarkers.some(marker => lowerQuery.includes(marker));
    
    // Formal indicators
    const formalMarkers = ['mohon', 'silakan', 'dimohon', 'diharapkan'];
    const hasFormalMarkers = formalMarkers.some(marker => lowerQuery.includes(marker));
    
    if (hasCasualMarkers) return 'casual';
    if (hasFriendlyMarkers) return 'friendly';
    if (hasFormalMarkers) return 'formal';
    
    // Default based on query structure
    return query.length > 50 ? 'formal' : 'casual';
  }

  /**
   * Determine appropriate response style
   */
  private determineResponseStyle(query: string, tone: string): 'detailed' | 'concise' {
    const hasQuestionWords = /berapa|jumlah|total|statistik|detail|lengkap/i.test(query);
    const isSimpleQuery = query.split(' ').length <= 5;
    
    if (tone === 'casual' && isSimpleQuery) return 'concise';
    if (hasQuestionWords) return 'detailed';
    
    return 'detailed';
  }

  /**
   * Make response more conversational based on user tone
   */
  private makeConversational(
    response: string, 
    userTone: string, 
    style: string
  ): string {
    let enhanced = response;
    
    // Add conversational openings based on tone
    const openings = {
      casual: ['Oke nih!', 'Siap!', 'Baik!', 'Nih datanya:'],
      friendly: ['Tentu saja!', 'Dengan senang hati!', 'Baik, saya bantu!'],
      formal: ['Baik,', 'Berikut informasi yang Anda minta:', 'Sesuai permintaan Anda:']
    };
    
    const opening = openings[userTone as keyof typeof openings];
    if (opening && opening.length > 0) {
      const selectedOpening = opening[Math.floor(Math.random() * opening.length)];
      enhanced = `${selectedOpening} ${enhanced}`;
    }
    
    // Add conversational closings
    const closings = {
      casual: ['Ada yang lain gak?', 'Gimana, udah jelas?', 'Butuh info lain?'],
      friendly: ['Ada yang bisa saya bantu lagi?', 'Semoga membantu ya!', 'Silakan tanya lagi kalau ada yang kurang jelas!'],
      formal: ['Apakah ada informasi lain yang Anda perlukan?', 'Silakan menghubungi saya jika memerlukan bantuan lebih lanjut.']
    };
    
    const closing = closings[userTone as keyof typeof closings];
    if (closing && closing.length > 0 && style === 'detailed') {
      const selectedClosing = closing[Math.floor(Math.random() * closing.length)];
      enhanced = `${enhanced}\n\n${selectedClosing}`;
    }
    
    return enhanced;
  }

  /**
   * Generate contextual suggestions based on the query and response
   */
  private generateContextualSuggestions(query: string, response: string): string[] {
    const suggestions: string[] = [];
    
    // If user asked about users, suggest related queries
    if (query.includes('user') || query.includes('pengguna')) {
      suggestions.push(
        'Lihat "data pengajuan pengguna"',
        'Cek "aktivitas pengguna terbaru"',
        'Tanyakan "pengguna paling aktif"'
      );
    }
    
    // If user asked about statistics, suggest drill-downs
    if (query.includes('statistik') || query.includes('jumlah')) {
      suggestions.push(
        'Detail per bulan: "statistik bulanan"',
        'Bandingkan: "perbandingan tahun ini vs lalu"',
        'Trend: "tren penggunaan sistem"'
      );
    }
    
    // If user searched for data, suggest related searches
    if (query.includes('cari') || query.includes('data')) {
      suggestions.push(
        'Cari berdasarkan NIK',
        'Filter berdasarkan tanggal',
        'Ekspor hasil pencarian'
      );
    }
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Generate follow-up questions to keep conversation flowing
   */
  private generateFollowUpQuestions(query: string, response: string): string[] {
    const followUps: string[] = [];
    
    // Based on query type, suggest natural follow-ups
    if (query.includes('user') || query.includes('pengguna')) {
      followUps.push(
        'Ingin melihat detail pengguna tertentu?',
        'Butuh informasi aktivitas pengguna?',
        'Mau cek pengguna yang belum aktif?'
      );
    }
    
    if (query.includes('statistik')) {
      followUps.push(
        'Perlu breakdown per kategori?',
        'Ingin lihat tren historis?',
        'Butuh perbandingan dengan periode lain?'
      );
    }
    
    return followUps.slice(0, 2); // Limit to 2 follow-ups
  }

  /**
   * Handle variations of the same query intent
   */
  normalizeQuery(query: string): string {
    let normalized = query.toLowerCase().trim();
    
    // Handle common variations
    const variations = {
      // User count variations
      'berapa user': 'jumlah pengguna',
      'ada berapa user': 'jumlah pengguna', 
      'total user': 'jumlah pengguna',
      'user berapa': 'jumlah pengguna',
      'jumlah pengguna berapa': 'jumlah pengguna',
      'ada berapa orang yang pakai': 'jumlah pengguna',
      
      // Search variations
      'bisa carikan': 'cari',
      'tolong carikan': 'cari',
      'minta data': 'cari data',
      'butuh informasi': 'cari informasi',
      
      // Help variations
      'gimana cara': 'bantuan cara',
      'bisa bantu': 'bantuan',
      'tolong bantu': 'bantuan'
    };
    
    // Apply variations
    for (const [variation, standard] of Object.entries(variations)) {
      if (normalized.includes(variation)) {
        normalized = normalized.replace(variation, standard);
      }
    }
    
    return normalized;
  }
}
