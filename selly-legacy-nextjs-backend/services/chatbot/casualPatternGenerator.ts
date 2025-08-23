/**
 * Casual Pattern Generator Service
 * Automatically generates casual Indonesian language patterns for any document type
 * Enhanced with KTP scenario support for conversational A, B, C, D flow
 */

export interface DocumentConfig {
  documentType: string;
  documentNames: string[];
  actions: string[];
  aliases?: string[];
}

export interface ScenarioResponse {
  scenarioId: string;
  patterns: string[];
  confidence: number;
}

export interface CasualTemplate {
  category: string;
  pattern: string;
  description: string;
}

export class CasualPatternGenerator {
  private casualTemplates: Record<string, CasualTemplate[]> = {
    // Intention patterns - expressing desire/want
    intention: [
      { category: 'intention', pattern: 'aku.*mau.*{action}.*{document}', description: 'I want to {action} {document}' },
      { category: 'intention', pattern: 'saya.*mau.*{action}.*{document}', description: 'I want to {action} {document} (formal)' },
      { category: 'intention', pattern: 'pengen.*{action}.*{document}', description: 'Want to {action} {document}' },
      { category: 'intention', pattern: 'butuh.*{document}', description: 'Need {document}' },
      { category: 'intention', pattern: 'perlu.*{document}', description: 'Need {document} (formal)' },
      { category: 'intention', pattern: 'mau.*{action}.*{document}', description: 'Want to {action} {document}' },
      { category: 'intention', pattern: 'aku.*pengen.*{action}.*{document}', description: 'I want to {action} {document}' }
    ],

    // Question patterns - asking about requirements
    questions: [
      { category: 'questions', pattern: 'eh.*{action}.*{document}.*syaratnya', description: 'Hey, what are the requirements for {action} {document}?' },
      { category: 'questions', pattern: 'kalo.*{action}.*{document}.*perlu', description: 'If {action} {document}, what is needed?' },
      { category: 'questions', pattern: 'syarat.*{action}.*{document}.*apa.*aja.*sih', description: 'What are the requirements for {action} {document}?' },
      { category: 'questions', pattern: 'cara.*{action}.*{document}.*gitu', description: 'How to {action} {document}?' },
      { category: 'questions', pattern: 'eh.*{action}.*{document}.*butuh.*apa', description: 'Hey, what is needed to {action} {document}?' },
      { category: 'questions', pattern: '{action}.*{document}.*gimana.*caranya', description: 'How to {action} {document}?' }
    ],

    // Requirement patterns - asking about documents/requirements
    requirements: [
      { category: 'requirements', pattern: '{action}.*{document}.*butuh.*apa.*aja', description: '{action} {document} needs what?' },
      { category: 'requirements', pattern: 'syarat.*buat.*{document}.*apa.*aja', description: 'What are the requirements for {document}?' },
      { category: 'requirements', pattern: 'dokumen.*apa.*yang.*kudu.*dibawa', description: 'What documents need to be brought?' },
      { category: 'requirements', pattern: 'apa.*yang.*harus.*disiapin', description: 'What needs to be prepared?' },
      { category: 'requirements', pattern: 'apa.*aja.*yang.*dibutuhin', description: 'What is needed?' },
      { category: 'requirements', pattern: 'dokumen.*apa.*yang.*diperlukan', description: 'What documents are required?' },
      { category: 'requirements', pattern: 'apa.*yang.*kudu.*aku.*siapin', description: 'What do I need to prepare?' }
    ],

    // Institution patterns - mentioning Disdukcapil
    institution: [
      { category: 'institution', pattern: '{action}.*{document}.*disdukcapil.*dibutuhin', description: '{action} {document} at Disdukcapil, what is needed?' },
      { category: 'institution', pattern: 'ngurus.*{document}.*di.*disdukcapil.*butuh', description: 'Processing {document} at Disdukcapil needs what?' },
      { category: 'institution', pattern: 'syarat.*{action}.*{document}.*disdukcapil', description: 'Requirements for {action} {document} at Disdukcapil' },
      { category: 'institution', pattern: 'buat.*{document}.*di.*disdukcapil.*apa', description: 'Making {document} at Disdukcapil, what is needed?' },
      { category: 'institution', pattern: 'eh.*{action}.*{document}.*disdukcapil.*perlu', description: 'Hey, {action} {document} at Disdukcapil needs what?' }
    ],

    // Process patterns - asking about procedures
    process: [
      { category: 'process', pattern: 'kalo.*mau.*{action}.*{document}', description: 'If want to {action} {document}' },
      { category: 'process', pattern: 'mau.*{action}.*{document}.*apa.*dibawa', description: 'Want to {action} {document}, what to bring?' },
      { category: 'process', pattern: 'aku.*mau.*{action}.*{document}.*perlu', description: 'I want to {action} {document}, what is needed?' },
      { category: 'process', pattern: '{action}.*{document}.*harus.*bawa.*apa', description: '{action} {document}, what must be brought?' },
      { category: 'process', pattern: 'prosedur.*{action}.*{document}.*gimana', description: 'How is the procedure for {action} {document}?' }
    ],

    // Casual expressions - very informal
    casual: [
      { category: 'casual', pattern: 'eh.*{action}.*{document}.*itu.*syaratnya.*apa', description: 'Hey, what are the requirements for {action} {document}?' },
      { category: 'casual', pattern: 'syarat.*{action}.*{document}.*apa.*aja.*bro', description: 'What are the requirements for {action} {document}, bro?' },
      { category: 'casual', pattern: 'aku.*pengen.*{action}.*{document}.*kudu', description: 'I want to {action} {document}, what is needed?' },
      { category: 'casual', pattern: 'mau.*{action}.*{document}.*syaratnya.*sih', description: 'Want to {action} {document}, what are the requirements?' },
      { category: 'casual', pattern: '{action}.*{document}.*baru.*butuh.*apa.*aja.*ya', description: '{action} new {document}, what is needed?' }
    ],

    // Sahabat Adminduk persona patterns - friendly, helpful tone
    persona: [
      { category: 'persona', pattern: 'kak.*{action}.*{document}', description: 'Kak wants to {action} {document} (friendly address)' },
      { category: 'persona', pattern: 'tolong.*bantu.*{action}.*{document}', description: 'Please help {action} {document}' },
      { category: 'persona', pattern: 'minta.*bantuan.*{action}.*{document}', description: 'Ask for help {action} {document}' },
      { category: 'persona', pattern: 'bisa.*bantu.*{action}.*{document}', description: 'Can you help {action} {document}?' },
      { category: 'persona', pattern: 'mohon.*bantuan.*{action}.*{document}', description: 'Request help {action} {document} (formal)' },
      { category: 'persona', pattern: 'selly.*{action}.*{document}', description: 'SELLY help with {action} {document}' },
      { category: 'persona', pattern: 'sahabat.*adminduk.*{action}.*{document}', description: 'Sahabat Adminduk help with {action} {document}' }
    ],

    // Training data enhanced patterns - based on successful training pairs
    training_enhanced: [
      { category: 'training_enhanced', pattern: 'anak.*luar.*nikah.*{document}', description: 'Child out of wedlock {document} (special case)' },
      { category: 'training_enhanced', pattern: 'kelahiran.*terlambat.*{document}', description: 'Late birth registration {document}' },
      { category: 'training_enhanced', pattern: 'data.*salah.*{document}', description: 'Wrong data in {document}' },
      { category: 'training_enhanced', pattern: 'pertama.*kali.*{action}.*{document}', description: 'First time {action} {document}' },
      { category: 'training_enhanced', pattern: 'tidak.*yakin.*{action}.*{document}', description: 'Not sure about {action} {document}' },
      { category: 'training_enhanced', pattern: 'luar.*negeri.*{document}', description: 'Overseas {document}' }
    ]
  };

  /**
   * Generate casual patterns for a specific document type
   */
  public generatePatternsForDocument(config: DocumentConfig): RegExp[] {
    const patterns: RegExp[] = [];

    // Generate patterns for each template category
    Object.values(this.casualTemplates).forEach(templateGroup => {
      templateGroup.forEach(template => {
        config.actions.forEach(action => {
          config.documentNames.forEach(document => {
            const pattern = this.createPattern(template.pattern, action, document);
            patterns.push(pattern);
          });
        });
      });
    });

    return patterns;
  }

  /**
   * Create a regex pattern by replacing placeholders
   */
  private createPattern(template: string, action: string, document: string): RegExp {
    const patternString = template
      .replace(/\{action\}/g, action)
      .replace(/\{document\}/g, document);
    
    return new RegExp(patternString, 'i');
  }

  /**
   * Generate test queries for validation
   */
  public generateTestQueries(config: DocumentConfig): string[] {
    const testQueries: string[] = [];

    // Generate sample queries based on templates
    const sampleTemplates = [
      'aku mau {action} {document}',
      'eh, {action} {document} syaratnya apa?',
      'syarat buat {document} apa aja sih?',
      '{action} {document} butuh apa aja?',
      'kalo mau {action} {document}, apa yang harus dibawa?',
      'cara {action} {document} gimana?',
      'aku pengen {action} {document}, dokumennya apa?',
      'mau {action} {document} di disdukcapil, butuh apa aja?',
      'eh, {action} {document} itu syaratnya apa aja?',
      'syarat {action} {document} apa aja, bro?'
    ];

    sampleTemplates.forEach(template => {
      config.actions.forEach(action => {
        config.documentNames.forEach(document => {
          const query = template
            .replace(/\{action\}/g, action)
            .replace(/\{document\}/g, document);
          testQueries.push(query);
        });
      });
    });

    return testQueries;
  }

  /**
   * Test pattern matching for a document configuration
   */
  public testPatternMatching(config: DocumentConfig): {
    totalPatterns: number;
    testQueries: string[];
    matchResults: { query: string; matched: boolean }[];
    successRate: number;
  } {
    const patterns = this.generatePatternsForDocument(config);
    const testQueries = this.generateTestQueries(config);
    
    const matchResults = testQueries.map(query => ({
      query,
      matched: patterns.some(pattern => pattern.test(query))
    }));

    const successCount = matchResults.filter(result => result.matched).length;
    const successRate = (successCount / matchResults.length) * 100;

    return {
      totalPatterns: patterns.length,
      testQueries,
      matchResults,
      successRate
    };
  }

  /**
   * Get pattern statistics for a document configuration
   */
  public getPatternStats(config: DocumentConfig): {
    totalPatterns: number;
    patternsByCategory: Record<string, number>;
    documentVariations: number;
    actionVariations: number;
  } {
    const patterns = this.generatePatternsForDocument(config);

    const patternsByCategory: Record<string, number> = {};
    Object.keys(this.casualTemplates).forEach(category => {
      const categoryPatterns = this.casualTemplates[category].length;
      const variations = config.actions.length * config.documentNames.length;
      patternsByCategory[category] = categoryPatterns * variations;
    });

    return {
      totalPatterns: patterns.length,
      patternsByCategory,
      documentVariations: config.documentNames.length,
      actionVariations: config.actions.length
    };
  }

  /**
   * Check if query matches KTP scenario response patterns
   */
  public isKTPScenarioResponse(query: string): ScenarioResponse | null {
    // Import KTP scenario patterns dynamically to avoid circular dependency
    try {
      const { getScenarioFromQuery } = require('./ktpScenarioPatterns');
      const scenarioId = getScenarioFromQuery(query);

      if (scenarioId) {
        return {
          scenarioId,
          patterns: [query],
          confidence: 0.95
        };
      }
    } catch (error: any) {
      console.warn('KTP scenario patterns not available:', error?.message || 'Unknown error');
    }

    return null;
  }

  /**
   * Check if query matches Akta Kelahiran scenario response patterns
   */
  public isAktaKelahiranScenarioResponse(query: string): ScenarioResponse | null {
    // Import Akta Kelahiran scenario patterns dynamically to avoid circular dependency
    try {
      const { getAktaKelahiranScenarioFromQuery } = require('./aktaKelahiranScenarioPatterns');
      const scenarioId = getAktaKelahiranScenarioFromQuery(query);

      if (scenarioId) {
        return {
          scenarioId,
          patterns: [query],
          confidence: 0.95
        };
      }
    } catch (error: any) {
      console.warn('Akta Kelahiran scenario patterns not available:', error?.message || 'Unknown error');
    }

    return null;
  }

  /**
   * Generate KTP scenario test patterns
   */
  public generateKTPScenarioTests(): string[] {
    try {
      const { generateKTPScenarioTestQueries } = require('./ktpScenarioPatterns');
      return generateKTPScenarioTestQueries();
    } catch (error: any) {
      console.warn('KTP scenario test generation not available:', error?.message || 'Unknown error');
      return [];
    }
  }
}

// Export singleton instance
export const casualPatternGenerator = new CasualPatternGenerator();
