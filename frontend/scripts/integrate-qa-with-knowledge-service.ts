#!/usr/bin/env npx tsx

/**
 * Q&A Integration Script
 * Integrates the comprehensive Q&A pairs with the existing KnowledgeService
 * Enhances pattern matching and response accuracy for real-world queries
 */

import fs from 'fs';
import path from 'path';

interface EnhancedQAPair {
  id: string;
  query: string;
  expectedResponse: string;
  category: string;
  scenario: string;
  keywords: string[];
  confidence: number;
  source: string;
  metadata: any;
}

interface IntegrationResult {
  totalPairsIntegrated: number;
  newPatternsAdded: number;
  specialCasesAdded: number;
  scenarioEnhancements: number;
  integrationDuration: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
}

class QAKnowledgeServiceIntegrator {
  private enhancedQAData: any;
  private integrationResults: IntegrationResult;
  private startTime: number;

  constructor() {
    this.startTime = performance.now();
    this.integrationResults = {
      totalPairsIntegrated: 0,
      newPatternsAdded: 0,
      specialCasesAdded: 0,
      scenarioEnhancements: 0,
      integrationDuration: 0,
      status: 'FAILED'
    };
  }

  /**
   * Load enhanced Q&A data
   */
  private loadEnhancedQAData(): void {
    try {
      const qaFilePath = path.join(process.cwd(), 'data/training/enhanced-akta-kelahiran-qa.json');
      const qaContent = fs.readFileSync(qaFilePath, 'utf-8');
      this.enhancedQAData = JSON.parse(qaContent);
      
      console.log(`📚 [QA_INTEGRATOR] Loaded enhanced Q&A data with ${Object.keys(this.enhancedQAData.categories).length} categories`);
      
    } catch (error) {
      console.error('❌ [QA_INTEGRATOR] Failed to load enhanced Q&A data:', error);
      throw error;
    }
  }

  /**
   * Generate knowledge service entries for special cases
   */
  private generateSpecialCaseEntries(): any {
    const specialCases: any = {};

    // Nikah Siri cases
    specialCases['nikah_siri_comprehensive'] = {
      title: 'Panduan Lengkap Akta Kelahiran untuk Nikah Siri',
      content: `Halo kak! 😊 Saya memahami situasi kakak dan siap membantu dengan informasi yang tepat.

**Untuk pasangan nikah siri yang ingin membuat akta kelahiran anak:**

✅ **Bisa menggunakan SPTJM (Formulir F-2.04)**
• Surat Pernyataan Tanggung Jawab Mutlak Kebenaran Sebagai Pasangan Suami-Istri
• Nama ayah dan ibu akan tercantum di akta kelahiran
• Prosedur sama dengan perkawinan tercatat

⚠️ **Konsekuensi Hukum yang Perlu Dipahami:**
• Anak hanya memiliki hubungan perdata dengan ibu
• Tidak berhak atas warisan dari ayah
• Jika anak perempuan menikah, walinya adalah wali hakim (bukan ayah)

🎯 **Solusi Terbaik: Isbat Nikah**
• Ajukan ke Pengadilan Agama
• Setelah dapat penetapan, terbitkan buku nikah di KUA
• Ajukan pembetulan data akta kelahiran di Dukcapil

📋 **Persyaratan SPTJM:**
• Formulir F-2.01 (Pelaporan Pencatatan Sipil)
• Formulir F-2.04 (SPTJM Pasangan Suami-Istri)
• Surat Keterangan Kelahiran dari bidan/dokter/rumah sakit
• KTP-el kedua orang tua
• Kartu Keluarga
• KTP-el dua orang saksi

Semoga informasi ini membantu ya kak! SELLY siap bantu dengan pertanyaan lain! 🤝`,
      patterns: [
        'nikah siri', 'menikah siri', 'tidak punya buku nikah', 'belum punya buku nikah',
        'kawin siri', 'pernikahan siri', 'SPTJM', 'F-2.04'
      ],
      scenario: 'special_case',
      confidence: 0.98
    };

    // Ibu Tunggal cases
    specialCases['ibu_tunggal_comprehensive'] = {
      title: 'Panduan Akta Kelahiran untuk Ibu Tunggal',
      content: `Halo kak! 😊 Saya siap membantu kakak yang sedang mengurus akta kelahiran sebagai ibu tunggal.

**Persyaratan untuk Anak Seorang Ibu:**

📋 **Dokumen yang Diperlukan:**
• Formulir pelaporan (F-2.01)
• Surat Keterangan Kelahiran dari bidan/dokter/rumah sakit
• KTP-el ibu
• Kartu Keluarga (KK) ibu
• KTP-el dua orang saksi

✅ **Yang Akan Tercantum di Akta:**
• Frasa: "Anak seorang ibu, [Nama Ibu]"
• Kolom data ayah akan dikosongkan
• Status hukum anak jelas dan sah

🎯 **Keuntungan:**
• Prosedur lebih sederhana
• Tidak perlu SPTJM
• Anak tetap mendapat perlindungan hukum penuh dari ibu
• Bisa mengurus sendiri tanpa persetujuan pihak lain

👥 **Tentang Saksi:**
• Dua orang yang mengetahui peristiwa kelahiran
• Harus dewasa dan punya KTP-el
• Bisa keluarga, tetangga, atau teman

💰 **Biaya:** GRATIS sesuai UU No. 24 Tahun 2013

Kakak sangat kuat dan hebat! SELLY mendukung kakak sepenuhnya! 🤝💪`,
      patterns: [
        'ibu tunggal', 'single mother', 'anak seorang ibu', 'tidak ada ayah',
        'ibu sendiri', 'tanpa ayah', 'single parent'
      ],
      scenario: 'special_case',
      confidence: 0.97
    };

    // WNA cases
    specialCases['wna_comprehensive'] = {
      title: 'Akta Kelahiran untuk Anak WNA-WNI',
      content: `Halo kak! 😊 Saya siap membantu kakak yang merupakan WNA atau menikah dengan WNA.

**Untuk WNA yang menikah dengan WNI:**

✅ **Anak Berhak Mendapat Akta Kelahiran Indonesia**
• Prosedur mirip dengan WNI
• Anak otomatis mendapat kewarganegaraan Indonesia (jika salah satu orang tua WNI)

📋 **Dokumen Tambahan untuk WNA:**
• Paspor WNA yang masih berlaku
• Dokumen keimigrasian (ITAS/ITAP)
• Surat Keterangan dari Kedutaan/Konsulat (jika diperlukan)
• Akta perkawinan yang telah diterjemahkan dan dilegalisir

🌍 **Jika Anak Lahir di Luar Negeri:**
• Laporkan ke KJRI/Konsulat Indonesia terdekat
• Dapatkan Laporan Kelahiran dari KJRI
• Urus akta kelahiran Indonesia setelah kembali ke Indonesia

⚖️ **Status Kewarganegaraan:**
• Anak bisa memiliki kewarganegaraan ganda sampai usia 18 tahun
• Setelah 18 tahun harus memilih salah satu kewarganegaraan

📞 **Bantuan Tambahan:**
• Hubungi Dinas Dukcapil setempat
• Konsultasi dengan KJRI jika di luar negeri

Semoga membantu ya kak! SELLY siap bantu dengan pertanyaan lain! 🤝🌍`,
      patterns: [
        'WNA', 'warga negara asing', 'foreigner', 'bule', 'luar negeri',
        'ITAS', 'ITAP', 'paspor', 'mixed marriage', 'kawin campur'
      ],
      scenario: 'E',
      confidence: 0.96
    };

    return specialCases;
  }

  /**
   * Generate enhanced pattern matching rules
   */
  private generateEnhancedPatterns(): any {
    const patterns: any = {
      // Legal document patterns
      legal_documents: [
        'SPTJM', 'F-2.01', 'F-2.02', 'F-2.03', 'F-2.04',
        'UU 24/2013', 'UU No. 24 Tahun 2013', 'Pasal 79A',
        'Permendagri', 'Perpres', 'buku nikah', 'akta perkawinan'
      ],

      // Process-related patterns
      processes: [
        'Isbat Nikah', 'Pengadilan Agama', 'penetapan pengadilan',
        'pembetulan data', 'koreksi akta', 'catatan pinggir',
        'kutipan kedua', 'penggantian akta', 'surat kehilangan'
      ],

      // Status patterns
      status_patterns: [
        'Kawin Tercatat', 'Kawin Belum Tercatat', 'Kawin Tidak Tercatat',
        'anak seorang ibu', 'anak sah', 'anak luar nikah',
        'wali hakim', 'wali nasab', 'hubungan perdata'
      ],

      // Service patterns
      service_patterns: [
        'gratis', 'tidak ada biaya', 'tanpa biaya', 'free',
        'online', 'website', 'aplikasi', 'digital',
        'jemput bola', 'layanan keliling', 'daerah terpencil'
      ],

      // Problem patterns
      problem_patterns: [
        'hilang', 'rusak', 'sobek', 'basah', 'terbakar',
        'salah ketik', 'data salah', 'nama salah', 'tanggal salah',
        'terlambat', 'telat', 'sudah lama', 'belum punya'
      ]
    };

    return patterns;
  }

  /**
   * Update knowledge service with Q&A integration
   */
  private async updateKnowledgeService(): Promise<void> {
    try {
      // Generate special case entries
      const specialCases = this.generateSpecialCaseEntries();
      this.integrationResults.specialCasesAdded = Object.keys(specialCases).length;

      // Generate enhanced patterns
      const enhancedPatterns = this.generateEnhancedPatterns();
      this.integrationResults.newPatternsAdded = Object.values(enhancedPatterns).flat().length;

      // Create integration data structure
      const integrationData = {
        metadata: {
          integrationDate: new Date().toISOString(),
          source: 'comprehensive_qa_training',
          version: '2.0',
          totalCategories: Object.keys(this.enhancedQAData.categories).length,
          totalScenarios: Object.keys(this.enhancedQAData.scenarios).length
        },
        specialCases,
        enhancedPatterns,
        categoryMappings: this.createCategoryMappings(),
        scenarioEnhancements: this.createScenarioEnhancements()
      };

      // Save integration data
      const integrationPath = path.join(process.cwd(), 'data/training/qa-knowledge-integration.json');
      fs.writeFileSync(integrationPath, JSON.stringify(integrationData, null, 2));

      console.log(`💾 [QA_INTEGRATOR] Integration data saved to: ${integrationPath}`);

      // Update totals
      this.integrationResults.totalPairsIntegrated = Object.keys(this.enhancedQAData.categories).reduce(
        (total, category) => total + this.enhancedQAData.categories[category].length, 0
      );

      this.integrationResults.scenarioEnhancements = Object.keys(this.enhancedQAData.scenarios).length;

    } catch (error) {
      console.error('❌ [QA_INTEGRATOR] Failed to update knowledge service:', error);
      throw error;
    }
  }

  /**
   * Create category mappings for better query routing
   */
  private createCategoryMappings(): any {
    const mappings: any = {};

    Object.keys(this.enhancedQAData.categories).forEach(category => {
      const pairs = this.enhancedQAData.categories[category];
      const keywords = new Set<string>();
      
      pairs.forEach((pair: EnhancedQAPair) => {
        pair.keywords.forEach(keyword => keywords.add(keyword.toLowerCase()));
      });

      mappings[category] = {
        keywords: Array.from(keywords),
        pairCount: pairs.length,
        scenarios: [...new Set(pairs.map((p: EnhancedQAPair) => p.scenario))],
        confidence: pairs.reduce((sum: number, p: EnhancedQAPair) => sum + p.confidence, 0) / pairs.length
      };
    });

    return mappings;
  }

  /**
   * Create scenario enhancements
   */
  private createScenarioEnhancements(): any {
    const enhancements: any = {};

    Object.keys(this.enhancedQAData.scenarios).forEach(scenario => {
      const pairs = this.enhancedQAData.scenarios[scenario];
      
      enhancements[scenario] = {
        description: this.getScenarioDescription(scenario),
        pairCount: pairs.length,
        categories: [...new Set(pairs.map((p: EnhancedQAPair) => p.category))],
        commonKeywords: this.extractCommonKeywords(pairs),
        averageConfidence: pairs.reduce((sum: number, p: EnhancedQAPair) => sum + p.confidence, 0) / pairs.length
      };
    });

    return enhancements;
  }

  /**
   * Get scenario description
   */
  private getScenarioDescription(scenario: string): string {
    const descriptions: any = {
      'A': 'Bayi Baru Lahir (Normal Process)',
      'B': 'Keterlambatan Pelaporan',
      'C': 'Dokumen Hilang/Rusak',
      'D': 'Pembetulan/Koreksi Data',
      'E': 'Kelahiran di Luar Negeri',
      'special_case': 'Kasus Khusus (Nikah Siri, Ibu Tunggal, dll)'
    };

    return descriptions[scenario] || 'Unknown Scenario';
  }

  /**
   * Extract common keywords from pairs
   */
  private extractCommonKeywords(pairs: EnhancedQAPair[]): string[] {
    const keywordCounts: any = {};
    
    pairs.forEach(pair => {
      pair.keywords.forEach(keyword => {
        const lowerKeyword = keyword.toLowerCase();
        keywordCounts[lowerKeyword] = (keywordCounts[lowerKeyword] || 0) + 1;
      });
    });

    // Return keywords that appear in at least 20% of pairs
    const threshold = Math.max(1, Math.floor(pairs.length * 0.2));
    return Object.keys(keywordCounts).filter(keyword => keywordCounts[keyword] >= threshold);
  }

  /**
   * Generate integration report
   */
  private generateIntegrationReport(): void {
    this.integrationResults.integrationDuration = performance.now() - this.startTime;
    this.integrationResults.status = 'SUCCESS';

    const reportPath = path.join(process.cwd(), 'docs/training-reports/qa-knowledge-integration-report.json');
    
    const report = {
      integrationType: 'Q&A Knowledge Service Integration',
      timestamp: new Date().toISOString(),
      results: this.integrationResults,
      summary: {
        status: this.integrationResults.status,
        message: `Successfully integrated ${this.integrationResults.totalPairsIntegrated} Q&A pairs into knowledge service`,
        expectedImpact: 'Enhanced pattern matching and response accuracy for real-world queries',
        newCapabilities: [
          'Comprehensive nikah siri guidance',
          'Complete ibu tunggal support',
          'WNA-WNI marriage documentation',
          'Legal reference integration',
          'Enhanced scenario detection'
        ]
      },
      metrics: {
        totalPairsIntegrated: this.integrationResults.totalPairsIntegrated,
        specialCasesAdded: this.integrationResults.specialCasesAdded,
        newPatternsAdded: this.integrationResults.newPatternsAdded,
        scenarioEnhancements: this.integrationResults.scenarioEnhancements,
        integrationDuration: `${(this.integrationResults.integrationDuration / 1000).toFixed(2)}s`
      },
      nextSteps: [
        'Test integrated responses with sample queries',
        'Monitor accuracy improvements in production',
        'Collect user feedback on new capabilities',
        'Plan additional Q&A training based on usage patterns'
      ]
    };

    // Ensure directory exists
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 [QA_INTEGRATOR] Integration report saved to: ${reportPath}`);
  }

  /**
   * Execute complete integration process
   */
  public async executeIntegration(): Promise<void> {
    try {
      console.log('🚀 [QA_INTEGRATOR] Starting Q&A Knowledge Service Integration...');
      
      // Step 1: Load enhanced Q&A data
      this.loadEnhancedQAData();
      
      // Step 2: Update knowledge service
      console.log('🔄 [QA_INTEGRATOR] Updating knowledge service with Q&A data...');
      await this.updateKnowledgeService();
      
      // Step 3: Generate integration report
      this.generateIntegrationReport();
      
      console.log('🎉 [QA_INTEGRATOR] Q&A Knowledge Service integration completed successfully!');
      console.log(`📊 [QA_INTEGRATOR] Integration Summary:`);
      console.log(`   📚 Total Pairs Integrated: ${this.integrationResults.totalPairsIntegrated}`);
      console.log(`   🎯 Special Cases Added: ${this.integrationResults.specialCasesAdded}`);
      console.log(`   🔍 New Patterns Added: ${this.integrationResults.newPatternsAdded}`);
      console.log(`   📈 Scenario Enhancements: ${this.integrationResults.scenarioEnhancements}`);
      console.log(`   ⏱️ Integration Duration: ${(this.integrationResults.integrationDuration / 1000).toFixed(2)}s`);
      
    } catch (error) {
      console.error('❌ [QA_INTEGRATOR] Integration failed:', error);
      this.integrationResults.status = 'FAILED';
      throw error;
    }
  }
}

// Execute integration if run directly
if (require.main === module) {
  const integrator = new QAKnowledgeServiceIntegrator();
  integrator.executeIntegration()
    .then(() => {
      console.log('🎉 Integration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Integration failed:', error);
      process.exit(1);
    });
}

export { QAKnowledgeServiceIntegrator };
