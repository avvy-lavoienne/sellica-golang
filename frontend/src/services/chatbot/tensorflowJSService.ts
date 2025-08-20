/**
 * TensorFlow.js Service untuk SELLY Chatbot
 * Handles client-side inference dengan model Indonesian NLP
 */

import { TensorFlowJSServiceStub, TensorFlowResult } from './tensorflowStubs';

// Re-export TensorFlowResult for external use
export type { TensorFlowResult };

// Check if TensorFlow is available
const isTensorFlowAvailable = (): boolean => {
  try {
    // Debug environment variable
    console.log('🔍 Checking TensorFlow availability:', {
      windowExists: typeof window !== 'undefined',
      envVar: process.env.NEXT_PUBLIC_ENABLE_TENSORFLOW,
      envVarType: typeof process.env.NEXT_PUBLIC_ENABLE_TENSORFLOW,
      allEnvVars: Object.keys(process.env).filter(key => key.includes('TENSORFLOW'))
    });

    // For server-side: Always return true if environment variable is set
    // The actual TensorFlow.js loading will happen on client-side
    const isEnabled = process.env.NEXT_PUBLIC_ENABLE_TENSORFLOW === 'true';

    if (typeof window === 'undefined') {
      // Server-side: Just check if TensorFlow is enabled
      console.log('🖥️ Server-side: TensorFlow enabled =', isEnabled);
      return isEnabled;
    } else {
      // Client-side: Check both environment and browser support
      const isAvailable = isEnabled;
      console.log('🌐 Client-side: TensorFlow availability =', isAvailable);
      return isAvailable;
    }
  } catch (error) {
    console.error('❌ Error checking TensorFlow availability:', error);
    return false;
  }
};

// Dynamic import untuk avoid build issues
const loadTensorFlow = async () => {
  try {
    const tf = await import('@tensorflow/tfjs');
    return tf;
  } catch (error) {
    console.warn('TensorFlow.js not available, using stub implementation:', error);
    throw new Error('TensorFlow.js not available');
  }
};

export interface ProcessingOptions {
  context?: any;
  maxAlternatives?: number;
  threshold?: number;
}

export class TensorFlowJSService {
  private model: any = null;
  private tokenizer: any = null;
  private isLoading = false;
  private cache = new Map<string, TensorFlowResult>();
  private readonly maxCacheSize = 1000;
  private modelVersion = "1.0.0";
  private stubService: TensorFlowJSServiceStub | null = null;
  private useStub = false;

  // Enhanced Indonesian administrative vocabulary
  private readonly indonesianVocab = new Map<string, number>();
  private readonly intentLabels = [
    "data_request",
    "statistics",
    "search",
    "help",
    "general",
    "comparison",
    "aggregation",
    "temporal_query",
    "administrative_query",
    "user_management",
    "document_query",
    "status_inquiry",
  ];

  // Enhanced Indonesian text processing patterns
  private readonly indonesianPatterns = {
    // Administrative terms
    administrative: [
      "pengajuan",
      "permohonan",
      "aplikasi",
      "pendaftaran",
      "registrasi",
      "verifikasi",
      "validasi",
      "konfirmasi",
      "persetujuan",
      "penolakan",
      "dokumen",
      "berkas",
      "file",
      "lampiran",
      "surat",
      "formulir",
    ],
    // Data query terms
    dataQuery: [
      "data",
      "informasi",
      "laporan",
      "statistik",
      "analisis",
      "ringkasan",
      "jumlah",
      "total",
      "rata-rata",
      "maksimum",
      "minimum",
      "persentase",
    ],
    // Time expressions
    temporal: [
      "hari",
      "minggu",
      "bulan",
      "tahun",
      "kemarin",
      "hari ini",
      "besok",
      "sekarang",
      "saat ini",
      "periode",
      "rentang",
      "sejak",
      "sampai",
    ],
    // Status terms
    status: [
      "status",
      "kondisi",
      "keadaan",
      "situasi",
      "progress",
      "kemajuan",
      "selesai",
      "pending",
      "proses",
      "ditolak",
      "disetujui",
      "menunggu",
    ],
  };

  constructor() {
    this.initializeVocabulary();

    // Initialize stub service if TensorFlow is not available
    if (!isTensorFlowAvailable()) {
      this.stubService = new TensorFlowJSServiceStub();
      this.useStub = true;
    }
  }

  /**
   * Load TensorFlow.js model untuk Indonesian NLP
   */
  async loadModel(modelUrl: string): Promise<boolean> {
    // Use stub if TensorFlow is not available
    if (this.useStub && this.stubService) {
      return await this.stubService.loadModel(modelUrl);
    }

    if (this.isLoading) {
      console.log("Model already loading...");
      return false;
    }

    try {
      this.isLoading = true;
      console.log("Loading TensorFlow.js model from:", modelUrl);

      // Load TensorFlow.js dynamically
      const tensorflow = await loadTensorFlow();

      // Dispose existing model if any to prevent variable conflicts
      if (this.model) {
        console.log("Disposing existing model to prevent conflicts...");
        this.model.dispose();
        this.model = null;
      }

      // Clear any existing variables to prevent conflicts
      try {
        tensorflow.disposeVariables();
      } catch (e) {
        // Ignore disposal errors
        console.log("Variable disposal completed (some warnings expected)");
      }

      // Convert relative path to full URL if needed
      let fullModelUrl = modelUrl;
      if (modelUrl.startsWith('/')) {
        // On client-side, use window.location.origin
        if (typeof window !== 'undefined') {
          fullModelUrl = `${window.location.origin}${modelUrl}`;
        } else {
          // On server-side, use localhost (fallback)
          fullModelUrl = `http://localhost:3000${modelUrl}`;
        }
      }

      console.log("Full model URL:", fullModelUrl);

      // Load model
      this.model = await tensorflow.loadLayersModel(fullModelUrl);

      // Load tokenizer (jika tersedia)
      await this.loadTokenizer(modelUrl.replace(".json", "_tokenizer.json"));

      console.log("TensorFlow.js model loaded successfully");
      return true;
    } catch (error) {
      console.error(
        "Failed to load TensorFlow.js model, falling back to stub:",
        error,
      );

      // Fallback to stub
      if (!this.stubService) {
        this.stubService = new TensorFlowJSServiceStub();
      }
      this.useStub = true;
      return await this.stubService.loadModel(modelUrl);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Process query dengan TensorFlow.js
   */
  async processQuery(
    query: string,
    options: ProcessingOptions = {},
  ): Promise<TensorFlowResult> {
    // Use stub if TensorFlow is not available
    if (this.useStub && this.stubService) {
      return await this.stubService.processQuery(query, options);
    }

    const startTime = performance.now();

    // Check cache
    const cacheKey = this.generateCacheKey(query, options);
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return {
        ...cached,
        processingTime: performance.now() - startTime,
      };
    }

    // Validate model availability
    if (!this.model) {
      throw new Error("TensorFlow.js model not loaded");
    }

    try {
      // Enhanced Indonesian text preprocessing
      const preprocessed = await this.preprocessIndonesianText(query);

      // Run inference with enhanced inputs
      let prediction;
      if (preprocessed.features) {
        // Use both text and features for enhanced prediction
        prediction = this.model.predict([
          preprocessed.inputIds,
          preprocessed.features,
        ]);
      } else {
        // Fallback to text-only prediction
        prediction = this.model.predict(preprocessed.inputIds || preprocessed);
      }

      const predictionData = await prediction.data();

      // Enhanced post-processing with feature context
      const result = this.enhancedPostProcessPrediction(
        predictionData,
        query,
        options,
      );
      result.processingTime = performance.now() - startTime;
      result.modelVersion = this.modelVersion;

      // Cache result
      this.cacheResult(cacheKey, result);

      // Cleanup tensors
      if (preprocessed.inputIds && typeof preprocessed.inputIds.dispose === 'function') {
        preprocessed.inputIds.dispose();
      }
      if (preprocessed.features && typeof preprocessed.features.dispose === 'function') {
        preprocessed.features.dispose();
      }
      if (typeof prediction.dispose === 'function') {
        prediction.dispose();
      }

      return result;
    } catch (error) {
      console.error("TensorFlow.js inference failed:", error);
      throw error;
    }
  }

  /**
   * Enhanced Indonesian text preprocessing untuk model input
   */
  private async preprocessIndonesianText(text: string): Promise<any> {
    // Load TensorFlow.js dynamically
    const tensorflow = await loadTensorFlow();

    // Enhanced normalization with pattern recognition
    const normalized = this.enhancedNormalizeIndonesianText(text);

    // Extract features for better understanding
    const features = this.extractIndonesianFeatures(normalized);

    // Tokenization with context awareness
    const tokens = this.tokenizeIndonesianText(normalized);

    // Convert ke tensor with enhanced features
    const maxLength = 128; // Sesuaikan dengan model requirements
    const paddedTokens = this.padSequence(tokens, maxLength);

    // Add feature vector for enhanced understanding
    const featureVector = this.createFeatureVector(features);

    return {
      inputIds: tensorflow.tensor2d([paddedTokens], [1, maxLength]),
      features: tensorflow.tensor2d([featureVector], [1, featureVector.length]),
    };
  }

  /**
   * Enhanced Indonesian text normalization with administrative context
   */
  private enhancedNormalizeIndonesianText(text: string): string {
    let normalized = this.normalizeIndonesianText(text); // Use existing normalization first

    // Handle common Indonesian administrative abbreviations
    const abbreviations: Record<string, string> = {
      yg: "yang",
      dgn: "dengan",
      utk: "untuk",
      pd: "pada",
      dr: "dari",
      tgl: "tanggal",
      no: "nomor",
      dok: "dokumen",
      info: "informasi",
      user: "pengguna",
      admin: "administrator",
    };

    // Replace abbreviations
    Object.entries(abbreviations).forEach(([abbr, full]) => {
      const regex = new RegExp(`\\b${abbr}\\b`, "gi");
      normalized = normalized.replace(regex, full);
    });

    // Handle informal expressions
    const informalMappings: Record<string, string> = {
      gimana: "bagaimana",
      brp: "berapa",
      udah: "sudah",
      blm: "belum",
      lg: "sedang",
      aja: "saja",
      dong: "",
      sih: "",
      nih: "",
      kan: "",
    };

    Object.entries(informalMappings).forEach(([informal, formal]) => {
      const regex = new RegExp(`\\b${informal}\\b`, "gi");
      normalized = normalized.replace(regex, formal);
    });

    // Clean up extra spaces
    normalized = normalized.replace(/\s+/g, " ").trim();

    return normalized;
  }

  /**
   * Extract Indonesian language features for enhanced understanding
   */
  private extractIndonesianFeatures(text: string): Record<string, number> {
    const features: Record<string, number> = {};

    // Pattern matching for different categories
    Object.entries(this.indonesianPatterns).forEach(([category, patterns]) => {
      const matchCount = patterns.reduce((count, pattern) => {
        const regex = new RegExp(`\\b${pattern}\\b`, "gi");
        const matches = text.match(regex);
        return count + (matches ? matches.length : 0);
      }, 0);
      features[`${category}_score`] = matchCount / patterns.length;
    });

    // Text characteristics
    features.text_length = text.length / 100; // Normalized
    features.word_count = text.split(/\s+/).length / 20; // Normalized
    features.question_mark = text.includes("?") ? 1 : 0;
    features.exclamation = text.includes("!") ? 1 : 0;
    features.has_numbers = /\d/.test(text) ? 1 : 0;

    // Intent indicators
    features.is_query =
      /\b(apa|siapa|kapan|dimana|mengapa|bagaimana|berapa)\b/i.test(text)
        ? 1
        : 0;
    features.is_request = /\b(tolong|mohon|bisa|minta|butuh)\b/i.test(text)
      ? 1
      : 0;
    features.is_comparison =
      /\b(bandingkan|dibanding|vs|versus|lebih|kurang)\b/i.test(text) ? 1 : 0;

    return features;
  }

  /**
   * Create feature vector from extracted features
   */
  private createFeatureVector(features: Record<string, number>): number[] {
    const featureOrder = [
      "administrative_score",
      "dataQuery_score",
      "temporal_score",
      "status_score",
      "text_length",
      "word_count",
      "question_mark",
      "exclamation",
      "has_numbers",
      "is_query",
      "is_request",
      "is_comparison",
    ];

    return featureOrder.map((key) => features[key] || 0);
  }

  /**
   * Normalisasi teks bahasa Indonesia
   */
  private normalizeIndonesianText(text: string): string {
    return (
      text
        .toLowerCase()
        .trim()
        // Normalisasi kata-kata administratif Indonesia
        .replace(/\bnik\b/g, "nomor_induk_kependudukan")
        .replace(/\bktp\b/g, "kartu_tanda_penduduk")
        .replace(/\brt\b/g, "rukun_tetangga")
        .replace(/\brw\b/g, "rukun_warga")
        .replace(/\bkel\b/g, "kelurahan")
        .replace(/\bkec\b/g, "kecamatan")
        // Normalisasi angka dan tanggal
        .replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, "tanggal_$1_$2_$3")
        .replace(/\b(\d+)\s*(ribu|juta|miliar)\b/g, "angka_$1_$2")
        // Hapus karakter khusus
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
    );
  }

  /**
   * Tokenize Indonesian text
   */
  private tokenizeIndonesianText(text: string): number[] {
    const words = text.split(" ").filter((word) => word.length > 0);
    const tokens: number[] = [];

    for (const word of words) {
      const tokenId =
        this.indonesianVocab.get(word) ||
        this.indonesianVocab.get("[UNK]") ||
        1;
      tokens.push(tokenId);
    }

    return tokens;
  }

  /**
   * Pad sequence ke panjang yang diinginkan
   */
  private padSequence(tokens: number[], maxLength: number): number[] {
    if (tokens.length >= maxLength) {
      return tokens.slice(0, maxLength);
    }

    const padded = [...tokens];
    while (padded.length < maxLength) {
      padded.push(0); // Padding token
    }

    return padded;
  }

  /**
   * Enhanced post-processing with Indonesian context awareness
   */
  private enhancedPostProcessPrediction(
    predictionData: Float32Array | Int32Array | Uint8Array,
    originalQuery: string,
    options: ProcessingOptions,
  ): TensorFlowResult {
    const predictions = Array.from(predictionData);
    const maxAlternatives = options.maxAlternatives || 3;
    const threshold = options.threshold || 0.5;

    // Extract features for context-aware processing
    const features = this.extractIndonesianFeatures(originalQuery);

    // Enhanced intent classification with Indonesian context
    const intentScores = predictions.slice(0, this.intentLabels.length);
    const topIntents = intentScores
      .map((score, index) => ({
        intent: this.intentLabels[index],
        confidence: score,
        contextBoost: this.calculateContextBoost(
          this.intentLabels[index],
          features,
        ),
      }))
      .map((item) => ({
        ...item,
        adjustedConfidence: Math.min(
          1.0,
          item.confidence * (1 + item.contextBoost),
        ),
      }))
      .sort((a, b) => b.adjustedConfidence - a.adjustedConfidence)
      .slice(0, maxAlternatives);

    // Enhanced entity extraction for Indonesian administrative terms
    const entities = this.extractIndonesianEntities(originalQuery, features);

    // Generate contextual insights
    const insights = this.generateIndonesianInsights(
      originalQuery,
      topIntents,
      features,
    );

    return {
      intent: topIntents[0]?.intent || "general",
      confidence: topIntents[0]?.adjustedConfidence || 0,
      alternatives: topIntents.slice(1),
      entities,
      insights,
      features,
      processingTime: 0, // Will be set by caller
      modelVersion: this.modelVersion,
      language: "id",
      isEnhanced: true,
    };
  }

  /**
   * Calculate context boost for intent classification
   */
  private calculateContextBoost(
    intent: string,
    features: Record<string, number>,
  ): number {
    let boost = 0;

    // Boost based on feature patterns
    switch (intent) {
      case "administrative_query":
        boost += features.administrative_score * 0.3;
        break;
      case "data_request":
      case "statistics":
        boost += features.dataQuery_score * 0.3;
        break;
      case "temporal_query":
        boost += features.temporal_score * 0.3;
        break;
      case "status_inquiry":
        boost += features.status_score * 0.3;
        break;
    }

    // Additional boosts for query patterns
    if (
      features.is_query &&
      (intent === "data_request" || intent === "search")
    ) {
      boost += 0.2;
    }
    if (features.is_comparison && intent === "comparison") {
      boost += 0.2;
    }

    return Math.min(0.5, boost); // Cap boost at 50%
  }

  /**
   * Extract Indonesian administrative entities
   */
  private extractIndonesianEntities(
    text: string,
    features: Record<string, number>,
  ): any[] {
    const entities: any[] = [];

    // Extract numbers and dates
    const numberMatches = text.match(/\d+/g);
    if (numberMatches) {
      numberMatches.forEach((match) => {
        entities.push({
          type: "number",
          value: parseInt(match),
          text: match,
          confidence: 0.9,
        });
      });
    }

    // Extract administrative terms
    Object.entries(this.indonesianPatterns).forEach(([category, patterns]) => {
      patterns.forEach((pattern) => {
        const regex = new RegExp(`\\b${pattern}\\b`, "gi");
        const matches = text.match(regex);
        if (matches) {
          matches.forEach((match) => {
            entities.push({
              type: category,
              value: match.toLowerCase(),
              text: match,
              confidence: 0.8,
            });
          });
        }
      });
    });

    return entities;
  }

  /**
   * Generate contextual insights for Indonesian queries
   */
  private generateIndonesianInsights(
    query: string,
    intents: any[],
    features: Record<string, number>,
  ): {
    administrativeContext: boolean;
    formalityLevel: 'formal' | 'informal' | 'neutral';
    complexity: 'simple' | 'moderate' | 'complex';
    topics: string[];
  } {
    const topics: string[] = [];

    // Intent-based insights
    const topIntent = intents[0]?.intent;
    const isAdministrative = topIntent === "administrative_query" && features.administrative_score > 0.3;

    if (isAdministrative) {
      topics.push("administrasi pemerintahan");
    }
    if (topIntent === "data_request" && features.dataQuery_score > 0.3) {
      topics.push("permintaan data");
    }
    if (features.temporal_score > 0.3) {
      topics.push("referensi waktu");
    }
    if (features.is_comparison) {
      topics.push("perbandingan data");
    }
    if (query.includes("?")) {
      topics.push("pertanyaan langsung");
    }

    // Determine formality level
    const formalIndicators = ['mohon', 'silakan', 'terima kasih', 'dengan hormat'];
    const informalIndicators = ['dong', 'sih', 'nih', 'gimana', 'udah'];

    const formalCount = formalIndicators.filter(indicator =>
      new RegExp(`\\b${indicator}\\b`, 'gi').test(query)
    ).length;

    const informalCount = informalIndicators.filter(indicator =>
      new RegExp(`\\b${indicator}\\b`, 'gi').test(query)
    ).length;

    let formalityLevel: 'formal' | 'informal' | 'neutral' = 'neutral';
    if (formalCount > informalCount) {
      formalityLevel = 'formal';
    } else if (informalCount > formalCount) {
      formalityLevel = 'informal';
    }

    // Determine complexity
    let complexity: 'simple' | 'moderate' | 'complex' = 'moderate';
    if (features.word_count > 0.8 || features.is_comparison) {
      complexity = 'complex';
    } else if (features.word_count < 0.3 && query.split(' ').length < 5) {
      complexity = 'simple';
    }

    return {
      administrativeContext: isAdministrative,
      formalityLevel,
      complexity,
      topics,
    };
  }

  /**
   * Post-process prediction results (legacy method for compatibility)
   */
  private postProcessPrediction(
    predictionData: Float32Array | Int32Array | Uint8Array,
    options: ProcessingOptions,
  ): TensorFlowResult {
    const predictions = Array.from(predictionData);
    const maxAlternatives = options.maxAlternatives || 3;
    const threshold = options.threshold || 0.1;

    // Find top predictions
    const indexedPredictions = predictions
      .map((confidence, index) => ({
        intent: this.intentLabels[index] || "unknown",
        confidence,
      }))
      .filter((pred) => pred.confidence >= threshold)
      .sort((a, b) => b.confidence - a.confidence);

    const topPrediction = indexedPredictions[0] || {
      intent: "general",
      confidence: 0.5,
    };
    const alternatives = indexedPredictions
      .slice(1, maxAlternatives + 1)
      .filter((pred) => pred.confidence > 0.1);

    return {
      intent: topPrediction.intent,
      confidence: topPrediction.confidence,
      alternatives: alternatives.length > 0 ? alternatives : undefined,
      processingTime: 0, // Will be set by caller
      modelVersion: this.modelVersion,
    };
  }

  /**
   * Initialize Indonesian vocabulary
   */
  private initializeVocabulary(): void {
    // Basic Indonesian administrative vocabulary
    const vocab = [
      "[PAD]",
      "[UNK]",
      "[CLS]",
      "[SEP]",
      // Administrative terms
      "data",
      "informasi",
      "laporan",
      "statistik",
      "jumlah",
      "total",
      "penduduk",
      "warga",
      "masyarakat",
      "keluarga",
      "rumah",
      "tangga",
      "kelurahan",
      "kecamatan",
      "kabupaten",
      "provinsi",
      "desa",
      "rukun",
      "tetangga",
      "warga",
      "rt",
      "rw",
      // Query terms
      "cari",
      "temukan",
      "lihat",
      "tampilkan",
      "berapa",
      "kapan",
      "dimana",
      "siapa",
      "apa",
      "bagaimana",
      "mengapa",
      "berikan",
      "tolong",
      // Time expressions
      "hari",
      "minggu",
      "bulan",
      "tahun",
      "tanggal",
      "waktu",
      "januari",
      "februari",
      "maret",
      "april",
      "mei",
      "juni",
      "juli",
      "agustus",
      "september",
      "oktober",
      "november",
      "desember",
      // Numbers and quantities
      "satu",
      "dua",
      "tiga",
      "empat",
      "lima",
      "enam",
      "tujuh",
      "delapan",
      "sembilan",
      "sepuluh",
      "ribu",
      "juta",
      "miliar",
      "banyak",
      "sedikit",
      "lebih",
      "kurang",
      // Administrative actions
      "daftar",
      "registrasi",
      "pencatatan",
      "pelaporan",
      "pengaduan",
      "pelayanan",
      "bantuan",
      "informasi",
      "konsultasi",
    ];

    vocab.forEach((word, index) => {
      this.indonesianVocab.set(word, index);
    });
  }

  /**
   * Load tokenizer configuration
   */
  private async loadTokenizer(tokenizerUrl: string): Promise<void> {
    try {
      // Convert relative path to full URL if needed
      let fullTokenizerUrl = tokenizerUrl;
      if (tokenizerUrl.startsWith('/')) {
        // On client-side, use window.location.origin
        if (typeof window !== 'undefined') {
          fullTokenizerUrl = `${window.location.origin}${tokenizerUrl}`;
        } else {
          // On server-side, use localhost (fallback)
          fullTokenizerUrl = `http://localhost:3000${tokenizerUrl}`;
        }
      }

      console.log("Loading tokenizer from:", fullTokenizerUrl);
      const response = await fetch(fullTokenizerUrl);
      if (response.ok) {
        this.tokenizer = await response.json();
        console.log("Tokenizer loaded successfully");
      }
    } catch (error) {
      console.warn("Could not load tokenizer, using default:", error);
    }
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(query: string, options: ProcessingOptions): string {
    return `${query}:${JSON.stringify(options)}`;
  }

  /**
   * Cache result dengan LRU eviction
   */
  private cacheResult(key: string, result: TensorFlowResult): void {
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, result);
  }

  /**
   * Get model info
   */
  getModelInfo(): { loaded: boolean; version: string; cacheSize: number } {
    if (this.useStub && this.stubService) {
      return this.stubService.getModelInfo();
    }

    return {
      loaded: this.model !== null,
      version: this.modelVersion,
      cacheSize: this.cache.size,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Dispose model dan cleanup resources
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.clearCache();
  }
}
