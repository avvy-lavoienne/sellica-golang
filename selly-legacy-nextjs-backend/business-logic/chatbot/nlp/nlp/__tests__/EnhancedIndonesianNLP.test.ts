/**
 * Enhanced Indonesian NLP Tests - Day 21-22: Phase 3 Advanced Features
 * Comprehensive testing for Enhanced Indonesian NLP capabilities
 * Validates cultural context, entity extraction, sentiment analysis, and intent classification
 */

import { enhancedIndonesianNLP, EnhancedNLPResult } from '../EnhancedIndonesianNLP';

describe('Enhanced Indonesian NLP', () => {
  beforeAll(async () => {
    await enhancedIndonesianNLP.initialize();
  });

  describe('Cultural Context Processing', () => {
    test('should detect Jakarta dialect', async () => {
      const query = 'Gue mau bikin KTP nih, gimana caranya dong?';
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      expect(result.culturalContext.region.name).toBe('jakarta');
      expect(result.culturalContext.formality.level).toBe('very_informal');
      expect(result.culturalContext.confidence).toBeGreaterThan(0.7);
    });

    test('should detect Javanese influence', async () => {
      const query = 'Monggo mas, saya ingin mengurus dokumen KTP';
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      expect(result.culturalContext.region.name).toBe('javanese');
      expect(result.culturalContext.formality.level).toBe('formal');
      expect(result.culturalContext.confidence).toBeGreaterThan(0.6);
    });

    test('should detect formal language', async () => {
      const query = 'Dengan hormat, mohon bantuan untuk proses pembuatan akta kelahiran';
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      expect(result.culturalContext.formality.level).toBe('very_formal');
      expect(result.culturalContext.confidence).toBeGreaterThan(0.8);
    });

    test('should detect informal language', async () => {
      const query = 'Makasih ya, udah bantu gue kemarin';
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      expect(result.culturalContext.formality.level).toBe('informal');
      expect(result.culturalContext.confidence).toBeGreaterThan(0.6);
    });
  });

  describe('Administrative Entity Extraction', () => {
    test('should extract document types', async () => {
      const query = 'Saya ingin mengurus KTP dan SIM sekaligus';
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      const documentEntities = result.entities.filter(e => e.type === 'DOCUMENT_TYPE');
      expect(documentEntities).toHaveLength(2);
      
      const docTypes = documentEntities.map(e => e.subtype);
      expect(docTypes).toContain('ktp');
      expect(docTypes).toContain('sim');
    });

    test('should extract NIK (Indonesian ID)', async () => {
      const query = 'NIK saya 1234567890123456, tolong cek status KTP';
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      const nikEntities = result.entities.filter(e => e.type === 'PERSONAL_ID' && e.subtype === 'NIK');
      expect(nikEntities).toHaveLength(1);
      expect(nikEntities[0].value).toBe('1234567890123456');
      expect(nikEntities[0].confidence).toBeGreaterThan(0.9);
    });

    test('should extract phone numbers', async () => {
      const query = 'Hubungi saya di 081234567890 untuk konfirmasi';
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      const phoneEntities = result.entities.filter(e => e.type === 'CONTACT' && e.subtype === 'PHONE');
      expect(phoneEntities).toHaveLength(1);
      expect(phoneEntities[0].value).toBe('081234567890');
    });

    test('should extract government institutions', async () => {
      const query = 'Saya ke Disdukcapil kemarin tapi belum selesai';
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      const institutionEntities = result.entities.filter(e => e.type === 'GOVERNMENT_INSTITUTION');
      expect(institutionEntities).toHaveLength(1);
      expect(institutionEntities[0].value.toLowerCase()).toContain('disdukcapil');
    });
  });

  describe('Sentiment Analysis', () => {
    test('should detect positive sentiment', async () => {
      const query = 'Terima kasih banyak, pelayanannya sangat baik dan memuaskan';
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      expect(result.sentiment.polarity).toBe('positive');
      expect(result.sentiment.confidence).toBeGreaterThan(0.7);
      expect(result.sentiment.score).toBeGreaterThan(0);
    });

    test('should detect negative sentiment', async () => {
      const query = 'Pelayanan buruk sekali, saya sangat kecewa dengan prosesnya';
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      expect(result.sentiment.polarity).toBe('negative');
      expect(result.sentiment.confidence).toBeGreaterThan(0.7);
      expect(result.sentiment.score).toBeLessThan(0);
    });

    test('should detect urgency levels', async () => {
      const query = 'Tolong segera proses dokumen saya, ini sangat mendesak!';
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      expect(['high', 'critical']).toContain(result.sentiment.urgency.level);
      expect(result.sentiment.urgency.confidence).toBeGreaterThan(0.6);
    });

    test('should detect emotions', async () => {
      const query = 'Saya sangat senang dan gembira dengan pelayanan ini';
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      const joyEmotions = result.sentiment.emotions.filter(e => e.emotion === 'joy');
      expect(joyEmotions).toHaveLength(1);
      expect(joyEmotions[0].confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Intent Classification', () => {
    test('should classify document application intent', async () => {
      const query = 'Saya ingin mengajukan pembuatan KTP baru';
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      expect(result.intent.primary).toBe('document_application');
      expect(result.intent.confidence).toBeGreaterThan(0.7);
      expect(result.intent.parameters.documentType).toBe('ktp');
    });

    test('should classify document renewal intent', async () => {
      const query = 'Bagaimana cara perpanjang SIM yang sudah habis?';
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      expect(result.intent.primary).toBe('document_renewal');
      expect(result.intent.confidence).toBeGreaterThan(0.7);
    });

    test('should classify status check intent', async () => {
      const query = 'Cek status pengajuan paspor saya dong';
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      expect(result.intent.primary).toBe('status_check');
      expect(result.intent.confidence).toBeGreaterThan(0.7);
    });

    test('should classify requirement inquiry intent', async () => {
      const query = 'Apa saja syarat untuk membuat NPWP?';
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      expect(result.intent.primary).toBe('requirement_inquiry');
      expect(result.intent.confidence).toBeGreaterThan(0.7);
    });

    test('should classify complaint intent', async () => {
      const query = 'Saya mau komplain, pelayanannya lambat sekali';
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      expect(result.intent.primary).toBe('complaint');
      expect(result.intent.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Text Preprocessing', () => {
    test('should normalize Indonesian slang', async () => {
      const query = 'Gue gak tau gimana caranya bikin KTP';
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      // Check if slang was normalized in processed text
      expect(result.processedText).toContain('saya');
      expect(result.processedText).toContain('tidak');
      expect(result.processedText).toContain('bagaimana');
      expect(result.processedText).toContain('membuat');
    });

    test('should handle compound words', async () => {
      const query = 'Kartu tanda penduduk saya hilang';
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      // Should recognize compound word as KTP
      const ktpEntities = result.entities.filter(e => 
        e.type === 'DOCUMENT_TYPE' && e.subtype === 'ktp'
      );
      expect(ktpEntities).toHaveLength(1);
    });
  });

  describe('Performance and Caching', () => {
    test('should process queries within acceptable time', async () => {
      const query = 'Saya ingin mengurus dokumen KTP dengan segera';
      const startTime = performance.now();
      
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      const processingTime = performance.now() - startTime;
      expect(processingTime).toBeLessThan(1000); // Should be under 1 second
      expect(result.processingTime).toBeLessThan(500); // Internal processing under 500ms
    });

    test('should use caching for repeated queries', async () => {
      const query = 'Test caching untuk query yang sama';
      
      // First call
      const result1 = await enhancedIndonesianNLP.processIndonesianText(query);
      
      // Second call (should be cached)
      const startTime = performance.now();
      const result2 = await enhancedIndonesianNLP.processIndonesianText(query);
      const cachedTime = performance.now() - startTime;
      
      expect(cachedTime).toBeLessThan(50); // Cached call should be very fast
      expect(result1.originalText).toBe(result2.originalText);
    });
  });

  describe('Complex Query Analysis', () => {
    test('should handle complex administrative query', async () => {
      const query = 'Pak, saya mau tanya nih. Gimana caranya bikin KTP baru ya? NIK saya 1234567890123456. Tolong bantu dong, ini urgent soalnya.';
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      // Should detect multiple aspects
      expect(result.culturalContext.region.name).toBe('jakarta'); // 'nih', 'dong'
      expect(result.culturalContext.formality.level).toBe('informal'); // 'gimana', 'dong'
      
      // Should extract entities
      const documentEntities = result.entities.filter(e => e.type === 'DOCUMENT_TYPE');
      const nikEntities = result.entities.filter(e => e.type === 'PERSONAL_ID');
      expect(documentEntities).toHaveLength(1);
      expect(nikEntities).toHaveLength(1);
      
      // Should classify intent
      expect(result.intent.primary).toBe('document_application');
      
      // Should detect urgency
      expect(['medium', 'high']).toContain(result.sentiment.urgency.level);
      
      // Should have high overall confidence
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should handle formal government communication', async () => {
      const query = 'Dengan hormat, mohon bantuan Bapak/Ibu untuk proses pembuatan akta kelahiran anak. Dokumen persyaratan sudah lengkap. Terima kasih atas perhatiannya.';
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      // Should detect very formal language
      expect(result.culturalContext.formality.level).toBe('very_formal');
      
      // Should detect document type
      const documentEntities = result.entities.filter(e => e.type === 'DOCUMENT_TYPE');
      expect(documentEntities).toHaveLength(1);
      expect(documentEntities[0].subtype).toBe('akta_kelahiran');
      
      // Should classify as document application
      expect(result.intent.primary).toBe('document_application');
      
      // Should detect positive/polite sentiment
      expect(result.sentiment.culturalContext.politenessLevel).toBeGreaterThan(0.8);
      expect(result.sentiment.culturalContext.respectLevel).toBeGreaterThan(0.8);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty query', async () => {
      const query = '';
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.entities).toHaveLength(0);
    });

    test('should handle non-Indonesian text', async () => {
      const query = 'Hello, how can I help you today?';
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      // Should still process but with lower confidence
      expect(result.confidence).toBeLessThan(0.7);
      expect(result.culturalContext.region.name).toBe('standard');
    });

    test('should handle mixed language text', async () => {
      const query = 'Saya ingin apply untuk KTP baru, please help me';
      const result = await enhancedIndonesianNLP.processIndonesianText(query);
      
      // Should still extract Indonesian entities
      const documentEntities = result.entities.filter(e => e.type === 'DOCUMENT_TYPE');
      expect(documentEntities).toHaveLength(1);
      
      // Should classify intent based on Indonesian content
      expect(result.intent.primary).toBe('document_application');
    });
  });

  describe('Statistics and Monitoring', () => {
    test('should provide processing statistics', () => {
      const stats = enhancedIndonesianNLP.getProcessingStatistics();
      
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('cacheHitRate');
      expect(stats).toHaveProperty('averageProcessingTime');
      expect(stats).toHaveProperty('isInitialized');
      expect(stats).toHaveProperty('modelVersion');
      
      expect(stats.isInitialized).toBe(true);
      expect(typeof stats.cacheHitRate).toBe('number');
      expect(typeof stats.averageProcessingTime).toBe('number');
    });
  });
});

// Helper function for test expectations
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});
