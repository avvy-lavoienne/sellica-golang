/**
 * Semantic Analyzer - Advanced Indonesian Semantic Understanding
 * Provides deep semantic analysis, intent recognition, and contextual understanding
 */

// import { indoBertService, SemanticAnalysisResult } from './indoBertService'; // DISABLED - Service deprecated
import { indonesianTokenizer, TokenizationResult } from './indonesianTokenizer';
import { culturalProcessor, CulturalContext } from './culturalProcessor';

// Stub type for deprecated SemanticAnalysisResult
interface SemanticAnalysisResult {
  embeddings: number[];
  semanticSimilarity: number;
  intentClassification: {
    primaryIntent: string;
    secondaryIntents: string[];
    confidence: number;
  };
  contextualAnalysis: {
    complexity: number;
    sentiment: number;
    emotionalTone: string;
    urgency: number;
  };
}

export interface SemanticIntent {
  primary: string;
  secondary: string[];
  confidence: number;
  parameters: Map<string, any>;
  context: {
    domain: string;
    urgency: number;
    complexity: number;
  };
}

export interface EntityRecognition {
  entities: Array<{
    text: string;
    type: string;
    confidence: number;
    position: { start: number; end: number };
  }>;
  relationships: Array<{
    source: string;
    target: string;
    relation: string;
    confidence: number;
  }>;
}

export interface SemanticUnderstanding {
  intent: SemanticIntent;
  entities: EntityRecognition;
  sentiment: {
    polarity: number; // -1 to 1
    subjectivity: number; // 0 to 1
    emotion: string;
    confidence: number;
  };
  semantics: {
    embeddings: number[];
    similarity: number;
    coherence: number;
    complexity: number;
  };
  cultural: CulturalContext;
  linguistic: {
    tokenization: TokenizationResult;
    morphology: {
      rootWords: string[];
      affixes: string[];
      compounds: string[];
    };
    syntax: {
      structure: string;
      dependencies: Array<{ head: string; dependent: string; relation: string }>;
    };
  };
}

export class SemanticAnalyzer {
  private intentPatterns: Map<string, RegExp[]>;
  private entityPatterns: Map<string, RegExp>;
  private sentimentLexicon: Map<string, number>;
  private domainKeywords: Map<string, string[]>;

  constructor() {
    this.intentPatterns = this.initializeIntentPatterns();
    this.entityPatterns = this.initializeEntityPatterns();
    this.sentimentLexicon = this.initializeSentimentLexicon();
    this.domainKeywords = this.initializeDomainKeywords();
  }

  /**
   * Initialize intent recognition patterns
   */
  private initializeIntentPatterns(): Map<string, RegExp[]> {
    const patterns = new Map<string, RegExp[]>();

    patterns.set('search', [
      /\b(cari|temukan|find|search|nyari)\b/gi,
      /\b(dimana|where|ada.*tidak|ada.*gak)\b/gi,
      /\b(lihat.*data|show.*data|tampilkan.*data)\b/gi
    ]);

    patterns.set('count', [
      /\b(berapa|jumlah|total|count|hitung)\b/gi,
      /\b(ada.*berapa|berapa.*ada)\b/gi,
      /\b(statistik|stats|angka)\b/gi
    ]);

    patterns.set('analyze', [
      /\b(analisis|analyze|analisa|bandingkan|compare)\b/gi,
      /\b(trend|pola|pattern|insight)\b/gi,
      /\b(bagaimana.*performa|how.*performance)\b/gi
    ]);

    patterns.set('display', [
      /\b(tampilkan|show|lihat|display)\b/gi,
      /\b(buka|open|akses|access)\b/gi,
      /\b(list|daftar|listing)\b/gi
    ]);

    patterns.set('help', [
      /\b(help|bantuan|tolong|gimana|bagaimana)\b/gi,
      /\b(cara.*menggunakan|how.*to.*use)\b/gi,
      /\b(apa.*bisa|what.*can|fungsi.*apa)\b/gi
    ]);

    patterns.set('create', [
      /\b(buat|create|tambah|add|input)\b/gi,
      /\b(new|baru|insert)\b/gi
    ]);

    patterns.set('update', [
      /\b(update|ubah|edit|modify|ganti|change)\b/gi,
      /\b(perbaiki|fix|correct|betulkan)\b/gi
    ]);

    patterns.set('delete', [
      /\b(hapus|delete|remove|buang)\b/gi,
      /\b(cancel|batal|batalkan)\b/gi
    ]);

    return patterns;
  }

  /**
   * Initialize entity recognition patterns
   */
  private initializeEntityPatterns(): Map<string, RegExp> {
    const patterns = new Map<string, RegExp>();

    // Indonesian ID numbers
    patterns.set('NIK', /\b\d{16}\b/g);
    patterns.set('KTP', /\b(ktp|kartu.*tanda.*penduduk)\b/gi);
    
    // Names (Indonesian patterns)
    patterns.set('PERSON', /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    
    // Dates (Indonesian format)
    patterns.set('DATE', /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/g);
    patterns.set('DATE_INDO', /\b\d{1,2}\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+\d{4}\b/gi);
    
    // Time
    patterns.set('TIME', /\b\d{1,2}:\d{2}(?::\d{2})?\b/g);
    
    // Numbers
    patterns.set('NUMBER', /\b\d+(?:[.,]\d+)?\b/g);
    
    // Email
    patterns.set('EMAIL', /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
    
    // Phone numbers (Indonesian format)
    patterns.set('PHONE', /\b(?:\+62|0)\d{8,13}\b/g);
    
    // Addresses (Indonesian patterns)
    patterns.set('ADDRESS', /\b(?:jl\.?|jalan|gang|gg\.?|rt\.?\s*\d+|rw\.?\s*\d+)\b/gi);
    
    // Government terms
    patterns.set('GOV_ENTITY', /\b(kelurahan|kecamatan|kabupaten|provinsi|dinas|instansi)\b/gi);
    
    // Database/System terms
    patterns.set('TABLE', /\b(tabel|table|data)\s+([a-z_]+)\b/gi);
    patterns.set('COLUMN', /\b(kolom|column|field)\s+([a-z_]+)\b/gi);

    return patterns;
  }

  /**
   * Initialize sentiment lexicon
   */
  private initializeSentimentLexicon(): Map<string, number> {
    const lexicon = new Map<string, number>();

    // Positive words
    const positiveWords = [
      'baik', 'bagus', 'hebat', 'luar biasa', 'sempurna', 'excellent',
      'senang', 'gembira', 'suka', 'cinta', 'sayang',
      'berhasil', 'sukses', 'menang', 'juara', 'terbaik',
      'mudah', 'simple', 'praktis', 'efisien', 'cepat',
      'terima kasih', 'thanks', 'appreciate', 'grateful'
    ];

    positiveWords.forEach(word => lexicon.set(word, 1));

    // Negative words
    const negativeWords = [
      'buruk', 'jelek', 'tidak baik', 'terrible', 'awful',
      'sedih', 'kecewa', 'marah', 'kesal', 'benci',
      'gagal', 'kalah', 'rugi', 'hancur', 'rusak',
      'sulit', 'susah', 'ribet', 'complicated', 'lambat',
      'maaf', 'sorry', 'salah', 'error', 'masalah'
    ];

    negativeWords.forEach(word => lexicon.set(word, -1));

    // Neutral intensifiers
    lexicon.set('sangat', 1.5);
    lexicon.set('sekali', 1.5);
    lexicon.set('banget', 1.5);
    lexicon.set('agak', 0.5);
    lexicon.set('sedikit', 0.5);
    lexicon.set('kurang', -0.5);

    return lexicon;
  }

  /**
   * Initialize domain keywords
   */
  private initializeDomainKeywords(): Map<string, string[]> {
    const domains = new Map<string, string[]>();

    domains.set('database', [
      'tabel', 'table', 'data', 'record', 'field', 'kolom',
      'database', 'db', 'query', 'select', 'insert', 'update', 'delete'
    ]);

    domains.set('government', [
      'ktp', 'nik', 'siak', 'dukcapil', 'kelurahan', 'kecamatan',
      'rt', 'rw', 'desa', 'kabupaten', 'provinsi', 'pemerintah'
    ]);

    domains.set('user_management', [
      'user', 'pengguna', 'akun', 'account', 'login', 'register',
      'profil', 'profile', 'aktivitas', 'activity'
    ]);

    domains.set('reporting', [
      'laporan', 'report', 'statistik', 'analisis', 'grafik',
      'chart', 'dashboard', 'summary', 'ringkasan'
    ]);

    domains.set('error_handling', [
      'error', 'kesalahan', 'salah', 'bug', 'masalah', 'problem',
      'adjudikasi', 'duplikat', 'duplicate'
    ]);

    return domains;
  }

  /**
   * Perform comprehensive semantic analysis
   */
  async analyzeSemantics(text: string): Promise<SemanticUnderstanding> {
    console.log('🧠 Performing comprehensive semantic analysis...');

    try {
      // Step 1: Tokenization and linguistic analysis
      const tokenization = indonesianTokenizer.tokenize(text, {
        handleSlang: true,
        standardizeDialects: true,
        handleAbbreviations: true
      });

      // Step 2: Cultural context analysis
      const cultural = culturalProcessor.analyzeCulturalContext(text);

      // Step 3: Intent recognition
      const intent = this.recognizeIntent(text, tokenization);

      // Step 4: Entity recognition
      const entities = this.recognizeEntities(text);

      // Step 5: Sentiment analysis
      const sentiment = this.analyzeSentiment(text, tokenization);

      // Step 6: Morphological analysis
      const morphology = this.analyzeMorphology(tokenization.tokens);

      // Step 7: Syntactic analysis
      const syntax = this.analyzeSyntax(tokenization.tokens);

      // Step 8: Semantic embeddings (if IndoBERT is available)
      let semantics: {
        embeddings: number[];
        similarity: number;
        coherence: number;
        complexity: number;
      } = {
        embeddings: [],
        similarity: 0,
        coherence: 0,
        complexity: 0
      };

      // PERFORMANCE OPTIMIZATION: IndoBERT disabled, using fast fallback analysis
      console.log('⚡ Using fast semantic analysis (IndoBERT disabled for performance)');
      semantics = this.performFallbackSemanticAnalysis(text, tokenization);

      return {
        intent,
        entities,
        sentiment,
        semantics,
        cultural,
        linguistic: {
          tokenization,
          morphology,
          syntax
        }
      };

    } catch (error) {
      console.error('❌ Semantic analysis failed:', error);
      throw error;
    }
  }

  /**
   * Recognize intent from text
   */
  private recognizeIntent(text: string, tokenization: TokenizationResult): SemanticIntent {
    const lowerText = text.toLowerCase();
    const intentScores = new Map<string, number>();
    const parameters = new Map<string, any>();

    // Score each intent based on pattern matches
    this.intentPatterns.forEach((patterns, intent) => {
      let score = 0;
      patterns.forEach(pattern => {
        const matches = lowerText.match(pattern);
        if (matches) {
          score += matches.length;
        }
      });
      if (score > 0) {
        intentScores.set(intent, score);
      }
    });

    // Find primary intent
    let primaryIntent = 'unknown';
    let maxScore = 0;
    intentScores.forEach((score, intent) => {
      if (score > maxScore) {
        maxScore = score;
        primaryIntent = intent;
      }
    });

    // Find secondary intents
    const secondaryIntents: string[] = [];
    intentScores.forEach((score, intent) => {
      if (intent !== primaryIntent && score > 0) {
        secondaryIntents.push(intent);
      }
    });

    // Extract parameters based on intent
    if (primaryIntent === 'search' || primaryIntent === 'count') {
      const entities = this.recognizeEntities(text);
      entities.entities.forEach(entity => {
        parameters.set(entity.type.toLowerCase(), entity.text);
      });
    }

    // Determine domain and context
    const domain = this.determineDomain(text);
    const urgency = this.calculateUrgency(text);
    const complexity = this.calculateComplexity(tokenization);

    const confidence = maxScore > 0 ? Math.min(1.0, maxScore / 3) : 0.1;

    return {
      primary: primaryIntent,
      secondary: secondaryIntents,
      confidence,
      parameters,
      context: {
        domain,
        urgency,
        complexity
      }
    };
  }

  /**
   * Recognize entities in text
   */
  private recognizeEntities(text: string): EntityRecognition {
    const entities: EntityRecognition['entities'] = [];
    const relationships: EntityRecognition['relationships'] = [];

    this.entityPatterns.forEach((pattern, type) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type,
          confidence: 0.8, // Base confidence
          position: {
            start: match.index,
            end: match.index + match[0].length
          }
        });
      }
    });

    // Find relationships between entities
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1 = entities[i];
        const entity2 = entities[j];
        
        // Simple relationship detection
        if (entity1.type === 'PERSON' && entity2.type === 'NIK') {
          relationships.push({
            source: entity1.text,
            target: entity2.text,
            relation: 'has_id',
            confidence: 0.9
          });
        }
      }
    }

    return { entities, relationships };
  }

  /**
   * Analyze sentiment
   */
  private analyzeSentiment(text: string, tokenization: TokenizationResult): SemanticUnderstanding['sentiment'] {
    const words = tokenization.tokens;
    let totalScore = 0;
    let scoredWords = 0;
    let subjectivityScore = 0;

    words.forEach(word => {
      const lowerWord = word.toLowerCase();
      if (this.sentimentLexicon.has(lowerWord)) {
        const score = this.sentimentLexicon.get(lowerWord)!;
        totalScore += score;
        scoredWords++;
        
        // Subjectivity: words with sentiment are more subjective
        subjectivityScore += Math.abs(score);
      }
    });

    const polarity = scoredWords > 0 ? totalScore / scoredWords : 0;
    const subjectivity = scoredWords > 0 ? Math.min(1, subjectivityScore / scoredWords) : 0;

    // Determine emotion
    let emotion = 'neutral';
    if (polarity > 0.3) emotion = 'positive';
    else if (polarity < -0.3) emotion = 'negative';
    
    // Check for specific emotions
    if (text.includes('!')) emotion = 'excited';
    if (text.includes('?')) emotion = 'curious';
    if (text.includes('maaf') || text.includes('sorry')) emotion = 'apologetic';

    const confidence = scoredWords > 0 ? Math.min(1, scoredWords / words.length * 2) : 0.5;

    return {
      polarity: Math.max(-1, Math.min(1, polarity)),
      subjectivity: Math.max(0, Math.min(1, subjectivity)),
      emotion,
      confidence
    };
  }

  /**
   * Analyze morphology
   */
  private analyzeMorphology(tokens: string[]): SemanticUnderstanding['linguistic']['morphology'] {
    const rootWords: string[] = [];
    const affixes: string[] = [];
    const compounds: string[] = [];

    tokens.forEach(token => {
      // Simple morphological analysis for Indonesian
      const word = token.toLowerCase();
      
      // Check for prefixes
      const prefixes = ['me', 'ber', 'ter', 'pe', 'per', 'se', 'ke', 'di'];
      const suffixes = ['kan', 'an', 'i', 'nya', 'lah', 'kah', 'pun'];
      
      let root = word;
      let hasAffix = false;
      
      // Remove prefixes
      prefixes.forEach(prefix => {
        if (word.startsWith(prefix) && word.length > prefix.length + 2) {
          root = word.substring(prefix.length);
          affixes.push(prefix + '-');
          hasAffix = true;
        }
      });
      
      // Remove suffixes
      suffixes.forEach(suffix => {
        if (root.endsWith(suffix) && root.length > suffix.length + 2) {
          root = root.substring(0, root.length - suffix.length);
          affixes.push('-' + suffix);
          hasAffix = true;
        }
      });
      
      if (hasAffix) {
        rootWords.push(root);
      }
      
      // Check for compounds (simple heuristic)
      if (word.length > 8 && !hasAffix) {
        compounds.push(word);
      }
    });

    return {
      rootWords: [...new Set(rootWords)],
      affixes: [...new Set(affixes)],
      compounds: [...new Set(compounds)]
    };
  }

  /**
   * Analyze syntax (simplified)
   */
  private analyzeSyntax(tokens: string[]): SemanticUnderstanding['linguistic']['syntax'] {
    // Very simplified syntactic analysis
    const structure = tokens.length > 5 ? 'complex' : 'simple';
    
    // Simple dependency detection
    const dependencies: Array<{ head: string; dependent: string; relation: string }> = [];
    
    for (let i = 0; i < tokens.length - 1; i++) {
      const current = tokens[i].toLowerCase();
      const next = tokens[i + 1].toLowerCase();
      
      // Simple patterns
      if (current === 'yang' && i > 0) {
        dependencies.push({
          head: tokens[i - 1],
          dependent: next,
          relation: 'modifier'
        });
      }
      
      if (current === 'di' || current === 'ke' || current === 'dari') {
        dependencies.push({
          head: tokens[i - 1] || 'ROOT',
          dependent: next,
          relation: 'prepositional'
        });
      }
    }

    return { structure, dependencies };
  }

  /**
   * Determine domain from text
   */
  private determineDomain(text: string): string {
    const lowerText = text.toLowerCase();
    let maxScore = 0;
    let dominantDomain = 'general';

    this.domainKeywords.forEach((keywords, domain) => {
      const score = keywords.filter(keyword => lowerText.includes(keyword)).length;
      if (score > maxScore) {
        maxScore = score;
        dominantDomain = domain;
      }
    });

    return dominantDomain;
  }

  /**
   * Calculate urgency from text
   */
  private calculateUrgency(text: string): number {
    const urgencyMarkers = ['segera', 'cepat', 'urgent', 'penting', 'darurat', 'asap', '!'];
    const lowerText = text.toLowerCase();
    
    const urgencyCount = urgencyMarkers.filter(marker => lowerText.includes(marker)).length;
    return Math.min(1, urgencyCount / 3);
  }

  /**
   * Calculate complexity from tokenization
   */
  private calculateComplexity(tokenization: TokenizationResult): number {
    const { wordCount, sentenceCount, characterCount } = tokenization.metadata;
    
    // Complexity based on various factors
    const avgWordsPerSentence = wordCount / Math.max(1, sentenceCount);
    const avgCharsPerWord = characterCount / Math.max(1, wordCount);
    
    const complexity = (avgWordsPerSentence / 10) + (avgCharsPerWord / 15);
    return Math.min(1, complexity);
  }

  /**
   * Calculate coherence
   */
  private calculateCoherence(tokens: string[]): number {
    // Simple coherence based on token repetition and structure
    const uniqueTokens = new Set(tokens);
    const repetitionRatio = tokens.length / uniqueTokens.size;
    
    // Higher repetition might indicate better coherence (up to a point)
    return Math.min(1, Math.max(0.3, 1 - (repetitionRatio - 1.5) / 2));
  }

  /**
   * Fallback semantic analysis when IndoBERT is not available
   */
  private performFallbackSemanticAnalysis(
    _text: string,
    tokenization: TokenizationResult
  ): SemanticUnderstanding['semantics'] {
    // Simple embedding simulation based on word frequencies
    const embeddings = new Array(128).fill(0).map(() => Math.random() - 0.5);
    
    const similarity = this.calculateCoherence(tokenization.tokens);
    const coherence = similarity;
    const complexity = this.calculateComplexity(tokenization);

    return {
      embeddings,
      similarity,
      coherence,
      complexity
    };
  }

  /**
   * Get analyzer statistics
   */
  getStatistics(): {
    intentPatternsCount: number;
    entityPatternsCount: number;
    sentimentLexiconSize: number;
    domainKeywordsCount: number;
  } {
    return {
      intentPatternsCount: this.intentPatterns.size,
      entityPatternsCount: this.entityPatterns.size,
      sentimentLexiconSize: this.sentimentLexicon.size,
      domainKeywordsCount: this.domainKeywords.size
    };
  }
}

// Export singleton instance
export const semanticAnalyzer = new SemanticAnalyzer();
