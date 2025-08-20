/**
 * Indonesian Tokenizer - Advanced Indonesian Text Processing
 * Handles Indonesian-specific tokenization, normalization, and linguistic patterns
 */

export interface TokenizationResult {
  tokens: string[];
  normalizedText: string;
  originalText: string;
  metadata: {
    tokenCount: number;
    characterCount: number;
    wordCount: number;
    sentenceCount: number;
    languageConfidence: number;
    dialectInfo: {
      detected: string;
      markers: string[];
    };
  };
}

export interface NormalizationOptions {
  handleSlang: boolean;
  standardizeDialects: boolean;
  preserveEmoticons: boolean;
  handleAbbreviations: boolean;
  removeStopwords: boolean;
}

export class IndonesianTokenizer {
  private slangDictionary: Map<string, string>;
  private stopwords: Set<string>;
  private abbreviations: Map<string, string>;
  private dialectPatterns: Map<string, RegExp[]>;

  constructor() {
    this.slangDictionary = this.initializeSlangDictionary();
    this.stopwords = this.initializeStopwords();
    this.abbreviations = this.initializeAbbreviations();
    this.dialectPatterns = this.initializeDialectPatterns();
  }

  /**
   * Initialize Indonesian slang dictionary
   */
  private initializeSlangDictionary(): Map<string, string> {
    const slang = new Map<string, string>();

    // Jakarta slang
    slang.set('gue', 'saya');
    slang.set('gw', 'saya');
    slang.set('lu', 'kamu');
    slang.set('lo', 'kamu');
    slang.set('gak', 'tidak');
    slang.set('ga', 'tidak');
    slang.set('nggak', 'tidak');
    slang.set('ngga', 'tidak');
    slang.set('nyari', 'mencari');
    slang.set('nyariin', 'mencarikan');
    slang.set('ngapain', 'mengapa');
    slang.set('gimana', 'bagaimana');
    slang.set('kenapa', 'mengapa');
    slang.set('udah', 'sudah');
    slang.set('udh', 'sudah');
    slang.set('blm', 'belum');
    slang.set('blom', 'belum');
    slang.set('emang', 'memang');
    slang.set('emg', 'memang');
    slang.set('banget', 'sangat');
    slang.set('bgt', 'sangat');
    slang.set('aja', 'saja');
    slang.set('doang', 'saja');
    slang.set('cuma', 'hanya');
    slang.set('cm', 'hanya');
    slang.set('kalo', 'kalau');
    slang.set('klo', 'kalau');
    slang.set('trus', 'terus');
    slang.set('trs', 'terus');
    slang.set('abis', 'setelah');
    slang.set('abs', 'setelah');

    // Internet slang
    slang.set('yg', 'yang');
    slang.set('dgn', 'dengan');
    slang.set('utk', 'untuk');
    slang.set('krn', 'karena');
    slang.set('krna', 'karena');
    slang.set('jd', 'jadi');
    slang.set('jdi', 'jadi');
    slang.set('tp', 'tetapi');
    slang.set('tpi', 'tetapi');
    slang.set('dr', 'dari');
    slang.set('ke', 'ke');
    slang.set('sm', 'sama');
    slang.set('sma', 'sama');
    slang.set('kyk', 'seperti');
    slang.set('kyak', 'seperti');
    slang.set('kmrn', 'kemarin');
    slang.set('bsk', 'besok');
    slang.set('skrg', 'sekarang');
    slang.set('skg', 'sekarang');

    // Regional variations
    slang.set('nggih', 'ya'); // Javanese
    slang.set('monggo', 'silakan'); // Javanese
    slang.set('atuh', 'dong'); // Sundanese
    slang.set('mah', 'sih'); // Sundanese
    slang.set('teh', 'itu'); // Sundanese

    return slang;
  }

  /**
   * Initialize Indonesian stopwords
   */
  private initializeStopwords(): Set<string> {
    return new Set([
      // Articles and determiners
      'yang', 'ini', 'itu', 'tersebut', 'suatu', 'sebuah', 'satu', 'para',
      
      // Prepositions
      'di', 'ke', 'dari', 'pada', 'dalam', 'dengan', 'untuk', 'oleh', 'tentang',
      'antara', 'atas', 'bawah', 'depan', 'belakang', 'samping', 'luar', 'sekitar',
      
      // Conjunctions
      'dan', 'atau', 'tetapi', 'namun', 'karena', 'sebab', 'jika', 'kalau',
      'maka', 'lalu', 'kemudian', 'setelah', 'sebelum', 'sementara', 'sedangkan',
      
      // Pronouns
      'saya', 'aku', 'kamu', 'anda', 'dia', 'mereka', 'kita', 'kami',
      'ia', 'beliau', 'nya', 'mu', 'ku',
      
      // Common verbs
      'adalah', 'ada', 'akan', 'dapat', 'bisa', 'harus', 'perlu', 'ingin',
      'mau', 'sudah', 'telah', 'sedang', 'masih', 'pernah', 'belum',
      
      // Adverbs
      'tidak', 'bukan', 'juga', 'hanya', 'saja', 'pun', 'lah', 'kah',
      'sangat', 'sekali', 'agak', 'cukup', 'kurang', 'lebih', 'paling',
      
      // Question words
      'apa', 'siapa', 'kapan', 'dimana', 'mengapa', 'bagaimana', 'berapa'
    ]);
  }

  /**
   * Initialize common abbreviations
   */
  private initializeAbbreviations(): Map<string, string> {
    const abbrev = new Map<string, string>();

    // Government/administrative
    abbrev.set('ktp', 'kartu tanda penduduk');
    abbrev.set('nik', 'nomor induk kependudukan');
    abbrev.set('siak', 'sistem informasi administrasi kependudukan');
    abbrev.set('rt', 'rukun tetangga');
    abbrev.set('rw', 'rukun warga');
    abbrev.set('kel', 'kelurahan');
    abbrev.set('kec', 'kecamatan');
    abbrev.set('kab', 'kabupaten');
    abbrev.set('prov', 'provinsi');

    // Technical terms
    abbrev.set('db', 'database');
    abbrev.set('api', 'application programming interface');
    abbrev.set('ui', 'user interface');
    abbrev.set('ux', 'user experience');
    abbrev.set('id', 'identifier');
    abbrev.set('url', 'uniform resource locator');

    // Time expressions
    abbrev.set('tgl', 'tanggal');
    abbrev.set('bln', 'bulan');
    abbrev.set('thn', 'tahun');
    abbrev.set('jam', 'jam');
    abbrev.set('mnt', 'menit');
    abbrev.set('dtk', 'detik');

    return abbrev;
  }

  /**
   * Initialize dialect patterns
   */
  private initializeDialectPatterns(): Map<string, RegExp[]> {
    const patterns = new Map<string, RegExp[]>();

    patterns.set('jakarta', [
      /\b(gue|gw|lu|lo|gak|ga|nyari|ngapain)\b/gi,
      /\b(nih|sih|dong|deh|tuh)\b/gi,
      /\b(gimana|kenapa|emang|banget)\b/gi
    ]);

    patterns.set('javanese', [
      /\b(nggih|monggo|sampun|mboten)\b/gi,
      /\b(pripun|menapa|wonten)\b/gi
    ]);

    patterns.set('sundanese', [
      /\b(atuh|mah|teh|nya)\b/gi,
      /\b(kumaha|naon|aya)\b/gi
    ]);

    return patterns;
  }

  /**
   * Tokenize Indonesian text with advanced processing
   */
  tokenize(
    text: string,
    options: Partial<NormalizationOptions> = {}
  ): TokenizationResult {
    const defaultOptions: NormalizationOptions = {
      handleSlang: true,
      standardizeDialects: true,
      preserveEmoticons: false,
      handleAbbreviations: true,
      removeStopwords: false
    };

    const finalOptions = { ...defaultOptions, ...options };
    const originalText = text;

    // Step 1: Basic normalization
    let normalizedText = this.basicNormalization(text);

    // Step 2: Handle slang if enabled
    if (finalOptions.handleSlang) {
      normalizedText = this.handleSlang(normalizedText);
    }

    // Step 3: Handle abbreviations if enabled
    if (finalOptions.handleAbbreviations) {
      normalizedText = this.expandAbbreviations(normalizedText);
    }

    // Step 4: Standardize dialects if enabled
    if (finalOptions.standardizeDialects) {
      normalizedText = this.standardizeDialects(normalizedText);
    }

    // Step 5: Tokenize
    let tokens = this.performTokenization(normalizedText);

    // Step 6: Remove stopwords if enabled
    if (finalOptions.removeStopwords) {
      tokens = this.removeStopwords(tokens);
    }

    // Step 7: Detect dialect information
    const dialectInfo = this.detectDialect(originalText);

    // Step 8: Calculate metadata
    const metadata = {
      tokenCount: tokens.length,
      characterCount: normalizedText.length,
      wordCount: normalizedText.split(/\s+/).filter(word => word.length > 0).length,
      sentenceCount: normalizedText.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
      languageConfidence: this.calculateLanguageConfidence(normalizedText),
      dialectInfo
    };

    return {
      tokens,
      normalizedText,
      originalText,
      metadata
    };
  }

  /**
   * Basic text normalization
   */
  private basicNormalization(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[""]/g, '"') // Normalize quotes
      .replace(/['']/g, "'") // Normalize apostrophes
      .replace(/…/g, '...') // Normalize ellipsis
      .toLowerCase();
  }

  /**
   * Handle Indonesian slang
   */
  private handleSlang(text: string): string {
    let processed = text;
    
    this.slangDictionary.forEach((standard, slang) => {
      const regex = new RegExp(`\\b${slang}\\b`, 'gi');
      processed = processed.replace(regex, standard);
    });

    return processed;
  }

  /**
   * Expand abbreviations
   */
  private expandAbbreviations(text: string): string {
    let processed = text;
    
    this.abbreviations.forEach((expansion, abbrev) => {
      const regex = new RegExp(`\\b${abbrev}\\b`, 'gi');
      processed = processed.replace(regex, expansion);
    });

    return processed;
  }

  /**
   * Standardize regional dialects
   */
  private standardizeDialects(text: string): string {
    let processed = text;

    // Apply standardization patterns for each dialect
    this.dialectPatterns.forEach((patterns, dialect) => {
      patterns.forEach(pattern => {
        // This is a simplified approach - in production, you'd have
        // more sophisticated dialect-to-standard mappings
        if (dialect === 'jakarta') {
          processed = processed.replace(/\bnih\b/gi, '');
          processed = processed.replace(/\bsih\b/gi, '');
          processed = processed.replace(/\bdong\b/gi, '');
          processed = processed.replace(/\bdeh\b/gi, '');
        }
      });
    });

    return processed.replace(/\s+/g, ' ').trim();
  }

  /**
   * Perform actual tokenization
   */
  private performTokenization(text: string): string[] {
    // Split on whitespace and punctuation, but preserve meaningful punctuation
    const tokens = text
      .split(/(\s+|[.!?,:;()[\]{}""''`~@#$%^&*+=|\\<>/])/)
      .filter(token => token.trim().length > 0 && !/^\s+$/.test(token))
      .map(token => token.trim())
      .filter(token => token.length > 0);

    return tokens;
  }

  /**
   * Remove stopwords
   */
  private removeStopwords(tokens: string[]): string[] {
    return tokens.filter(token => !this.stopwords.has(token.toLowerCase()));
  }

  /**
   * Detect dialect in text
   */
  private detectDialect(text: string): { detected: string; markers: string[] } {
    const lowerText = text.toLowerCase();
    const dialectScores = new Map<string, number>();
    const allMarkers: string[] = [];

    this.dialectPatterns.forEach((patterns, dialect) => {
      let score = 0;
      const markers: string[] = [];

      patterns.forEach(pattern => {
        const matches = lowerText.match(pattern);
        if (matches) {
          score += matches.length;
          markers.push(...matches);
        }
      });

      if (score > 0) {
        dialectScores.set(dialect, score);
        allMarkers.push(...markers);
      }
    });

    // Find dominant dialect
    let dominantDialect = 'standard';
    let maxScore = 0;

    dialectScores.forEach((score, dialect) => {
      if (score > maxScore) {
        maxScore = score;
        dominantDialect = dialect;
      }
    });

    return {
      detected: dominantDialect,
      markers: [...new Set(allMarkers)] // Remove duplicates
    };
  }

  /**
   * Calculate language confidence (how "Indonesian" the text is)
   */
  private calculateLanguageConfidence(text: string): number {
    const words = text.split(/\s+/);
    let indonesianWordCount = 0;

    // Check against known Indonesian patterns and vocabulary
    words.forEach(word => {
      // Check if word exists in our dictionaries
      if (this.slangDictionary.has(word) || 
          this.abbreviations.has(word) || 
          this.stopwords.has(word)) {
        indonesianWordCount++;
      }
      
      // Check for Indonesian morphological patterns
      if (this.hasIndonesianMorphology(word)) {
        indonesianWordCount++;
      }
    });

    return Math.min(1.0, indonesianWordCount / Math.max(1, words.length));
  }

  /**
   * Check if word has Indonesian morphological patterns
   */
  private hasIndonesianMorphology(word: string): boolean {
    // Indonesian prefixes
    const prefixes = ['me', 'ber', 'ter', 'pe', 'per', 'se', 'ke', 'di'];
    // Indonesian suffixes
    const suffixes = ['kan', 'an', 'i', 'nya', 'lah', 'kah', 'pun'];

    const hasPrefix = prefixes.some(prefix => word.startsWith(prefix));
    const hasSuffix = suffixes.some(suffix => word.endsWith(suffix));

    return hasPrefix || hasSuffix;
  }

  /**
   * Get tokenizer statistics
   */
  getStatistics(): {
    slangDictionarySize: number;
    stopwordsCount: number;
    abbreviationsCount: number;
    dialectPatternsCount: number;
  } {
    return {
      slangDictionarySize: this.slangDictionary.size,
      stopwordsCount: this.stopwords.size,
      abbreviationsCount: this.abbreviations.size,
      dialectPatternsCount: this.dialectPatterns.size
    };
  }

  /**
   * Add custom slang mapping
   */
  addSlangMapping(slang: string, standard: string): void {
    this.slangDictionary.set(slang.toLowerCase(), standard.toLowerCase());
  }

  /**
   * Add custom abbreviation
   */
  addAbbreviation(abbrev: string, expansion: string): void {
    this.abbreviations.set(abbrev.toLowerCase(), expansion.toLowerCase());
  }

  /**
   * Check if text contains Indonesian characteristics
   */
  isIndonesian(text: string): boolean {
    const confidence = this.calculateLanguageConfidence(text);
    return confidence > 0.3; // Threshold for Indonesian detection
  }
}

// Export singleton instance
export const indonesianTokenizer = new IndonesianTokenizer();
