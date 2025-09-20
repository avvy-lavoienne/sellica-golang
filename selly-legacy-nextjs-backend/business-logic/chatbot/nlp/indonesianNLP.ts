/**
 * Enhanced Indonesian Natural Language Processing for SELLY Chatbot
 * Handles complex query patterns, synonyms, context awareness, and domain-specific intelligence
 */

export interface ProcessedQuery {
  originalQuery: string;
  normalizedQuery: string;
  queryType:
    | "compound"
    | "comparative"
    | "conditional"
    | "aggregation"
    | "simple";
  entities: {
    tables?: string[];
    dateExpressions?: DateExpression[];
    numbers?: number[];
    statuses?: string[];
    operators?: string[];
    userStatistics?: boolean;
    comparisons?: ComparisonExpression[];
    conditions?: ConditionalExpression[];
    aggregations?: AggregationExpression[];
  };
  intent: {
    primary: string;
    secondary?: string[];
    confidence: number;
  };
  context: {
    isFollowUp: boolean;
    references?: string[];
    implicitSubject?: string;
    // NEW: Phase 3 enhanced context properties
    followUpType?:
      | "explicit"
      | "implicit"
      | "clarification"
      | "drill_down"
      | "comparative"
      | "semantic_continuation";
    semanticRelevance?: number;
    resolvedEntities?: Map<string, string>;
    topicContinuity?: number;
    topicShift?: boolean;
    conversationStage?:
      | "initial"
      | "clarification"
      | "drill_down"
      | "comparison"
      | "summary";
    expectedFollowUps?: string[];
  };
}

export interface DateExpression {
  type: "absolute" | "relative" | "range";
  startDate?: Date;
  endDate?: Date;
  period?: string;
  originalText: string;
}

export interface ComparisonExpression {
  type:
    | "temporal"
    | "quantitative"
    | "categorical"
    | "similarity"
    | "trend"
    | "performance";
  subjects: string[];
  operator:
    | "vs"
    | "dengan"
    | "dibanding"
    | "terhadap"
    | "sama"
    | "seperti"
    | "mirip";
  confidence?: number;
  semanticType?: string;
  originalText: string;
}

export interface ConditionalExpression {
  condition: string;
  subject: string;
  operator: "jika" | "kalau" | "bila" | "apabila";
  value?: string;
  booleanOperator?: "AND" | "OR" | "NOT";
  precedence?: number;
  nestedConditions?: ConditionalExpression[];
  originalText: string;
}

// New interfaces untuk advanced boolean processing
export interface BooleanToken {
  value: string;
  type: "operator" | "operand" | "parenthesis";
  precedence: number;
}

export interface BooleanExpression {
  operator?: "AND" | "OR" | "NOT";
  left?: BooleanExpression | string;
  right?: BooleanExpression | string;
  value?: string;
}

// NEW: Phase 3 - Advanced Context & Conversation Management Interfaces
export interface EntityRelation {
  entityId: string;
  entityType: "table" | "status" | "operator" | "date" | "quantity";
  relationshipType: "belongs_to" | "has_many" | "references" | "depends_on";
  strength: number; // 0.0 - 1.0
  lastUsed: Date;
  contextRelevance: number;
}

export interface ConversationNode {
  id: string;
  query: string;
  timestamp: Date;
  entities: string[];
  topics: string[];
  queryType: string;
  confidence: number;
  parentNodeId?: string;
  childNodeIds: string[];
  semanticSimilarity?: number;
}

export interface SemanticContext {
  primaryTopic: string;
  secondaryTopics: string[];
  entityMentions: Map<string, number>;
  temporalContext: {
    timeframe: string;
    isRelative: boolean;
    referencePoint?: Date;
  };
  conversationStage:
    | "initial"
    | "clarification"
    | "drill_down"
    | "comparison"
    | "summary";
  userIntent: "information" | "action" | "analysis" | "verification";
}

export interface FollowUpAnalysis {
  isFollowUp: boolean;
  type:
    | "explicit"
    | "implicit"
    | "clarification"
    | "drill_down"
    | "comparative"
    | "semantic_continuation";
  relevance: number;
  referenceEntities: string[];
  impliedContext: string[];
}

export interface PronounAnalysis {
  references: string[];
  resolvedEntities: Map<string, string>;
  confidence: Map<string, number>;
  contextDistance: Map<string, number>;
}

export interface AggregationExpression {
  function:
    | "sum"
    | "count"
    | "avg"
    | "max"
    | "min"
    | "group"
    | "statistics"
    | "analysis"
    | "summary"
    | "report"
    | "trend"
    | "percentage"
    | "median"
    | "mode"
    | "stddev"
    | "variance"
    | "percentile"
    | "quartile"
    | "growth_rate"
    | "decline_rate"
    | "change_rate"
    | "volatility"
    | "stability"
    | "correlation"
    | "impact_analysis"
    | "distribution"
    | "histogram"
    | "forecast"
    | "seasonal";
  subject: string;
  groupBy?: string;
  confidence?: number;
  percentileValue?: number;
  quartileNumber?: number;
  originalText: string;
}

export class IndonesianNLP {
  private static instance: IndonesianNLP;

  // NEW: Phase 3 - Context & Conversation Management Properties
  private entityRelationships = new Map<string, EntityRelation[]>();
  private conversationFlow: ConversationNode[] = [];
  private semanticMemory = new Map<string, SemanticContext>();
  private currentContext: SemanticContext | null = null;
  private conversationHistory: ConversationNode[] = [];
  private maxHistorySize = 20; // Keep last 20 conversation nodes
  private contextDecayFactor = 0.1; // Context relevance decay per query

  // Enhanced comprehensive synonym mappings
  private readonly synonyms = {
    quantity: [
      // Standard forms
      "jumlah",
      "total",
      "banyak",
      "berapa",
      "ada berapa",
      "sejumlah",
      "sebanyak",
      // Informal variations
      "berape",
      "brapa",
      "brp",
      "ada brp",
      "brp banyak",
      "brp jumlah",
      // Regional variations (Jawa, Sunda, Betawi)
      "piro",
      "barapa",
      "sabaraha",
      "segimana banyak",
      "gimana banyaknya",
      "ada berapa banyak",
      // NEW: Extended Javanese variations
      "pira",
      "pinten",
      "semene",
      "akehe",
      "gunggunge",
      "cacahe",
      // NEW: Extended Sundanese variations
      "sabaraha deui",
      "baraha",
      "saeutik",
      "seueur",
      "jumlahna",
      "totalnya",
      // NEW: Extended Betawi variations
      "berape banyak",
      "ada berape",
      "jumlah berape",
      "banyak mane",
      // NEW: Gen Z Indonesian expressions
      "berapa banyak sih",
      "ada berapa coba",
      "jumlahnya berapa dong",
      "totalnya berapa ya",
      "banyaknya gimana",
      // Administrative context
      "hitungan",
      "angka",
      "nilai",
      "kuantitas",
      "volume",
      "cacah",
      "rekap",
      "rekapitulasi",
      // NEW: Extended administrative terms
      "kapasitas",
      "kuota",
      "alokasi",
      "distribusi",
      "proporsi",
      "persentase",
      "rasio",
      "komposisi",
      // Government terminology
      "statistik",
      "data",
      "laporan",
      "catatan",
      "pencatatan",
      "pendataan",
      "inventarisasi",
      "sensus",
      // NEW: Extended government terms
      "pendataan ulang",
      "rekapitulasi data",
      "kompilasi",
      "agregasi",
      "tabulasi",
      "klasifikasi",
      // NEW: Informal counting expressions
      "itungan",
      "itung-itungan",
      "perkiraan kasar",
      "estimasi",
      "kira-kira",
      "sekitar",
      "kurang lebih",
    ],
    time: {
      current: [
        "sekarang",
        "ini",
        "saat ini",
        "kini",
        "masa ini",
        "skrg",
        "sekarang ini",
        "masa sekarang",
        "hr ini",
        "hari ini",
        "periode ini",
        "waktu ini",
        "saat sekarang",
        "masa kini",
      ],
      past: [
        "lalu",
        "kemarin",
        "sebelumnya",
        "yang lalu",
        "terdahulu",
        "kmrn",
        "kemaren",
        "td",
        "tadi",
        "baru-baru ini",
        "belakangan ini",
        "akhir-akhir ini",
        "tempo hari",
        "dulu",
      ],
      future: [
        "akan datang",
        "mendatang",
        "nanti",
        "esok",
        "besok",
        "ke depan",
        "selanjutnya",
        "berikutnya",
        "masa depan",
        "kedepannya",
        // NEW: Extended future expressions
        "esok hari",
        "hari esok",
        "periode mendatang",
        "waktu yang akan datang",
        "di kemudian hari",
        "suatu saat nanti",
        // Informal variations
        "ntar",
        "besok-besok",
        "kapan-kapan",
        // Regional variations
        "sesuk", // Javanese
        "benjing", // Sundanese
      ],
      // NEW: Duration expressions
      duration: [
        "selama",
        "dalam",
        "sepanjang",
        "rentang",
        "periode",
        "dalam kurun",
        "dalam rentang waktu",
        "sepanjang masa",
        "selama periode",
        "dalam jangka",
        "untuk durasi",
        // Informal variations
        "sampe",
        "sampai",
        "hingga",
        "dari...sampai",
      ],
      // NEW: Frequency expressions
      frequency: [
        "sering",
        "jarang",
        "kadang-kadang",
        "sesekali",
        "rutin",
        "berkala",
        "periodik",
        "terus-menerus",
        "kontinyu",
        "tidak pernah",
        "selalu",
        "biasanya",
        "umumnya",
        // Informal variations
        "sering banget",
        "jarang-jarang",
        "kadang aja",
        "sekali-sekali",
        "tiap hari",
        "setiap saat",
      ],
      // NEW: Recent expressions (enhanced)
      recent: [
        "baru",
        "tadi",
        "barusan",
        "baru saja",
        "belum lama",
        "baru aja",
        "tadi siang",
        "sore tadi",
        "pagi tadi",
        "malam tadi",
        "beberapa saat lalu",
        "sesaat lalu",
        "tidak lama lalu",
        // Regional variations
        "nembe", // Javanese
      ],
    },
    status: {
      completed: [
        "selesai",
        "done",
        "complete",
        "tuntas",
        "rampung",
        "beres",
        "udah beres",
        "sudah rampung",
        "sudah tuntas",
        "kelar",
        "sudah kelar",
        "disetujui",
        "approved",
        "acc",
        "ok",
        "sukses",
        "berhasil",
        // Administrative completion terms
        "disahkan",
        "divalidasi",
        "dikonfirmasi",
        "dilegalisir",
        "ditandatangani",
        "final",
        "closed",
      ],
      pending: [
        "pending",
        "menunggu",
        "belum selesai",
        "proses",
        "dalam proses",
        "blm kelar",
        "lg proses",
        "masih jalan",
        "belum tuntas",
        "menunggu approval",
        "dalam review",
        "under review",
        "on progress",
        // Administrative pending terms
        "dalam antrian",
        "tertunda",
        "ditahan",
        "menunggu verifikasi",
        "menunggu tanda tangan",
        "dalam evaluasi",
        "sedang dikaji",
        "open",
        "queue",
      ],
      rejected: [
        "ditolak",
        "rejected",
        "tidak disetujui",
        "gagal",
        "tidak lolos",
        "tidak memenuhi",
        "decline",
        "failed",
        // Administrative rejection terms
        "tidak sah",
        "invalid",
        "expired",
        "kadaluarsa",
        "tidak lengkap",
        "kurang berkas",
        "tidak sesuai",
        "cancelled",
        "dibatalkan",
      ],
      active: [
        "aktif",
        "active",
        "berjalan",
        "hidup",
        "on",
        "nyala",
        // Administrative active terms
        "berlaku",
        "valid",
        "operasional",
        "running",
        "live",
      ],
      inactive: [
        "tidak aktif",
        "inactive",
        "mati",
        "nonaktif",
        "off",
        "padam",
        // Administrative inactive terms
        "tidak berlaku",
        "expired",
        "kadaluarsa",
        "suspended",
        "ditangguhkan",
        "freeze",
        "dibekukan",
      ],
    },
    comparison: [
      "bandingkan",
      "compare",
      "vs",
      "versus",
      "dibanding",
      "terhadap",
      "dengan",
      "banding",
      "adu",
      "lawan",
      "kontra",
      "perbandingan antara",
    ],
    condition: [
      "jika",
      "kalau",
      "bila",
      "apabila",
      "andai",
      "seandainya",
      "kalo",
      "klo",
      "misal",
      "misalnya",
      "ketika",
      "saat",
      "waktu",
    ],
    aggregation: {
      sum: ["total", "jumlah", "sum", "tambah", "akumulasi", "gabungan"],
      count: ["hitung", "count", "berapa", "ada berapa", "cacah", "itung"],
      average: ["rata-rata", "average", "mean", "rerata", "rataan"],
      max: [
        "maksimal",
        "max",
        "tertinggi",
        "terbesar",
        "paling banyak",
        "terbanyak",
      ],
      min: [
        "minimal",
        "min",
        "terendah",
        "terkecil",
        "paling sedikit",
        "tersedikit",
      ],
    },
  };

  // Enhanced domain-specific terminology dengan 50+ istilah pemerintahan
  private readonly domainTerms = {
    sellica: [
      "sellica",
      "selly",
      "sistem",
      "aplikasi",
      "platform",
      "app",
      "sistem sellica",
      "aplikasi sellica",
      "chatbot selly",
      "bot selly",
      "asisten selly",
    ],
    siak: [
      "siak",
      "sistem informasi administrasi kependudukan",
      "kependudukan",
      "sistem siak",
      "data kependudukan",
      "administrasi penduduk",
      "catatan sipil",
      "dukcapil",
      "dinas kependudukan",
      "disdukcapil",
      "adminduk",
      "capil",
    ],
    processes: {
      recording: [
        "rekam",
        "perekaman",
        "record",
        "input data",
        "entry data",
        "catat",
        "pencatatan",
        "registrasi",
        "daftar",
        "mendaftar",
        // Administrative recording terms
        "inventarisasi",
        "dokumentasi",
        "arsip",
        "filing",
        "simpan data",
        "entri",
        "input",
      ],
      verification: [
        "verifikasi",
        "cek",
        "periksa",
        "validasi",
        "konfirmasi",
        "check",
        "review",
        "audit",
        "kontrol",
        "evaluasi",
        // Administrative verification terms
        "crosscheck",
        "matching",
        "pencocokan",
        "pemeriksaan",
        "investigasi",
        "penelitian",
        "screening",
      ],
      approval: [
        "persetujuan",
        "approve",
        "setuju",
        "acc",
        "otorisasi",
        "pengesahan",
        "ratifikasi",
        "validasi",
        "konfirmasi",
        // Administrative approval terms
        "legalisir",
        "legalisasi",
        "otentikasi",
        "sah",
        "sahkan",
        "tanda tangan",
        "paraf",
        "stempel",
      ],
      submission: [
        "pengajuan",
        "submit",
        "ajukan",
        "kirim",
        "serahkan",
        "proposal",
        "permohonan",
        "aplikasi",
        "permintaan",
        // Administrative submission terms
        "usulan",
        "rekomendasi",
        "laporan",
        "berkas",
        "dokumen",
        "filing",
        "upload",
        "unggah",
      ],
      // New administrative processes
      correction: [
        "koreksi",
        "perbaikan",
        "revisi",
        "edit",
        "ubah",
        "ganti",
        "update",
        "pembaruan",
        "amandemen",
      ],
      cancellation: [
        "pembatalan",
        "cancel",
        "batal",
        "hapus",
        "delete",
        "void",
        "annul",
        "revoke",
        "cabut",
      ],
    },
    roles: {
      admin: [
        "admin",
        "administrator",
        "pengelola",
        "manajer sistem",
        "super admin",
        "system admin",
        "pengelola sistem",
      ],
      operator: [
        "operator",
        "petugas",
        "staff",
        "pegawai",
        "karyawan",
        "petugas entry",
        "data entry",
        "input operator",
      ],
      user: [
        "user",
        "pengguna",
        "masyarakat",
        "warga",
        "penduduk",
        "citizen",
        "pemohon",
        "klien",
        "customer",
      ],
    },
    documents: {
      types: [
        "dokumen",
        "berkas",
        "file",
        "lampiran",
        "attachment",
        "surat",
        "formulir",
        "form",
        "aplikasi",
        "permohonan",
      ],
      actions: [
        "upload",
        "unggah",
        "kirim",
        "submit",
        "serahkan",
        "download",
        "unduh",
        "ambil",
        "cetak",
        "print",
      ],
    },
    // NEW: Enhanced Government & Administrative Terminology
    government: {
      agencies: [
        "kemendagri",
        "kementerian dalam negeri",
        "mendagri",
        "bps",
        "badan pusat statistik",
        "statistik indonesia",
        "bkn",
        "badan kepegawaian negara",
        "kepegawaian",
        "lan",
        "lembaga administrasi negara",
        "administrasi negara",
        "kemenkumham",
        "kementerian hukum dan ham",
        "imigrasi",
        "dirjen dukcapil",
        "direktorat jenderal kependudukan",
      ],
      legal: [
        "peraturan",
        "perda",
        "peraturan daerah",
        "sk",
        "surat keputusan",
        "instruksi",
        "edaran",
        "maklumat",
        "pengumuman",
        "penetapan",
        "ketetapan",
        "keputusan",
        "putusan",
        "undang-undang",
        "uu",
        "peraturan pemerintah",
        "pp",
        "peraturan menteri",
        "permen",
      ],
      workflow: [
        "disposisi",
        "teruskan",
        "tindak lanjut",
        "follow up",
        "koordinasi",
        "konsultasi",
        "klarifikasi",
        "konfirmasi",
        "eskalasi",
        "delegasi",
        "mandate",
        "otorisasi",
        "briefing",
        "rapat koordinasi",
        "rakor",
        "evaluasi",
        "monitoring",
        "supervisi",
      ],
      hierarchy: {
        executive: [
          "kepala dinas",
          "kadis",
          "sekda",
          "sekretaris daerah",
          "bupati",
          "walikota",
          "gubernur",
          "camat",
          "lurah",
          "kepala desa",
          "kades",
        ],
        management: [
          "kabag",
          "kepala bagian",
          "kasubag",
          "kepala sub bagian",
          "kasi",
          "kepala seksi",
          "kasubbag",
          "kepala sub bagian",
          "koordinator",
          "supervisor",
          "team leader",
        ],
        staff: [
          "staf",
          "pelaksana",
          "fungsional",
          "analis",
          "pranata",
          "teknis",
          "administrasi",
          "sekretaris",
          "bendahara",
          "kasir",
        ],
      },
      departments: {
        dukcapil: [
          "petugas dukcapil",
          "operator siak",
          "verifikator data",
          "supervisor data",
          "analis kependudukan",
          "petugas pelayanan",
          "customer service dukcapil",
        ],
        it: [
          "admin sistem",
          "database administrator",
          "system analyst",
          "programmer",
          "network administrator",
          "it support",
          "helpdesk",
        ],
        public_service: [
          "petugas pelayanan",
          "customer service",
          "front office",
          "back office",
          "loket pelayanan",
          "petugas informasi",
        ],
      },
      external: [
        "pemohon",
        "applicant",
        "warga",
        "masyarakat",
        "citizen",
        "vendor",
        "penyedia jasa",
        "konsultan",
        "auditor eksternal",
        "pihak ketiga",
        "stakeholder",
      ],
      status_bureaucratic: [
        "dalam proses",
        "sedang dikaji",
        "menunggu disposisi",
        "butuh klarifikasi",
        "perlu koordinasi",
        "menunggu persetujuan atasan",
        "dalam tahap finalisasi",
        "siap untuk ditandatangani",
        "menunggu legalisir",
        "dalam tahap review",
        "sedang diverifikasi",
        "menunggu konfirmasi",
      ],
    },
    // NEW: Enhanced Document Types
    document_types: {
      identity: [
        "ktp",
        "kartu tanda penduduk",
        "e-ktp",
        "kk",
        "kartu keluarga",
        "akta kelahiran",
        "akta kematian",
        "akta nikah",
        "akta cerai",
        "paspor",
        "sim",
        "surat izin mengemudi",
      ],
      administrative: [
        "surat keterangan",
        "surat pengantar",
        "surat rekomendasi",
        "surat kuasa",
        "berita acara",
        "laporan",
        "proposal",
        "memorandum",
        "nota dinas",
        "surat tugas",
      ],
      permits: [
        "izin usaha",
        "siup",
        "tdp",
        "npwp",
        "izin mendirikan bangunan",
        "imb",
        "izin lingkungan",
        "amdal",
        "ho",
        "hinder ordonnantie",
      ],
    },
  };

  // Enhanced complex date expression patterns
  private readonly datePatterns = {
    relative: {
      // Basic relative dates
      "minggu lalu": { days: -7, type: "week" },
      "bulan lalu": { months: -1, type: "month" },
      "tahun lalu": { years: -1, type: "year" },
      "hari ini": { days: 0, type: "day" },
      kemarin: { days: -1, type: "day" },
      besok: { days: 1, type: "day" },

      // Numeric relative dates
      "2 hari lalu": { days: -2, type: "days" },
      "3 hari lalu": { days: -3, type: "days" },
      "1 minggu lalu": { days: -7, type: "week" },
      "2 minggu lalu": { days: -14, type: "weeks" },
      "3 minggu lalu": { days: -21, type: "weeks" },
      "2 bulan lalu": { months: -2, type: "months" },
      "3 bulan lalu": { months: -3, type: "months" },
      "6 bulan lalu": { months: -6, type: "months" },

      // Periods
      "semester pertama": { months: [0, 5], type: "semester" },
      "semester kedua": { months: [6, 11], type: "semester" },
      "kuartal pertama": { months: [0, 2], type: "quarter" },
      "kuartal kedua": { months: [3, 5], type: "quarter" },
      "kuartal ketiga": { months: [6, 8], type: "quarter" },
      "kuartal keempat": { months: [9, 11], type: "quarter" },

      // Current periods
      "bulan ini": { months: 0, type: "current_month" },
      "tahun ini": { years: 0, type: "current_year" },
      "minggu ini": { days: 0, type: "current_week" },

      // Informal expressions
      kmrn: { days: -1, type: "day" },
      td: { days: 0, type: "day" },
      "hr ini": { days: 0, type: "day" },
    },
    approximate: [
      "sekitar",
      "kira-kira",
      "kurang lebih",
      "lebih kurang",
      "hampir",
      "sekitaran",
      "kisaran",
      "perkiraan",
      "estimasi",
    ],
    // Dynamic numeric patterns for flexible parsing
    numericPatterns: [
      /(\d+)\s+(hari|hr)\s+(lalu|yang lalu|kemarin)/i,
      /(\d+)\s+(minggu|mgg)\s+(lalu|yang lalu)/i,
      /(\d+)\s+(bulan|bln)\s+(lalu|yang lalu)/i,
      /(\d+)\s+(tahun|thn)\s+(lalu|yang lalu)/i,
    ],
  };

  // Enhanced typo correction mappings
  private readonly typoCorrections = {
    // Common quantity typos
    jumalh: "jumlah",
    berpa: "berapa",
    brapa: "berapa",
    berape: "berapa",
    bnyak: "banyak",

    // System/domain typos
    aktifitas: "aktivitas",
    dokumnetasi: "dokumentasi",
    pengajuaan: "pengajuan",
    opertor: "operator",
    admn: "admin",
    sistm: "sistem",
    sellika: "sellica",

    // Time-related typos
    kmrn: "kemarin",
    skrg: "sekarang",
    thn: "tahun",
    bln: "bulan",
    mgg: "minggu",

    // Status typos
    slesai: "selesai",
    tuntas: "tuntas",
    prses: "proses",
    menungu: "menunggu",

    // Common words
    dgn: "dengan",
    yg: "yang",
    utk: "untuk",
    krn: "karena",
    jd: "jadi",
    sdh: "sudah",
    blm: "belum",
  };

  public static getInstance(): IndonesianNLP {
    if (!IndonesianNLP.instance) {
      IndonesianNLP.instance = new IndonesianNLP();
    }
    return IndonesianNLP.instance;
  }

  /**
   * Main processing method for Indonesian queries
   */
  public processQuery(
    query: string,
    conversationContext?: any,
  ): ProcessedQuery {
    // Step 1: Normalize and clean the query
    const normalizedQuery = this.normalizeQuery(query);

    // Step 2: Detect query type
    const queryType = this.detectQueryType(normalizedQuery);

    // Step 3: Extract entities
    const entities = this.extractEntities(normalizedQuery, queryType);

    // Step 4: Determine intent
    const intent = this.determineIntent(normalizedQuery, queryType, entities);

    // Step 5: Analyze context
    const context = this.analyzeContext(normalizedQuery, conversationContext);

    return {
      originalQuery: query,
      normalizedQuery,
      queryType,
      entities,
      intent,
      context,
    };
  }

  /**
   * Normalize query by handling typos, synonyms, and standardizing format
   */
  private normalizeQuery(query: string): string {
    let normalized = query.toLowerCase().trim();

    // Step 1: Handle informal expressions
    normalized = this.normalizeInformalExpressions(normalized);

    // Step 2: Fix typos with fuzzy matching
    normalized = this.correctTypos(normalized);

    // Step 3: Expand synonyms
    normalized = this.expandSynonyms(normalized);

    // Step 4: Standardize punctuation
    normalized = normalized.replace(/[?!.]+$/, "");
    normalized = normalized.replace(/\s+/g, " ");

    return normalized;
  }

  /**
   * Detect the type of query based on patterns
   */
  private detectQueryType(query: string): ProcessedQuery["queryType"] {
    const tokens = query.split(" ");

    // Check for user statistics queries first (before aggregation)
    const isUserStatsQuery = this.isUserStatisticsQuery(query);
    if (isUserStatsQuery) {
      return "simple"; // Treat user stats as simple queries to avoid aggregation processing
    }

    // Check for compound questions (multiple "dan", "atau", "serta")
    if (this.hasMultipleConjunctions(tokens)) {
      return "compound";
    }

    // Check for comparative patterns
    if (this.hasComparisonPatterns(tokens)) {
      return "comparative";
    }

    // Check for conditional patterns
    if (this.hasConditionalPatterns(tokens)) {
      return "conditional";
    }

    // Check for aggregation patterns
    if (this.hasAggregationPatterns(tokens)) {
      return "aggregation";
    }

    return "simple";
  }

  private isUserStatisticsQuery(query: string): boolean {
    const userKeywords = ["user", "pengguna", "sellica", "member", "anggota"];
    const quantityKeywords = ["berapa", "jumlah", "total", "banyak"];

    const hasUserKeyword = userKeywords.some(keyword => query.includes(keyword));
    const hasQuantityKeyword = quantityKeywords.some(keyword => query.includes(keyword));

    return hasUserKeyword && hasQuantityKeyword;
  }

  /**
   * Extract entities from the normalized query
   */
  private extractEntities(
    query: string,
    queryType: ProcessedQuery["queryType"],
  ): ProcessedQuery["entities"] {
    const entities: ProcessedQuery["entities"] = {};

    // Extract tables
    entities.tables = this.extractTables(query);

    // Extract date expressions
    entities.dateExpressions = this.extractDateExpressions(query);

    // Extract numbers
    entities.numbers = this.extractNumbers(query);

    // Extract statuses
    entities.statuses = this.extractStatuses(query);

    // Extract operators/roles
    entities.operators = this.extractOperators(query);

    // Extract user statistics indicators
    entities.userStatistics = this.extractUserStatistics(query);

    // Type-specific entity extraction
    switch (queryType) {
      case "comparative":
        entities.comparisons = this.extractComparisons(query);
        break;
      case "conditional":
        entities.conditions = this.extractConditions(query);
        break;
      case "aggregation":
        entities.aggregations = this.extractAggregations(query);
        break;
    }

    return entities;
  }

  /**
   * Determine the primary and secondary intents
   */
  private determineIntent(
    query: string,
    queryType: ProcessedQuery["queryType"],
    entities: ProcessedQuery["entities"],
  ): ProcessedQuery["intent"] {
    const tokens = query.split(" ");
    let confidence = 0.5;

    // Primary intent detection
    let primary = "general";
    const secondary: string[] = [];



    // Greeting detection (highest priority)
    const greetingKeywords = ["halo", "hai", "hello", "selamat", "pagi", "siang", "sore", "malam", "selly"];
    const isGreeting = tokens.some(token => greetingKeywords.includes(token)) && tokens.length <= 3;

    if (isGreeting) {
      primary = "help";
      confidence += 0.5;
      console.log('Detected as greeting/help query');
      return {
        primary,
        secondary: secondary.length > 0 ? secondary : undefined,
        confidence: Math.min(confidence, 1.0),
      };
    }

    // Enhanced search query detection
    const searchKeywords = ["cari", "temukan", "tampilkan", "lihat", "nama", "nik"];
    const hasSearchKeyword = tokens.some(token => searchKeywords.includes(token));

    // Check for specific search patterns
    const hasNIKPattern = /\b\d{16}\b/.test(query);
    const hasNamePattern = /nama\s+\w+/i.test(query);
    const hasSearchPattern = /cari|temukan|tampilkan|lihat/i.test(query);

    if (hasSearchKeyword || hasNIKPattern || hasNamePattern || hasSearchPattern) {
      primary = "search";
      confidence += 0.4;

    }

    // Enhanced statistical queries detection
    const statisticsKeywords = ["statistik", "jumlah", "berapa", "total", "ringkasan", "overview", "semua", "banyak"];
    const hasStatKeyword = tokens.some(token => statisticsKeywords.includes(token));
    const hasQuantityPattern = /berapa\s+(jumlah|banyak|total)|jumlah\s+(user|pengguna|data)|total\s+(user|pengguna|data)/i.test(query);

    if (hasStatKeyword || hasQuantityPattern || this.synonyms.quantity.some((syn) => tokens.includes(syn))) {
      if (primary === "general") {
        primary = "statistics";
        confidence += 0.4;

      } else {
        secondary.push("statistics");
        confidence += 0.2;
      }
    }

    // Help queries detection
    const helpKeywords = ["bantuan", "help", "tolong", "panduan", "cara"];
    if (tokens.some(token => helpKeywords.includes(token))) {
      if (primary === "general") {
        primary = "help";
        confidence += 0.4;

      } else {
        secondary.push("help");
        confidence += 0.2;
      }
    }

    // Table-specific queries
    const tableKeywords = ["tabel", "pengajuan", "pengaduan", "salah", "rekam", "dokumentasi", "profil"];
    if (tokens.some(token => tableKeywords.includes(token))) {
      if (primary === "general") {
        primary = "statistics";
        confidence += 0.3;

      } else {
        secondary.push("table_specific");
        confidence += 0.2;
      }
    }

    // Adjust confidence based on entities found
    if (entities.tables && entities.tables.length > 0) confidence += 0.2;
    if (entities.dateExpressions && entities.dateExpressions.length > 0)
      confidence += 0.1;
    if (entities.statuses && entities.statuses.length > 0) confidence += 0.1;

    // Query type specific adjustments
    switch (queryType) {
      case "compound":
        secondary.push("multi_part");
        confidence += 0.1;
        break;
      case "comparative":
        secondary.push("comparison");
        confidence += 0.15;
        break;
      case "conditional":
        secondary.push("conditional");
        confidence += 0.1;
        break;
      case "aggregation":
        if (primary === "general") primary = "statistics";
        secondary.push("aggregation");
        confidence += 0.2;
        break;
    }

    const result = {
      primary,
      secondary: secondary.length > 0 ? secondary : undefined,
      confidence: Math.min(confidence, 1.0),
    };


    return result;
  }

  /**
   * Enhanced conversation context analysis dengan deep semantic understanding
   */
  private analyzeContext(
    query: string,
    conversationContext?: any,
  ): ProcessedQuery["context"] {
    const context: ProcessedQuery["context"] = {
      isFollowUp: false,
    };

    // Enhanced semantic follow-up detection
    const followUpAnalysis = this.detectSemanticFollowUp(
      query,
      conversationContext,
    );
    context.isFollowUp = followUpAnalysis.isFollowUp;
    context.followUpType = followUpAnalysis.type;
    context.semanticRelevance = followUpAnalysis.relevance;

    // Deep pronoun resolution dengan entity relationships
    const pronounAnalysis = this.resolvePronouns(query, conversationContext);
    context.references = pronounAnalysis.references;
    context.resolvedEntities = pronounAnalysis.resolvedEntities;

    // Topic continuity tracking
    const topicAnalysis = this.analyzeTopicContinuity(
      query,
      conversationContext,
    );
    context.topicContinuity = topicAnalysis.continuity;
    context.topicShift = topicAnalysis.shift;
    context.implicitSubject = topicAnalysis.implicitSubject;

    // Conversation flow analysis
    context.conversationStage = this.determineConversationStage(
      query,
      conversationContext,
    );
    context.expectedFollowUps = this.predictFollowUpQuestions(query, context);

    // Update conversation history
    this.updateConversationHistory(query, context);

    return context;
  }

  /**
   * Enhanced semantic follow-up detection dengan context awareness
   */
  private detectSemanticFollowUp(
    query: string,
    context?: any,
  ): FollowUpAnalysis {
    const analysis: FollowUpAnalysis = {
      isFollowUp: false,
      type: "explicit",
      relevance: 0,
      referenceEntities: [],
      impliedContext: [],
    };

    // Enhanced follow-up indicators dengan semantic analysis
    const enhancedIndicators = [
      // Explicit continuations
      {
        patterns: ["bagaimana dengan", "lalu", "kemudian", "selanjutnya"],
        type: "explicit",
        weight: 0.9,
      },

      // Implicit continuations
      {
        patterns: ["terus?", "lanjut?", "gimana?", "bagaimana?"],
        type: "implicit",
        weight: 0.8,
      },

      // Clarification requests
      {
        patterns: ["maksudnya?", "yang mana?", "apa itu?", "jelaskan"],
        type: "clarification",
        weight: 0.85,
      },

      // Drill-down questions
      {
        patterns: ["detail", "rinci", "lebih spesifik", "breakdown"],
        type: "drill_down",
        weight: 0.82,
      },

      // Comparative follow-ups
      {
        patterns: [
          "dibanding yang lain?",
          "vs sebelumnya?",
          "perbandingannya?",
        ],
        type: "comparative",
        weight: 0.87,
      },
    ];

    // Check for semantic continuity tanpa explicit indicators
    if (context && context.lastQuery) {
      const semanticSimilarity = this.calculateSemanticSimilarity(
        query,
        context.lastQuery,
      );
      if (semanticSimilarity > 0.7) {
        analysis.isFollowUp = true;
        analysis.type = "semantic_continuation";
        analysis.relevance = semanticSimilarity;
      }
    }

    // Check explicit indicators
    for (const indicator of enhancedIndicators) {
      for (const pattern of indicator.patterns) {
        if (query.toLowerCase().includes(pattern)) {
          analysis.isFollowUp = true;
          analysis.type = indicator.type as FollowUpAnalysis["type"];
          analysis.relevance = Math.max(analysis.relevance, indicator.weight);
        }
      }
    }

    // Extract reference entities dari context
    if (context && context.lastEntities) {
      analysis.referenceEntities = context.lastEntities;
    }

    return analysis;
  }

  /**
   * Calculate semantic similarity between queries
   */
  private calculateSemanticSimilarity(query1: string, query2: string): number {
    const tokens1 = new Set(query1.toLowerCase().split(" "));
    const tokens2 = new Set(query2.toLowerCase().split(" "));

    const intersection = new Set([...tokens1].filter((x) => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);

    return intersection.size / union.size; // Jaccard similarity
  }

  /**
   * Deep pronoun resolution dengan entity relationship analysis
   */
  private resolvePronouns(query: string, context?: any): PronounAnalysis {
    const analysis: PronounAnalysis = {
      references: [],
      resolvedEntities: new Map(),
      confidence: new Map(),
      contextDistance: new Map(),
    };

    const pronounPatterns = [
      { pronoun: "itu", referenceType: "specific_entity", distance: 1 },
      { pronoun: "ini", referenceType: "current_context", distance: 0 },
      { pronoun: "tersebut", referenceType: "mentioned_entity", distance: 2 },
      { pronoun: "yang tadi", referenceType: "previous_query", distance: 1 },
      {
        pronoun: "sebelumnya",
        referenceType: "historical_context",
        distance: 3,
      },
      {
        pronoun: "yang lain",
        referenceType: "alternative_entity",
        distance: 1,
      },
      { pronoun: "yang sama", referenceType: "similar_entity", distance: 1 },
    ];

    for (const { pronoun, referenceType, distance } of pronounPatterns) {
      if (query.includes(pronoun)) {
        const resolvedEntity = this.resolveEntityReference(
          pronoun,
          referenceType,
          distance,
          context,
        );
        if (resolvedEntity) {
          analysis.references.push(pronoun);
          analysis.resolvedEntities.set(pronoun, resolvedEntity.entity);
          analysis.confidence.set(pronoun, resolvedEntity.confidence);
          analysis.contextDistance.set(pronoun, distance);
        }
      }
    }

    return analysis;
  }

  /**
   * Resolve entity reference berdasarkan pronoun dan context
   */
  private resolveEntityReference(
    pronoun: string,
    referenceType: string,
    distance: number,
    context?: any,
  ): { entity: string; confidence: number } | null {
    if (!context) return null;

    let entity = "";
    let confidence = 0.5;

    switch (referenceType) {
      case "specific_entity":
        if (context.lastTable) {
          entity = context.lastTable;
          confidence = 0.8;
        }
        break;
      case "current_context":
        if (context.currentEntities && context.currentEntities.length > 0) {
          entity = context.currentEntities[0];
          confidence = 0.9;
        }
        break;
      case "mentioned_entity":
        if (
          context.recentEntities &&
          context.recentEntities.length > distance
        ) {
          entity = context.recentEntities[distance];
          confidence = 0.7;
        }
        break;
      case "previous_query":
        if (context.lastQuery) {
          const lastEntities = this.extractTables(context.lastQuery);
          if (lastEntities.length > 0) {
            entity = lastEntities[0];
            confidence = 0.75;
          }
        }
        break;
    }

    return entity ? { entity, confidence } : null;
  }

  /**
   * Analyze topic continuity untuk conversation flow tracking
   */
  private analyzeTopicContinuity(
    query: string,
    context?: any,
  ): {
    continuity: number;
    shift: boolean;
    implicitSubject?: string;
  } {
    const analysis = {
      continuity: 0,
      shift: false,
      implicitSubject: undefined as string | undefined,
    };

    if (!context || !context.lastQuery) {
      return analysis;
    }

    // Extract topics dari current dan previous queries
    const currentTopics = this.extractTopics(query);
    const previousTopics = this.extractTopics(context.lastQuery);

    // Calculate topic overlap
    const topicOverlap = currentTopics.filter((topic) =>
      previousTopics.includes(topic),
    ).length;

    const totalTopics = new Set([...currentTopics, ...previousTopics]).size;
    analysis.continuity = totalTopics > 0 ? topicOverlap / totalTopics : 0;

    // Detect topic shift
    analysis.shift = analysis.continuity < 0.3;

    // Extract implicit subject dari topic continuity
    if (analysis.continuity > 0.5 && previousTopics.length > 0) {
      analysis.implicitSubject = previousTopics[0]; // Most recent topic
    }

    return analysis;
  }

  /**
   * Extract topics dari query untuk topic analysis
   */
  private extractTopics(query: string): string[] {
    const topics: string[] = [];

    // Extract table names as topics
    const tables = this.extractTables(query);
    topics.push(...tables);

    // Extract administrative topics
    const adminTopics = [
      "pengajuan",
      "dokumentasi",
      "verifikasi",
      "aktivitas",
      "operator",
      "admin",
      "user",
    ];
    adminTopics.forEach((topic) => {
      if (query.toLowerCase().includes(topic)) {
        topics.push(topic);
      }
    });

    // Extract process topics
    const processTopics = [
      "proses",
      "approval",
      "pending",
      "selesai",
      "ditolak",
      "disetujui",
    ];
    processTopics.forEach((topic) => {
      if (query.toLowerCase().includes(topic)) {
        topics.push(topic);
      }
    });

    return [...new Set(topics)]; // Remove duplicates
  }

  /**
   * Determine conversation stage berdasarkan query patterns dan context
   */
  private determineConversationStage(
    query: string,
    context?: any,
  ): SemanticContext["conversationStage"] {
    // Check for clarification patterns
    const clarificationPatterns = [
      "maksudnya",
      "yang mana",
      "apa itu",
      "jelaskan",
      "bisa diperjelas",
    ];
    if (
      clarificationPatterns.some((pattern) =>
        query.toLowerCase().includes(pattern),
      )
    ) {
      return "clarification";
    }

    // Check for drill-down patterns
    const drillDownPatterns = [
      "detail",
      "rinci",
      "lebih spesifik",
      "breakdown",
      "per",
      "berdasarkan",
    ];
    if (
      drillDownPatterns.some((pattern) => query.toLowerCase().includes(pattern))
    ) {
      return "drill_down";
    }

    // Check for comparison patterns
    const comparisonPatterns = [
      "bandingkan",
      "vs",
      "dibanding",
      "terhadap",
      "sama dengan",
    ];
    if (
      comparisonPatterns.some((pattern) =>
        query.toLowerCase().includes(pattern),
      )
    ) {
      return "comparison";
    }

    // Check for summary patterns
    const summaryPatterns = [
      "ringkasan",
      "kesimpulan",
      "total",
      "keseluruhan",
      "secara umum",
    ];
    if (
      summaryPatterns.some((pattern) => query.toLowerCase().includes(pattern))
    ) {
      return "summary";
    }

    // Default to initial if no specific stage detected
    return "initial";
  }

  /**
   * Predict follow-up questions berdasarkan current query dan context
   */
  private predictFollowUpQuestions(query: string, context: any): string[] {
    const followUps: string[] = [];

    // Based on query type, suggest relevant follow-ups
    if (query.includes("berapa") || query.includes("jumlah")) {
      followUps.push(
        "Bagaimana trendnya?",
        "Dibanding periode sebelumnya?",
        "Yang mana yang paling banyak?",
      );
    }

    if (query.includes("aktivitas")) {
      followUps.push(
        "Siapa operatornya?",
        "Kapan dilakukan?",
        "Status bagaimana?",
      );
    }

    if (query.includes("pengajuan")) {
      followUps.push(
        "Yang pending berapa?",
        "Sudah disetujui berapa?",
        "Yang ditolak kenapa?",
      );
    }

    if (query.includes("dokumentasi")) {
      followUps.push(
        "Yang belum lengkap?",
        "Perlu verifikasi apa?",
        "Deadline kapan?",
      );
    }

    // Based on conversation stage
    if (context.conversationStage === "initial") {
      followUps.push(
        "Perlu detail lebih lanjut?",
        "Ada yang ingin dibandingkan?",
      );
    } else if (context.conversationStage === "drill_down") {
      followUps.push("Cukup detailnya?", "Perlu analisis lain?");
    }

    return followUps.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Update conversation history dengan decay mechanism
   */
  private updateConversationHistory(query: string, context: any): void {
    const node: ConversationNode = {
      id: Date.now().toString(),
      query: query,
      timestamp: new Date(),
      entities: this.extractTables(query),
      topics: this.extractTopics(query),
      queryType: context.queryType || "unknown",
      confidence: context.confidence || 0.5,
      childNodeIds: [],
    };

    // Add to conversation flow
    this.conversationFlow.push(node);

    // Maintain history size limit
    if (this.conversationFlow.length > this.maxHistorySize) {
      this.conversationFlow.shift(); // Remove oldest
    }

    // Apply context decay to older entries
    this.applyContextDecay();
  }

  /**
   * Apply context decay untuk maintain relevance
   */
  private applyContextDecay(): void {
    const now = new Date();

    this.conversationFlow.forEach((node) => {
      const ageInMinutes =
        (now.getTime() - node.timestamp.getTime()) / (1000 * 60);
      const decayFactor = Math.exp(-this.contextDecayFactor * ageInMinutes);
      node.confidence *= decayFactor;
    });

    // Remove nodes dengan confidence terlalu rendah
    this.conversationFlow = this.conversationFlow.filter(
      (node) => node.confidence > 0.1,
    );
  }

  // Helper methods for pattern detection
  private hasMultipleConjunctions(tokens: string[]): boolean {
    const conjunctions = ["dan", "atau", "serta", "juga", "plus"];
    return tokens.filter((token) => conjunctions.includes(token)).length >= 2;
  }

  private hasComparisonPatterns(tokens: string[]): boolean {
    return this.synonyms.comparison.some((comp) =>
      tokens.some((token) => token.includes(comp)),
    );
  }

  private hasConditionalPatterns(tokens: string[]): boolean {
    return this.synonyms.condition.some((cond) => tokens.includes(cond));
  }

  private hasAggregationPatterns(tokens: string[]): boolean {
    return Object.values(this.synonyms.aggregation)
      .flat()
      .some((agg) => tokens.includes(agg));
  }

  // Entity extraction helper methods
  private extractTables(query: string): string[] {
    const tableKeywords = {
      aktivitas_user: ["aktivitas user", "aktivitas pengguna", "kegiatan user"],
      aktivitas_siak: ["aktivitas siak", "kegiatan siak", "siak"],
      dokumentasi: ["dokumentasi", "dokumen", "file"],
      salah_rekam: ["salah rekam", "kesalahan rekam", "error rekam"],
      pengajuan_bulanan: ["pengajuan", "submission", "ajuan"],
      pengaduan_bulanan: ["pengaduan", "complaint", "keluhan"],
      profiles: ["profil", "profile", "pengguna", "user"],
      adjudicate_record: ["adjudikasi", "adjudicate", "penilaian"],
      duplicate_operator: ["duplikasi", "duplicate", "gandaan"],
    };

    const foundTables: string[] = [];
    Object.entries(tableKeywords).forEach(([table, keywords]) => {
      if (keywords.some((keyword) => query.includes(keyword))) {
        foundTables.push(table);
      }
    });

    return foundTables;
  }

  private extractDateExpressions(query: string): DateExpression[] {
    const expressions: DateExpression[] = [];

    // Check for relative date patterns
    Object.entries(this.datePatterns.relative).forEach(([pattern, config]) => {
      if (query.includes(pattern)) {
        const dateExpr = this.calculateRelativeDate(config);
        expressions.push({
          type: "relative",
          startDate: dateExpr.start,
          endDate: dateExpr.end,
          period: config.type,
          originalText: pattern,
        });
      }
    });

    // Check for dynamic numeric patterns
    this.datePatterns.numericPatterns.forEach((pattern) => {
      const match = query.match(pattern);
      if (match) {
        const number = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        const config = this.createDynamicDateConfig(number, unit);

        if (config) {
          const dateExpr = this.calculateRelativeDate(config);
          expressions.push({
            type: "relative",
            startDate: dateExpr.start,
            endDate: dateExpr.end,
            period: `${number}_${unit}`,
            originalText: match[0],
          });
        }
      }
    });

    // Check for Indonesian month names with years
    const monthYearPattern =
      /(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+(\d{4})/i;
    const monthYearMatch = query.match(monthYearPattern);
    if (monthYearMatch) {
      const monthName = monthYearMatch[1].toLowerCase();
      const year = parseInt(monthYearMatch[2]);
      const monthIndex = this.getMonthIndex(monthName);

      if (monthIndex !== -1) {
        const startDate = new Date(year, monthIndex, 1);
        const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

        expressions.push({
          type: "absolute",
          startDate,
          endDate,
          period: `${monthName}_${year}`,
          originalText: monthYearMatch[0],
        });
      }
    }

    return expressions;
  }

  /**
   * Create dynamic date configuration from numeric patterns
   */
  private createDynamicDateConfig(number: number, unit: string): any {
    switch (unit) {
      case "hari":
      case "hr":
        return { days: -number, type: "days" };
      case "minggu":
      case "mgg":
        return { days: -number * 7, type: "weeks" };
      case "bulan":
      case "bln":
        return { months: -number, type: "months" };
      case "tahun":
      case "thn":
        return { years: -number, type: "years" };
      default:
        return null;
    }
  }

  /**
   * Get month index from Indonesian month name
   */
  private getMonthIndex(monthName: string): number {
    const monthNames: Record<string, number> = {
      januari: 0,
      februari: 1,
      maret: 2,
      april: 3,
      mei: 4,
      juni: 5,
      juli: 6,
      agustus: 7,
      september: 8,
      oktober: 9,
      november: 10,
      desember: 11,
    };
    return monthNames[monthName.toLowerCase()] ?? -1;
  }

  private extractNumbers(query: string): number[] {
    const numberRegex = /\b\d+\b/g;
    const matches = query.match(numberRegex);
    return matches ? matches.map(Number) : [];
  }

  private extractStatuses(query: string): string[] {
    const statuses: string[] = [];

    Object.entries(this.synonyms.status).forEach(([status, synonyms]) => {
      if (synonyms.some((syn) => query.includes(syn))) {
        statuses.push(status);
      }
    });

    return statuses;
  }

  private extractOperators(query: string): string[] {
    const operators: string[] = [];

    Object.entries(this.domainTerms.roles).forEach(([role, terms]) => {
      if (terms.some((term) => query.includes(term))) {
        operators.push(role);
      }
    });

    return operators;
  }

  private extractUserStatistics(query: string): boolean {
    const userStatsKeywords = [
      "user", "pengguna", "sellica", "member", "anggota"
    ];

    const quantityKeywords = [
      "berapa", "jumlah", "total", "banyak", "ada berapa"
    ];

    const hasUserKeyword = userStatsKeywords.some(keyword => query.includes(keyword));
    const hasQuantityKeyword = quantityKeywords.some(keyword => query.includes(keyword));

    return hasUserKeyword && hasQuantityKeyword;
  }

  /**
   * Enhanced extractComparisons dengan natural language patterns dan semantic analysis
   */
  private extractComparisons(query: string): ComparisonExpression[] {
    const comparisons: ComparisonExpression[] = [];

    // Enhanced comparison patterns dengan natural language support
    const comparisonPatterns = [
      // Direct comparison commands (confidence: 0.95)
      {
        pattern: /bandingkan\s+(.+?)\s+(dengan|vs|terhadap|dibanding)\s+(.+)/i,
        confidence: 0.95,
        semanticType: "explicit_comparison",
      },
      {
        pattern: /banding\s+(.+?)\s+(dengan|vs|terhadap|dibanding)\s+(.+)/i,
        confidence: 0.9,
        semanticType: "explicit_comparison",
      },
      {
        pattern: /adu\s+(.+?)\s+(dengan|vs|terhadap|lawan)\s+(.+)/i,
        confidence: 0.85,
        semanticType: "explicit_comparison",
      },

      // NEW: Natural comparisons tanpa explicit keywords
      {
        pattern: /(.+?)\s+(sama|seperti|mirip)\s+(dengan\s+)?(.+)/i,
        confidence: 0.82,
        semanticType: "similarity_comparison",
      },
      {
        pattern:
          /(.+?)\s+(lebih|kurang)\s+(banyak|sedikit|tinggi|rendah)\s+(dari|daripada)\s+(.+)/i,
        confidence: 0.88,
        semanticType: "quantitative_natural",
      },
      {
        pattern:
          /(.+?)\s+(naik|turun|stabil|meningkat|menurun)\s+(dibanding|dari)\s+(.+)/i,
        confidence: 0.85,
        semanticType: "trend_comparison",
      },

      // NEW: Implicit temporal comparisons
      {
        pattern:
          /(.+?)\s+(sekarang|saat ini)\s+(.+?)\s+(dulu|sebelumnya|kemarin)/i,
        confidence: 0.83,
        semanticType: "implicit_temporal",
      },
      {
        pattern:
          /(.+?)\s+(hari ini|kemarin|minggu ini|bulan ini)\s+(vs|dengan|dibanding)?\s*(.+?)\s+(hari lalu|minggu lalu|bulan lalu)/i,
        confidence: 0.86,
        semanticType: "explicit_temporal",
      },

      // NEW: Question-based comparisons
      {
        pattern:
          /(.+?)\s+(lebih banyak|lebih sedikit|sama banyak)\s+(ga|tidak|nggak|kan)\?/i,
        confidence: 0.8,
        semanticType: "question_comparison",
      },
      {
        pattern:
          /mana\s+(yang\s+)?(lebih|paling)\s+(banyak|sedikit|tinggi|rendah)\s+(.+)/i,
        confidence: 0.84,
        semanticType: "superlative_comparison",
      },

      // NEW: Administrative comparison patterns
      {
        pattern:
          /(kinerja|performa|produktivitas)\s+(.+?)\s+(vs|dibanding|dengan)\s+(.+)/i,
        confidence: 0.81,
        semanticType: "performance_comparison",
      },
      {
        pattern:
          /(efisiensi|efektivitas)\s+(.+?)\s+(vs|dibanding|dengan)\s+(.+)/i,
        confidence: 0.79,
        semanticType: "efficiency_comparison",
      },

      // Existing temporal comparisons (enhanced)
      {
        pattern:
          /(.+?)\s+(bulan|tahun|minggu|hari)\s+(ini|lalu|kemarin|sekarang)\s+(vs|dibanding|dengan)\s+(.+?)\s+(bulan|tahun|minggu|hari)\s+(ini|lalu|kemarin|sekarang)/i,
        confidence: 0.9,
        semanticType: "temporal_explicit",
      },
      {
        pattern:
          /aktivitas\s+(.+?)\s+(bulan|tahun|minggu)\s+(ini|lalu)\s+(vs|dibanding|dengan)\s+(.+?)\s+(bulan|tahun|minggu)\s+(ini|lalu)/i,
        confidence: 0.88,
        semanticType: "temporal_activity",
      },

      // Existing quantitative comparisons (enhanced)
      {
        pattern:
          /(jumlah|total|banyak|statistik)\s+(.+?)\s+(vs|dibanding|dengan)\s+(jumlah|total|banyak|statistik)\s+(.+)/i,
        confidence: 0.85,
        semanticType: "quantitative_explicit",
      },
      {
        pattern:
          /(data|laporan|rekap)\s+(.+?)\s+(vs|dibanding|dengan)\s+(data|laporan|rekap)\s+(.+)/i,
        confidence: 0.83,
        semanticType: "data_comparison",
      },

      // Existing administrative comparisons (enhanced)
      {
        pattern:
          /(pengajuan|verifikasi|approval|dokumentasi)\s+(.+?)\s+(vs|dibanding|dengan)\s+(pengajuan|verifikasi|approval|dokumentasi)\s+(.+)/i,
        confidence: 0.8,
        semanticType: "administrative_process",
      },
      {
        pattern:
          /(operator|admin|user)\s+(.+?)\s+(vs|dibanding|dengan)\s+(operator|admin|user)\s+(.+)/i,
        confidence: 0.78,
        semanticType: "role_comparison",
      },

      // Existing implicit comparisons (enhanced)
      {
        pattern: /(.+?)\s+(vs|versus|dibanding|terhadap|lawan)\s+(.+)/i,
        confidence: 0.75,
        semanticType: "implicit_general",
      },
      {
        pattern: /perbandingan\s+(.+?)\s+(dan|dengan)\s+(.+)/i,
        confidence: 0.73,
        semanticType: "explicit_general",
      },
      {
        pattern: /(.+?)\s+dibanding\s+(.+)/i,
        confidence: 0.7,
        semanticType: "simple_comparison",
      },

      // Existing contextual comparisons (enhanced)
      {
        pattern: /bagaimana\s+(.+?)\s+(dibanding|terhadap|vs)\s+(.+)/i,
        confidence: 0.7,
        semanticType: "contextual_formal",
      },
      {
        pattern: /gimana\s+(.+?)\s+(dibanding|terhadap|vs)\s+(.+)/i,
        confidence: 0.68,
        semanticType: "contextual_informal",
      },

      // Existing regional patterns (enhanced)
      {
        pattern: /piye\s+(.+?)\s+(vs|dibanding)\s+(.+)/i,
        confidence: 0.65,
        semanticType: "javanese_comparison",
      },
      {
        pattern: /kumaha\s+(.+?)\s+(vs|dibanding)\s+(.+)/i,
        confidence: 0.65,
        semanticType: "sundanese_comparison",
      },
    ];

    // Enhanced processing dengan semantic analysis
    for (const { pattern, confidence, semanticType } of comparisonPatterns) {
      const match = query.match(pattern);
      if (match) {
        const subjects = this.extractComparisonSubjectsEnhanced(
          match,
          semanticType,
        );
        if (subjects.length >= 2) {
          const semanticConfidence = this.calculateSemanticConfidence(
            match,
            confidence,
            semanticType,
          );

          if (semanticConfidence >= 0.6) {
            // Minimum confidence threshold
            comparisons.push({
              type: this.determineComparisonTypeEnhanced(
                match[0],
                semanticType,
              ),
              subjects: subjects,
              operator: this.extractComparisonOperatorEnhanced(
                match[0],
                semanticType,
              ),
              confidence: semanticConfidence,
              semanticType: semanticType,
              originalText: match[0],
            });
          }
        }
      }
    }

    // Sort by confidence dan remove duplicates
    return this.rankAndDeduplicateComparisons(comparisons);
  }

  /**
   * Enhanced semantic confidence calculation dengan context awareness
   */
  private calculateSemanticConfidence(
    match: RegExpMatchArray,
    baseConfidence: number,
    semanticType: string,
  ): number {
    let confidence = baseConfidence;

    // Semantic boosting berdasarkan type
    switch (semanticType) {
      case "quantitative_natural":
        // Boost jika ada numeric indicators
        if (match[0].match(/\d+|jumlah|total|banyak/i)) confidence += 0.12;
        break;
      case "trend_comparison":
        // Boost jika ada trend indicators
        if (match[0].match(/naik|turun|meningkat|menurun|stabil/i))
          confidence += 0.1;
        break;
      case "implicit_temporal":
        // Boost jika ada clear temporal context
        if (match[0].match(/(hari|minggu|bulan|tahun)\s+(ini|lalu|kemarin)/i))
          confidence += 0.08;
        break;
      case "performance_comparison":
        // Boost jika ada performance indicators
        if (match[0].match(/kinerja|performa|produktivitas|efisiensi/i))
          confidence += 0.09;
        break;
      case "similarity_comparison":
        // Boost jika ada clear similarity indicators
        if (match[0].match(/sama|seperti|mirip/i)) confidence += 0.07;
        break;
    }

    // Context boosting dari conversation history (placeholder for future implementation)
    confidence += this.getContextualBoost(match[0]);

    // Penalize jika terlalu ambigu
    if (match[0].length < 20 && !match[0].match(/\d+/)) confidence -= 0.08;

    // Boost jika ada administrative terms
    if (match[0].match(/(pengajuan|verifikasi|dokumentasi|operator|admin)/i)) {
      confidence += 0.05;
    }

    return Math.max(0.0, Math.min(1.0, confidence));
  }

  /**
   * Get contextual boost dari conversation history (placeholder)
   */
  private getContextualBoost(matchText: string): number {
    // TODO: Implement conversation context analysis
    // For now, return small boost for administrative terms
    if (matchText.match(/(aktivitas|pengajuan|dokumentasi|verifikasi)/i)) {
      return 0.03;
    }
    return 0;
  }

  /**
   * Enhanced extraction of comparison subjects dengan semantic type awareness
   */
  private extractComparisonSubjectsEnhanced(
    match: RegExpMatchArray,
    semanticType: string,
  ): string[] {
    const subjects: string[] = [];

    // Extract subjects berdasarkan semantic type
    switch (semanticType) {
      case "similarity_comparison":
        // Pattern: (.+?)\s+(sama|seperti|mirip)\s+(dengan\s+)?(.+)
        if (match[1]) subjects.push(match[1].trim());
        if (match[4]) subjects.push(match[4].trim());
        break;

      case "quantitative_natural":
        // Pattern: (.+?)\s+(lebih|kurang)\s+(banyak|sedikit|tinggi|rendah)\s+(dari|daripada)\s+(.+)
        if (match[1]) subjects.push(match[1].trim());
        if (match[5]) subjects.push(match[5].trim());
        break;

      case "implicit_temporal":
        // Pattern: (.+?)\s+(sekarang|saat ini)\s+(.+?)\s+(dulu|sebelumnya|kemarin)
        if (match[1]) subjects.push(match[1].trim());
        if (match[3]) subjects.push(match[3].trim());
        break;

      case "explicit_temporal":
        // Pattern: (.+?)\s+(hari ini|kemarin|minggu ini|bulan ini)\s+(vs|dengan|dibanding)?\s*(.+?)\s+(hari lalu|minggu lalu|bulan lalu)
        if (match[1]) subjects.push(match[1].trim());
        if (match[4]) subjects.push(match[4].trim());
        break;

      case "superlative_comparison":
        // Pattern: mana\s+(yang\s+)?(lebih|paling)\s+(banyak|sedikit|tinggi|rendah)\s+(.+)
        if (match[4]) subjects.push(match[4].trim());
        // Add implicit "others" as second subject
        subjects.push("yang lain");
        break;

      default:
        // Default extraction untuk existing patterns
        if (match[1]) subjects.push(match[1].trim());
        if (match[3]) subjects.push(match[3].trim());
        if (match[5]) subjects.push(match[5].trim());
        break;
    }

    // Filter out empty subjects dan comparison operators
    const filteredSubjects = subjects.filter(
      (subject) =>
        subject &&
        subject.length > 0 &&
        ![
          "dengan",
          "vs",
          "versus",
          "dibanding",
          "terhadap",
          "lawan",
          "sama",
          "seperti",
          "mirip",
        ].includes(subject.toLowerCase()),
    );

    return filteredSubjects;
  }

  /**
   * Enhanced comparison type determination dengan semantic awareness
   */
  private determineComparisonTypeEnhanced(
    text: string,
    semanticType: string,
  ): ComparisonExpression["type"] {
    // Determine type berdasarkan semantic type
    switch (semanticType) {
      case "similarity_comparison":
        return "similarity";
      case "trend_comparison":
        return "trend";
      case "performance_comparison":
      case "efficiency_comparison":
        return "performance";
      case "implicit_temporal":
      case "explicit_temporal":
      case "temporal_explicit":
      case "temporal_activity":
        return "temporal";
      case "quantitative_natural":
      case "quantitative_explicit":
        return "quantitative";
      default:
        // Fallback to legacy logic
        return this.determineComparisonType(text);
    }
  }

  /**
   * Enhanced comparison operator extraction dengan semantic awareness
   */
  private extractComparisonOperatorEnhanced(
    text: string,
    semanticType: string,
  ): ComparisonExpression["operator"] {
    // Extract operator berdasarkan semantic type
    switch (semanticType) {
      case "similarity_comparison":
        if (text.includes("sama")) return "sama";
        if (text.includes("seperti")) return "seperti";
        if (text.includes("mirip")) return "mirip";
        break;
      case "trend_comparison":
        return "dibanding"; // Default untuk trend comparisons
      case "implicit_temporal":
      case "explicit_temporal":
        return "vs"; // Default untuk temporal comparisons
      default:
        // Fallback to legacy logic
        return this.extractComparisonOperator(text);
    }

    // Fallback
    return this.extractComparisonOperator(text);
  }

  /**
   * Rank dan deduplicate comparisons berdasarkan confidence dan relevance
   */
  private rankAndDeduplicateComparisons(
    comparisons: ComparisonExpression[],
  ): ComparisonExpression[] {
    // Remove duplicates berdasarkan subjects dan operator similarity
    const unique: ComparisonExpression[] = [];

    for (const comparison of comparisons) {
      const isDuplicate = unique.some((existing) =>
        this.areComparisonsSimilar(existing, comparison),
      );

      if (!isDuplicate) {
        unique.push(comparison);
      } else {
        // Keep the one dengan confidence lebih tinggi
        const existingIndex = unique.findIndex((existing) =>
          this.areComparisonsSimilar(existing, comparison),
        );
        if (
          existingIndex >= 0 &&
          (comparison.confidence || 0) > (unique[existingIndex].confidence || 0)
        ) {
          unique[existingIndex] = comparison;
        }
      }
    }

    // Sort by confidence (highest first)
    return unique.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  }

  /**
   * Check if two comparisons are similar (untuk deduplication)
   */
  private areComparisonsSimilar(
    comp1: ComparisonExpression,
    comp2: ComparisonExpression,
  ): boolean {
    // Check subject similarity
    const subjects1 = comp1.subjects.map((s) => s.toLowerCase().trim());
    const subjects2 = comp2.subjects.map((s) => s.toLowerCase().trim());

    const subjectOverlap = subjects1.some((s1) =>
      subjects2.some(
        (s2) => s1 === s2 || this.calculateStringSimilarity(s1, s2) > 0.8,
      ),
    );

    // Check operator similarity
    const operatorSimilar =
      comp1.operator === comp2.operator ||
      this.areOperatorsSimilar(comp1.operator, comp2.operator);

    return subjectOverlap && operatorSimilar;
  }

  /**
   * Check if two operators are semantically similar
   */
  private areOperatorsSimilar(
    op1: ComparisonExpression["operator"],
    op2: ComparisonExpression["operator"],
  ): boolean {
    const similarOperators = [
      ["vs", "dibanding", "terhadap"],
      ["dengan", "terhadap"],
      ["sama", "seperti", "mirip"],
    ];

    return similarOperators.some(
      (group) => group.includes(op1) && group.includes(op2),
    );
  }

  /**
   * Calculate string similarity untuk deduplication
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Legacy method untuk backward compatibility
   */
  private extractComparisonSubjects(match: RegExpMatchArray): string[] {
    return this.extractComparisonSubjectsEnhanced(match, "default");
  }

  /**
   * Enhanced extractConditions dengan support untuk nested logic dan boolean operators
   */
  private extractConditions(query: string): ConditionalExpression[] {
    const conditions: ConditionalExpression[] = [];

    // Enhanced conditional patterns dengan nested logic support
    const conditionalPatterns = [
      // Standard conditional patterns
      {
        pattern:
          /(jika|kalau|bila|apabila|kalo|klo)\s+(.+?)\s+(maka|maka\s+tampilkan|tampilkan)/i,
        type: "standard",
      },
      {
        pattern: /(jika|kalau|bila|apabila|kalo|klo)\s+ada\s+(.+)/i,
        type: "existence",
      },
      {
        pattern:
          /tampilkan\s+(.+?)\s+(jika|kalau|bila|apabila|kalo|klo)\s+(.+)/i,
        type: "reverse",
      },

      // Conditional with specific values
      {
        pattern:
          /(jika|kalau|bila|apabila|kalo|klo)\s+(.+?)\s+(adalah|=|sama dengan)\s+(.+)/i,
        type: "equality",
      },
      {
        pattern:
          /(jika|kalau|bila|apabila|kalo|klo)\s+(.+?)\s+(status|statusnya)\s+(adalah|=|sama dengan)?\s*(.+)/i,
        type: "status",
      },

      // Administrative conditional patterns
      {
        pattern:
          /(jika|kalau|bila|apabila|kalo|klo)\s+(.+?)\s+(dibuat|disetujui|ditolak|diproses)\s+(oleh|by)\s+(.+)/i,
        type: "administrative",
      },
      {
        pattern:
          /(jika|kalau|bila|apabila|kalo|klo)\s+(.+?)\s+(lebih dari|kurang dari|sama dengan)\s+(\d+)\s+(hari|minggu|bulan|tahun)/i,
        type: "temporal_comparison",
      },

      // Boolean conditionals dengan nested logic
      {
        pattern:
          /(jika|kalau|bila|apabila|kalo|klo)\s+(.+?)\s+(dan|atau)\s+(.+?)\s+(maka|tampilkan)/i,
        type: "boolean_compound",
      },
      {
        pattern:
          /(jika|kalau|bila|apabila|kalo|klo)\s+(.+?)\s+(dan|atau)\s+(.+?)\s+(dan|atau)\s+(.+)/i,
        type: "boolean_complex",
      },
      {
        pattern: /(jika|kalau|bila|apabila|kalo|klo)\s+(tidak|bukan)\s+(.+)/i,
        type: "negation",
      },

      // Contextual conditionals
      {
        pattern: /cari\s+(.+?)\s+(jika|kalau|bila|apabila|kalo|klo)\s+(.+)/i,
        type: "search_conditional",
      },
      {
        pattern: /lihat\s+(.+?)\s+(jika|kalau|bila|apabila|kalo|klo)\s+(.+)/i,
        type: "view_conditional",
      },
      {
        pattern: /filter\s+(.+?)\s+(jika|kalau|bila|apabila|kalo|klo)\s+(.+)/i,
        type: "filter_conditional",
      },

      // Time-based conditionals
      {
        pattern:
          /(jika|kalau|bila|apabila|kalo|klo)\s+(.+?)\s+(di|pada|dalam)\s+(bulan|tahun|minggu|hari)\s+(.+)/i,
        type: "temporal",
      },
      {
        pattern:
          /(jika|kalau|bila|apabila|kalo|klo)\s+(.+?)\s+(sebelum|sesudah|setelah)\s+(.+)/i,
        type: "temporal_relative",
      },

      // Regional Indonesian conditional patterns
      {
        pattern: /(yen|menawa)\s+(.+?)\s+(terus|banjur)\s+(.+)/i,
        type: "javanese",
      }, // Javanese
      {
        pattern: /(upami|lamun)\s+(.+?)\s+(teras|mangga)\s+(.+)/i,
        type: "sundanese",
      }, // Sundanese

      // NEW: Enhanced boolean patterns dengan precedence handling
      {
        pattern: /(jika|kalau|bila)\s+(.+?)\s+(dan|atau)\s+\((.+?)\)/i,
        type: "precedence_grouped",
        precedence: 1,
      },
      {
        pattern: /\((.+?)\)\s+(dan|atau)\s+\((.+?)\)/i,
        type: "double_grouped",
        precedence: 2,
      },
      {
        pattern: /(jika|kalau)\s+(.+?)\s+(dan)\s+(.+?)\s+(atau)\s+(.+)/i,
        type: "mixed_precedence",
        precedence: 3,
      },
      {
        pattern: /(jika|kalau)\s+(.+?)\s+(atau)\s+(.+?)\s+(dan)\s+(.+)/i,
        type: "mixed_precedence_alt",
        precedence: 3,
      },

      // NEW: Range conditions
      {
        pattern:
          /(jika|kalau)\s+(.+?)\s+(antara|dari)\s+(.+?)\s+(sampai|hingga|ke)\s+(.+)/i,
        type: "range_condition",
        precedence: 1,
      },
      {
        pattern: /(jika|kalau)\s+(.+?)\s+(dalam rentang|dalam kisaran)\s+(.+)/i,
        type: "range_simple",
        precedence: 1,
      },

      // NEW: Enhanced negation conditions
      {
        pattern:
          /(jika|kalau)\s+(bukan|tidak ada|tidak pernah|belum pernah)\s+(.+)/i,
        type: "negation_strong",
        precedence: 1,
      },
      {
        pattern: /(jika|kalau)\s+(tidak|belum)\s+(.+?)\s+(dan|atau)\s+(.+)/i,
        type: "negation_compound",
        precedence: 2,
      },
    ];

    // Enhanced processing dengan precedence handling
    for (const { pattern, type, precedence } of conditionalPatterns) {
      const match = query.match(pattern);
      if (match) {
        const conditionData = this.parseConditionalMatch(match, type);
        if (conditionData) {
          // Add precedence information
          if (precedence !== undefined) {
            conditionData.precedence = precedence;
          }
          conditions.push(conditionData);
        }
      }
    }

    // Parse complex boolean expressions dengan operator precedence
    const complexConditions = this.parseComplexBooleanExpressions(query);
    conditions.push(...complexConditions);

    // Handle nested conditions dan boolean operators
    const nestedConditions = this.extractNestedConditions(query);
    conditions.push(...nestedConditions);

    // Optimize conditional expressions untuk database query
    return this.optimizeConditionalExpressions(conditions);
  }

  /**
   * Parse conditional match dengan type-specific handling untuk extract condition data
   */
  private parseConditionalMatch(
    match: RegExpMatchArray,
    type?: string,
  ): ConditionalExpression | null {
    if (!match[1] || !match[2]) return null;

    const operator =
      match[1].toLowerCase() as ConditionalExpression["operator"];
    let condition = match[2]?.trim();
    let subject = match[3]?.trim() || match[1]?.trim();
    let value = this.extractConditionalValue(match[0]);

    // Type-specific parsing enhancements
    switch (type) {
      case "boolean_compound":
      case "boolean_complex":
        // Handle compound conditions dengan boolean operators
        condition = this.parseCompoundCondition(match);
        break;
      case "temporal_comparison":
        // Handle temporal comparisons
        value = this.extractTemporalValue(match);
        break;
      case "administrative":
        // Handle administrative-specific conditions
        subject = this.normalizeAdministrativeSubject(subject);
        break;
      case "negation":
        // Handle negation conditions
        condition = `NOT ${condition}`;
        break;
    }

    return {
      condition,
      subject,
      operator,
      value,
      originalText: match[0],
    };
  }

  /**
   * Extract nested conditions untuk complex boolean logic
   */
  private extractNestedConditions(query: string): ConditionalExpression[] {
    const nestedConditions: ConditionalExpression[] = [];

    // Pattern untuk nested conditions dengan parentheses
    const nestedPattern = /\((.+?)\)/g;
    const matches = query.matchAll(nestedPattern);

    for (const match of matches) {
      const nestedQuery = match[1];
      const subConditions = this.extractConditions(nestedQuery);
      nestedConditions.push(...subConditions);
    }

    return nestedConditions;
  }

  /**
   * Parse compound condition dengan boolean operators
   */
  private parseCompoundCondition(match: RegExpMatchArray): string {
    const fullMatch = match[0];
    let parsedCondition = fullMatch;

    // Normalize boolean operators untuk SQL-like syntax
    parsedCondition = parsedCondition.replace(/\s+(dan)\s+/gi, " AND ");
    parsedCondition = parsedCondition.replace(/\s+(atau)\s+/gi, " OR ");
    parsedCondition = parsedCondition.replace(/\s+(tidak)\s+/gi, " NOT ");

    return parsedCondition.trim();
  }

  /**
   * Extract temporal value dari temporal comparison conditions
   */
  private extractTemporalValue(match: RegExpMatchArray): string | undefined {
    // Look for numeric values dengan time units
    const temporalPattern = /(\d+)\s+(hari|minggu|bulan|tahun)/i;
    const temporalMatch = match[0].match(temporalPattern);

    if (temporalMatch) {
      return `${temporalMatch[1]} ${temporalMatch[2]}`;
    }

    return undefined;
  }

  /**
   * Normalize administrative subject untuk consistency
   */
  private normalizeAdministrativeSubject(subject: string): string {
    const administrativeMapping: Record<string, string> = {
      pengajuan: "pengajuan_bulanan",
      dokumentasi: "dokumentasi",
      verifikasi: "aktivitas_siak",
      operator: "profiles",
      admin: "profiles",
      user: "profiles",
    };

    const normalized = subject.toLowerCase();
    return administrativeMapping[normalized] || subject;
  }

  /**
   * Parse complex boolean expressions dengan operator precedence
   */
  private parseComplexBooleanExpressions(
    query: string,
  ): ConditionalExpression[] {
    const expressions: ConditionalExpression[] = [];

    // Tokenize boolean expression
    const tokens = this.tokenizeBooleanExpression(query);

    if (tokens.length === 0) return expressions;

    // Build expression tree dengan operator precedence
    const expressionTree = this.buildExpressionTree(tokens);

    // Convert tree to ConditionalExpression objects
    const conditions = this.treeToConditionalExpressions(expressionTree);

    return conditions;
  }

  /**
   * Boolean expression tokenizer dengan operator precedence
   */
  private tokenizeBooleanExpression(query: string): BooleanToken[] {
    const tokens: BooleanToken[] = [];

    // Define operator precedence
    const operatorPrecedence: Record<string, number> = {
      tidak: 3,
      NOT: 3,
      bukan: 3,
      dan: 2,
      AND: 2,
      atau: 1,
      OR: 1,
    };

    // Tokenize dengan proper precedence handling
    const tokenRegex = /(\(|\)|dan|atau|tidak|bukan|AND|OR|NOT|[^()]+)/gi;
    const matches = query.matchAll(tokenRegex);

    for (const match of matches) {
      const token = match[1].trim();
      if (token && token.length > 0) {
        tokens.push({
          value: token,
          type: this.getTokenType(token),
          precedence: operatorPrecedence[token.toLowerCase()] || 0,
        });
      }
    }

    return tokens;
  }

  /**
   * Get token type untuk boolean expression parsing
   */
  private getTokenType(token: string): BooleanToken["type"] {
    if (["(", ")"].includes(token)) return "parenthesis";
    if (
      ["dan", "atau", "tidak", "bukan", "AND", "OR", "NOT"].includes(
        token.toLowerCase(),
      )
    )
      return "operator";
    return "operand";
  }

  /**
   * Build expression tree dari tokens dengan operator precedence
   */
  private buildExpressionTree(tokens: BooleanToken[]): BooleanExpression {
    // Simplified implementation - untuk full implementation butuh shunting yard algorithm
    // For now, return basic structure
    return {
      value: tokens.map((t) => t.value).join(" "),
    };
  }

  /**
   * Convert expression tree to ConditionalExpression objects
   */
  private treeToConditionalExpressions(
    tree: BooleanExpression,
  ): ConditionalExpression[] {
    // Simplified implementation
    if (tree.value) {
      return [
        {
          condition: tree.value,
          subject: "complex_boolean",
          operator: "jika",
          booleanOperator: tree.operator,
          originalText: tree.value,
        },
      ];
    }
    return [];
  }

  /**
   * Optimize conditional expressions untuk database query efficiency
   */
  private optimizeConditionalExpressions(
    conditions: ConditionalExpression[],
  ): ConditionalExpression[] {
    // Remove duplicates
    const unique = conditions.filter(
      (condition, index, self) =>
        index ===
        self.findIndex(
          (c) =>
            c.condition === condition.condition &&
            c.subject === condition.subject &&
            c.operator === condition.operator,
        ),
    );

    // Sort by precedence (higher precedence first)
    return unique.sort((a, b) => (b.precedence || 0) - (a.precedence || 0));
  }

  /**
   * Enhanced extractAggregations dengan advanced statistical processing dan grouping
   */
  private extractAggregations(query: string): AggregationExpression[] {
    const aggregations: AggregationExpression[] = [];

    // Enhanced aggregation patterns dengan confidence scoring
    const aggregationPatterns = [
      // Basic aggregation patterns (confidence: 0.90)
      {
        pattern: /(total|jumlah|sum)\s+(.+?)(?:\s+per\s+(.+?))?/i,
        confidence: 0.9,
        type: "sum",
      },
      {
        pattern: /(rata-rata|average|mean|rerata)\s+(.+?)(?:\s+per\s+(.+?))?/i,
        confidence: 0.88,
        type: "avg",
      },
      {
        pattern:
          /(maksimal|max|tertinggi|terbesar|terbanyak)\s+(.+?)(?:\s+per\s+(.+?))?/i,
        confidence: 0.85,
        type: "max",
      },
      {
        pattern:
          /(minimal|min|terendah|terkecil|tersedikit)\s+(.+?)(?:\s+per\s+(.+?))?/i,
        confidence: 0.85,
        type: "min",
      },
      {
        pattern:
          /(hitung|count|cacah|itung)\s+(.+?)(?:\s+berdasarkan\s+(.+?))?/i,
        confidence: 0.88,
        type: "count",
      },

      // Advanced statistical patterns (confidence: 0.85)
      {
        pattern:
          /statistik\s+(lengkap|detail|komprehensif)?\s*(.+?)(?:\s+per\s+(.+?))?/i,
        confidence: 0.85,
        type: "statistics",
      },
      {
        pattern: /analisis\s+(.+?)(?:\s+berdasarkan\s+(.+?))?/i,
        confidence: 0.83,
        type: "analysis",
      },
      {
        pattern: /ringkasan\s+(.+?)(?:\s+per\s+(.+?))?/i,
        confidence: 0.8,
        type: "summary",
      },
      {
        pattern: /laporan\s+(.+?)(?:\s+per\s+(.+?))?/i,
        confidence: 0.78,
        type: "report",
      },

      // NEW: Advanced statistical functions
      {
        pattern: /(median|nilai tengah|percentile 50)\s+(.+)/i,
        confidence: 0.87,
        type: "median",
      },
      {
        pattern: /(modus|mode|yang paling sering|paling banyak muncul)\s+(.+)/i,
        confidence: 0.85,
        type: "mode",
      },
      {
        pattern: /(standar deviasi|standard deviation|simpangan baku)\s+(.+)/i,
        confidence: 0.83,
        type: "stddev",
      },
      {
        pattern: /(varians|variance|keragaman)\s+(.+)/i,
        confidence: 0.81,
        type: "variance",
      },

      // NEW: Percentile functions
      {
        pattern: /(persentil|percentile)\s+(\d+)\s+(.+)/i,
        confidence: 0.86,
        type: "percentile",
      },
      {
        pattern: /(kuartil|quartile)\s+(pertama|kedua|ketiga|1|2|3)\s+(.+)/i,
        confidence: 0.84,
        type: "quartile",
      },

      // NEW: Growth and change analysis
      {
        pattern:
          /(pertumbuhan|growth rate|tingkat pertumbuhan)\s+(.+?)\s+(dari|sejak)\s+(.+)/i,
        confidence: 0.88,
        type: "growth_rate",
      },
      {
        pattern:
          /(penurunan|decline rate|tingkat penurunan)\s+(.+?)\s+(dari|sejak)\s+(.+)/i,
        confidence: 0.86,
        type: "decline_rate",
      },
      {
        pattern: /(perubahan|change|delta)\s+(.+?)\s+(dari|sejak)\s+(.+)/i,
        confidence: 0.84,
        type: "change_rate",
      },

      // NEW: Volatility and stability analysis
      {
        pattern: /(volatilitas|volatility|fluktuasi)\s+(.+)/i,
        confidence: 0.82,
        type: "volatility",
      },
      {
        pattern: /(stabilitas|stability|konsistensi)\s+(.+)/i,
        confidence: 0.8,
        type: "stability",
      },

      // NEW: Correlation and relationship analysis
      {
        pattern:
          /(korelasi|correlation|hubungan)\s+(.+?)\s+(dengan|terhadap|vs)\s+(.+)/i,
        confidence: 0.85,
        type: "correlation",
      },
      {
        pattern:
          /(pengaruh|impact|dampak)\s+(.+?)\s+(terhadap|pada|ke)\s+(.+)/i,
        confidence: 0.83,
        type: "impact_analysis",
      },

      // NEW: Distribution analysis
      {
        pattern: /(distribusi|distribution|sebaran)\s+(.+)/i,
        confidence: 0.81,
        type: "distribution",
      },
      {
        pattern:
          /(histogram|frequency distribution|distribusi frekuensi)\s+(.+)/i,
        confidence: 0.79,
        type: "histogram",
      },

      // Time-based aggregations (confidence: 0.88)
      {
        pattern:
          /(total|jumlah)\s+(.+?)\s+(dalam|di|pada)\s+(bulan|tahun|minggu|hari)\s+(.+)/i,
        confidence: 0.88,
        type: "temporal_sum",
      },
      {
        pattern:
          /(rata-rata|average)\s+(.+?)\s+(dalam|di|pada)\s+(bulan|tahun|minggu|hari)\s+(.+)/i,
        confidence: 0.86,
        type: "temporal_avg",
      },
      {
        pattern: /trend\s+(.+?)\s+(dalam|selama)\s+(.+)/i,
        confidence: 0.84,
        type: "trend",
      },

      // NEW: Time series analysis
      {
        pattern: /(seasonal pattern|pola musiman|seasonality)\s+(.+)/i,
        confidence: 0.85,
        type: "seasonal",
      },
      {
        pattern: /(forecast|prediksi|proyeksi)\s+(.+)/i,
        confidence: 0.83,
        type: "forecast",
      },
      {
        pattern: /(moving average|rata-rata bergerak)\s+(.+)/i,
        confidence: 0.81,
        type: "moving_avg",
      },

      // Administrative aggregations (confidence: 0.82)
      {
        pattern:
          /(pengajuan|dokumentasi|verifikasi)\s+(total|jumlah|banyak)\s*(.+?)(?:\s+per\s+(.+?))?/i,
        confidence: 0.82,
        type: "administrative",
      },
      {
        pattern: /rekap\s+(harian|mingguan|bulanan|tahunan)\s+(.+)/i,
        confidence: 0.8,
        type: "periodic_recap",
      },
      {
        pattern: /dashboard\s+(.+?)(?:\s+per\s+(.+?))?/i,
        confidence: 0.78,
        type: "dashboard",
      },

      // Grouping patterns (confidence: 0.75)
      {
        pattern: /(.+?)\s+per\s+(operator|petugas|admin|user|divisi|bagian)/i,
        confidence: 0.75,
        type: "group_by_role",
      },
      {
        pattern: /(.+?)\s+berdasarkan\s+(status|tanggal|waktu|periode)/i,
        confidence: 0.73,
        type: "group_by_attribute",
      },
      {
        pattern: /(.+?)\s+menurut\s+(.+)/i,
        confidence: 0.7,
        type: "group_by_criteria",
      },
      {
        pattern: /(.+?)\s+untuk\s+setiap\s+(.+)/i,
        confidence: 0.68,
        type: "group_by_each",
      },

      // Complex aggregations (confidence: 0.80)
      {
        pattern: /(total|jumlah)\s+(semua|seluruh)\s+(.+?)(?:\s+per\s+(.+?))?/i,
        confidence: 0.8,
        type: "total_all",
      },
      {
        pattern:
          /(berapa|ada berapa)\s+(total|jumlah)?\s*(.+?)(?:\s+per\s+(.+?))?/i,
        confidence: 0.78,
        type: "count_query",
      },
      {
        pattern: /persentase\s+(.+?)(?:\s+dari\s+(.+?))?/i,
        confidence: 0.76,
        type: "percentage",
      },

      // Regional Indonesian patterns (confidence: 0.65)
      {
        pattern: /piro\s+(gunggunge|akehe)\s+(.+)/i,
        confidence: 0.65,
        type: "javanese_count",
      }, // Javanese
      {
        pattern: /sabaraha\s+(jumlahna|totalnya)\s+(.+)/i,
        confidence: 0.65,
        type: "sundanese_count",
      }, // Sundanese
    ];

    // Enhanced processing dengan statistical validation
    for (const { pattern, confidence, type } of aggregationPatterns) {
      const match = query.match(pattern);
      if (match) {
        const aggregationData = this.parseAggregationMatch(match, type);
        if (
          aggregationData &&
          this.validateStatisticalFunction(aggregationData)
        ) {
          // Add confidence score dengan statistical context
          aggregationData.confidence = this.calculateStatisticalConfidence(
            match,
            confidence,
            type,
          );
          aggregations.push(aggregationData);
        }
      }
    }

    // Optimize statistical queries dan remove duplicates
    return this.optimizeStatisticalQueries(aggregations);
  }

  /**
   * Parse aggregation match dengan type-specific handling untuk extract aggregation data
   */
  private parseAggregationMatch(
    match: RegExpMatchArray,
    type?: string,
  ): AggregationExpression | null {
    if (!match[1] || !match[2]) return null;

    const functionText = match[1];
    let subject = match[2]?.trim();
    let groupBy = match[3]?.trim() || match[4]?.trim();
    let aggregationFunction = this.mapAggregationFunction(functionText);

    // Type-specific parsing enhancements
    switch (type) {
      case "temporal_sum":
      case "temporal_avg":
        // Handle time-based aggregations
        groupBy = this.extractTemporalGroupBy(match) || groupBy;
        break;
      case "administrative":
        // Handle administrative-specific aggregations
        subject = this.normalizeAdministrativeSubject(subject);
        break;
      case "group_by_role":
        // Handle role-based grouping
        groupBy = this.normalizeRoleGroupBy(groupBy || match[2]);
        break;
      case "statistics":
      case "analysis":
      case "summary":
      case "report":
        // Handle advanced statistical functions
        aggregationFunction = type as AggregationExpression["function"];
        break;
    }

    return {
      function: aggregationFunction,
      subject,
      groupBy,
      originalText: match[0],
    };
  }

  /**
   * Remove duplicate aggregations berdasarkan similarity
   */
  private removeDuplicateAggregations(
    aggregations: AggregationExpression[],
  ): AggregationExpression[] {
    const unique: AggregationExpression[] = [];

    for (const aggregation of aggregations) {
      const isDuplicate = unique.some(
        (existing) =>
          existing.function === aggregation.function &&
          existing.subject.toLowerCase() ===
            aggregation.subject.toLowerCase() &&
          existing.groupBy?.toLowerCase() ===
            aggregation.groupBy?.toLowerCase(),
      );

      if (!isDuplicate) {
        unique.push(aggregation);
      }
    }

    return unique;
  }

  /**
   * Extract temporal groupBy dari time-based aggregation patterns
   */
  private extractTemporalGroupBy(match: RegExpMatchArray): string | undefined {
    // Look for time units dalam match
    const timeUnits = ["hari", "minggu", "bulan", "tahun"];
    const matchText = match[0].toLowerCase();

    for (const unit of timeUnits) {
      if (matchText.includes(unit)) {
        return unit;
      }
    }

    return undefined;
  }

  /**
   * Normalize role-based groupBy untuk consistency
   */
  private normalizeRoleGroupBy(groupBy: string): string {
    const roleMapping: Record<string, string> = {
      operator: "operator",
      petugas: "operator",
      admin: "admin",
      administrator: "admin",
      user: "user",
      pengguna: "user",
      masyarakat: "user",
      warga: "user",
    };

    const normalized = groupBy.toLowerCase();
    return roleMapping[normalized] || groupBy;
  }

  /**
   * Validate statistical function applicability untuk data compatibility
   */
  private validateStatisticalFunction(
    aggregation: AggregationExpression,
  ): boolean {
    // Validate berdasarkan data type dan function compatibility
    const numericFunctions = [
      "median",
      "stddev",
      "variance",
      "percentile",
      "correlation",
      "growth_rate",
      "decline_rate",
      "change_rate",
      "volatility",
    ];
    const categoricalFunctions = ["mode", "distribution", "histogram"];
    const temporalFunctions = ["trend", "seasonal", "forecast", "moving_avg"];

    // Check data type compatibility (simplified validation)
    if (numericFunctions.includes(aggregation.function)) {
      return this.isNumericData(aggregation.subject);
    }

    if (temporalFunctions.includes(aggregation.function)) {
      return this.hasTemporalContext(aggregation.subject);
    }

    // Allow categorical functions dan basic aggregations
    return true;
  }

  /**
   * Check if subject represents numeric data
   */
  private isNumericData(subject: string): boolean {
    const numericIndicators = [
      "jumlah",
      "total",
      "banyak",
      "angka",
      "nilai",
      "statistik",
      "data",
      "count",
      "sum",
    ];
    return numericIndicators.some((indicator) =>
      subject.toLowerCase().includes(indicator),
    );
  }

  /**
   * Check if subject has temporal context
   */
  private hasTemporalContext(subject: string): boolean {
    const temporalIndicators = [
      "hari",
      "minggu",
      "bulan",
      "tahun",
      "waktu",
      "tanggal",
      "periode",
      "time",
    ];
    return temporalIndicators.some((indicator) =>
      subject.toLowerCase().includes(indicator),
    );
  }

  /**
   * Calculate statistical confidence dengan context awareness
   */
  private calculateStatisticalConfidence(
    match: RegExpMatchArray,
    baseConfidence: number,
    type: string,
  ): number {
    let confidence = baseConfidence;

    // Type-specific confidence boosting
    switch (type) {
      case "median":
      case "mode":
      case "stddev":
      case "variance":
        // Boost untuk advanced statistical functions
        if (match[0].match(/statistik|analisis|data/i)) confidence += 0.08;
        break;
      case "percentile":
      case "quartile":
        // Boost untuk percentile functions
        if (match[0].match(/\d+/)) confidence += 0.1; // Ada numeric value
        break;
      case "growth_rate":
      case "decline_rate":
      case "change_rate":
        // Boost untuk growth analysis
        if (match[0].match(/dari|sejak|periode/i)) confidence += 0.09;
        break;
      case "correlation":
      case "impact_analysis":
        // Boost untuk relationship analysis
        if (match[0].match(/dengan|terhadap|vs/i)) confidence += 0.07;
        break;
    }

    // Context boosting
    if (match[0].match(/(aktivitas|pengajuan|dokumentasi|verifikasi)/i)) {
      confidence += 0.05;
    }

    return Math.max(0.0, Math.min(1.0, confidence));
  }

  /**
   * Optimize statistical queries untuk performance dan accuracy
   */
  private optimizeStatisticalQueries(
    aggregations: AggregationExpression[],
  ): AggregationExpression[] {
    // Remove duplicates dengan enhanced similarity check
    const unique = this.removeDuplicateAggregations(aggregations);

    // Sort by confidence dan statistical complexity
    const sorted = unique.sort((a, b) => {
      // Primary sort: confidence
      const confidenceDiff = (b.confidence || 0) - (a.confidence || 0);
      if (Math.abs(confidenceDiff) > 0.05) return confidenceDiff;

      // Secondary sort: statistical complexity (advanced functions first)
      const complexityA = this.getStatisticalComplexity(a.function);
      const complexityB = this.getStatisticalComplexity(b.function);
      return complexityB - complexityA;
    });

    return sorted;
  }

  /**
   * Get statistical complexity score untuk sorting
   */
  private getStatisticalComplexity(
    func: AggregationExpression["function"],
  ): number {
    const complexityMap: Record<string, number> = {
      // Advanced statistical functions (highest complexity)
      correlation: 10,
      impact_analysis: 10,
      volatility: 9,
      stddev: 9,
      variance: 9,
      percentile: 8,
      quartile: 8,
      growth_rate: 8,
      decline_rate: 8,
      median: 7,
      mode: 7,
      distribution: 7,
      histogram: 7,
      trend: 6,
      seasonal: 6,
      forecast: 6,
      // Basic statistical functions (medium complexity)
      statistics: 5,
      analysis: 5,
      summary: 4,
      report: 4,
      // Basic aggregations (lowest complexity)
      avg: 3,
      max: 2,
      min: 2,
      sum: 1,
      count: 1,
    };

    return complexityMap[func] || 0;
  }

  // Helper methods for extraction
  private determineComparisonType(text: string): ComparisonExpression["type"] {
    if (
      text.includes("bulan") ||
      text.includes("tahun") ||
      text.includes("hari")
    ) {
      return "temporal";
    }
    if (
      text.includes("jumlah") ||
      text.includes("total") ||
      text.includes("berapa")
    ) {
      return "quantitative";
    }
    return "categorical";
  }

  private extractComparisonOperator(
    text: string,
  ): ComparisonExpression["operator"] {
    if (text.includes("vs") || text.includes("versus")) return "vs";
    if (text.includes("dengan")) return "dengan";
    if (text.includes("dibanding")) return "dibanding";
    return "terhadap";
  }

  private extractConditionalValue(text: string): string | undefined {
    // Extract specific values from conditional statements
    const valuePatterns = [
      /=\s*(.+)/,
      /adalah\s+(.+)/,
      /berupa\s+(.+)/,
      /status\s+(.+)/,
    ];

    for (const pattern of valuePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  private mapAggregationFunction(
    functionText: string,
  ): AggregationExpression["function"] {
    const lowerText = functionText.toLowerCase();

    if (this.synonyms.aggregation.sum.includes(lowerText)) return "sum";
    if (this.synonyms.aggregation.count.includes(lowerText)) return "count";
    if (this.synonyms.aggregation.average.includes(lowerText)) return "avg";
    if (this.synonyms.aggregation.max.includes(lowerText)) return "max";
    if (this.synonyms.aggregation.min.includes(lowerText)) return "min";

    return "count"; // Default fallback
  }

  private extractImplicitSubject(
    currentQuery: string,
    lastQuery: string,
  ): string | undefined {
    // Extract subject from previous query if current query has pronouns or implicit references
    const pronouns = ["itu", "ini", "tersebut", "yang tadi", "sebelumnya"];
    const hasPronouns = pronouns.some((pronoun) =>
      currentQuery.includes(pronoun),
    );

    if (hasPronouns && lastQuery) {
      // Extract table names from last query
      const lastQueryTables = this.extractTables(lastQuery);
      if (lastQueryTables.length > 0) {
        return lastQueryTables[0]; // Return the first table as implicit subject
      }

      // Extract other subjects from last query
      const subjectPatterns = [
        /(?:data|informasi|statistik)\s+(.+?)(?:\s|$)/i,
        /(?:aktivitas|kegiatan)\s+(.+?)(?:\s|$)/i,
        /(?:pengguna|user|operator)\s+(.+?)(?:\s|$)/i,
      ];

      for (const pattern of subjectPatterns) {
        const match = lastQuery.match(pattern);
        if (match) {
          return match[1].trim();
        }
      }
    }

    return undefined;
  }

  /**
   * Enhanced typo correction dengan phonetic similarity dan keyboard layout errors
   */
  private correctTypos(text: string): string {
    let corrected = text;

    // Step 1: Apply direct typo corrections
    Object.entries(this.typoCorrections).forEach(([typo, correct]) => {
      const regex = new RegExp(`\\b${typo}\\b`, "gi");
      corrected = corrected.replace(regex, correct);
    });

    // Step 2: Apply phonetic corrections
    corrected = this.applyPhoneticCorrections(corrected);

    // Step 3: Apply keyboard layout error corrections
    corrected = this.applyKeyboardLayoutCorrections(corrected);

    // Step 4: Apply enhanced fuzzy matching
    const words = corrected.split(" ");
    const correctedWords = words.map((word) =>
      this.enhancedFuzzyCorrectWord(word),
    );

    return correctedWords.join(" ");
  }

  /**
   * Apply phonetic similarity corrections untuk Indonesian
   */
  private applyPhoneticCorrections(text: string): string {
    const phoneticPatterns: Record<string, string[]> = {
      // Consonant phonetic similarities
      f: ["p", "v"],
      v: ["f", "b"],
      b: ["p", "v"],
      c: ["s", "k"],
      s: ["c", "z"],
      z: ["s"],
      d: ["t"],
      t: ["d"],
      g: ["k"],
      k: ["g", "c"],
      j: ["y"],
      y: ["j"],

      // Vowel phonetic similarities
      i: ["e"],
      e: ["i", "a"],
      a: ["e"],
      u: ["o"],
      o: ["u"],

      // Indonesian-specific patterns
      ny: ["ni"],
      ng: ["n"],
    };

    let corrected = text;

    // Apply phonetic corrections untuk common administrative terms
    const phoneticCorrections: Record<string, string> = {
      // Common phonetic errors in Indonesian administrative terms
      aktifitas: "aktivitas",
      aktipitas: "aktivitas",
      dokumentasi: "dokumentasi",
      dokumantasi: "dokumentasi",
      pengajuan: "pengajuan",
      pengajuwan: "pengajuan",
      ferifikasi: "verifikasi",
      peripikasi: "verifikasi",
      administrasi: "administrasi",
      administrazi: "administrasi",
      informasi: "informasi",
      imformasi: "informasi",
      statistik: "statistik",
      statistis: "statistik",
      operator: "operator",
      operatur: "operator",
    };

    Object.entries(phoneticCorrections).forEach(([error, correct]) => {
      const regex = new RegExp(`\\b${error}\\b`, "gi");
      corrected = corrected.replace(regex, correct);
    });

    return corrected;
  }

  /**
   * Apply keyboard layout error corrections (QWERTY Indonesian)
   */
  private applyKeyboardLayoutCorrections(text: string): string {
    const keyboardErrors: Record<string, string[]> = {
      q: ["w", "a"],
      w: ["q", "e", "s"],
      e: ["w", "r", "d"],
      r: ["e", "t", "f"],
      t: ["r", "y", "g"],
      y: ["t", "u", "h"],
      u: ["y", "i", "j"],
      i: ["u", "o", "k"],
      o: ["i", "p", "l"],
      p: ["o", "l"],
      a: ["q", "s", "z"],
      s: ["a", "d", "w", "x"],
      d: ["s", "f", "e", "c"],
      f: ["d", "g", "r", "v"],
      g: ["f", "h", "t", "b"],
      h: ["g", "j", "y", "n"],
      j: ["h", "k", "u", "m"],
      k: ["j", "l", "i"],
      l: ["k", "o", "p"],
      z: ["a", "x"],
      x: ["z", "c", "s"],
      c: ["x", "v", "d"],
      v: ["c", "b", "f"],
      b: ["v", "n", "g"],
      n: ["b", "m", "h"],
      m: ["n", "j"],
    };

    const keyboardCorrections: Record<string, string> = {
      // Common keyboard layout errors
      aktivitad: "aktivitas",
      aktivitaz: "aktivitas",
      dokumentadi: "dokumentasi",
      dokumentazi: "dokumentasi",
      pengajuam: "pengajuan",
      pengajuab: "pengajuan",
      operatpr: "operator",
      operatoe: "operator",
      jumlsh: "jumlah",
      jumlaj: "jumlah",
      beraps: "berapa",
      beraoa: "berapa",
      sistej: "sistem",
      sistek: "sistem",
    };

    let corrected = text;
    Object.entries(keyboardCorrections).forEach(([error, correct]) => {
      const regex = new RegExp(`\\b${error}\\b`, "gi");
      corrected = corrected.replace(regex, correct);
    });

    return corrected;
  }

  /**
   * Enhanced fuzzy word correction dengan Indonesian-specific patterns
   */
  private enhancedFuzzyCorrectWord(word: string): string {
    if (word.length < 3) return word; // Skip very short words

    // Enhanced common words list dengan administrative terms
    const enhancedCommonWords = [
      // Basic administrative terms
      "aktivitas",
      "dokumentasi",
      "pengajuan",
      "operator",
      "admin",
      "sistem",
      "jumlah",
      "berapa",
      "total",
      "statistik",
      "data",
      "informasi",
      "bulan",
      "tahun",
      "hari",
      "minggu",
      "waktu",
      "tanggal",

      // Enhanced administrative vocabulary
      "verifikasi",
      "validasi",
      "konfirmasi",
      "persetujuan",
      "approval",
      "registrasi",
      "pencatatan",
      "perekaman",
      "inventarisasi",
      "rekapitulasi",
      "kompilasi",
      "tabulasi",
      "klasifikasi",

      // Government terms
      "kependudukan",
      "administrasi",
      "dukcapil",
      "disdukcapil",
      "kemendagri",
      "kementerian",
      "dinas",
      "bagian",
      "seksi",

      // Process terms
      "proses",
      "prosedur",
      "workflow",
      "disposisi",
      "koordinasi",
      "evaluasi",
      "monitoring",
      "supervisi",
      "klarifikasi",

      // Status terms
      "pending",
      "selesai",
      "ditolak",
      "disetujui",
      "aktif",
      "nonaktif",
      "completed",
      "approved",
      "rejected",
      "processed",
      "verified",

      // Role terms
      "petugas",
      "pegawai",
      "karyawan",
      "staff",
      "pelaksana",
      "supervisor",
      "koordinator",
      "manajer",
      "kepala",
      "direktur",
    ];

    let bestMatch = word;
    let minDistance = Math.floor(word.length * 0.4); // More lenient threshold

    for (const commonWord of enhancedCommonWords) {
      const distance = this.calculateEnhancedLevenshteinDistance(
        word.toLowerCase(),
        commonWord.toLowerCase(),
      );

      // Enhanced matching criteria
      if (distance < minDistance && distance <= 2) {
        // Additional validation untuk Indonesian patterns
        if (this.isValidIndonesianCorrection(word, commonWord)) {
          minDistance = distance;
          bestMatch = commonWord;
        }
      }
    }

    return bestMatch;
  }

  /**
   * Enhanced Levenshtein distance dengan Indonesian-specific weights
   */
  private calculateEnhancedLevenshteinDistance(
    str1: string,
    str2: string,
  ): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;

        // Enhanced cost calculation dengan Indonesian phonetic similarity
        const substitutionCost = this.getSubstitutionCost(
          str1[i - 1],
          str2[j - 1],
        );

        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + substitutionCost, // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get substitution cost berdasarkan phonetic similarity
   */
  private getSubstitutionCost(char1: string, char2: string): number {
    if (char1 === char2) return 0;

    // Indonesian phonetic similarity mapping
    const phoneticGroups = [
      ["f", "p", "v"],
      ["c", "s", "k"],
      ["d", "t"],
      ["g", "k"],
      ["i", "e"],
      ["u", "o"],
      ["a", "e"],
      ["j", "y"],
      ["z", "s"],
    ];

    // Check if characters are in same phonetic group
    for (const group of phoneticGroups) {
      if (
        group.includes(char1.toLowerCase()) &&
        group.includes(char2.toLowerCase())
      ) {
        return 0.5; // Lower cost for phonetically similar characters
      }
    }

    return 1; // Standard substitution cost
  }

  /**
   * Validate if correction is valid untuk Indonesian patterns
   */
  private isValidIndonesianCorrection(
    original: string,
    corrected: string,
  ): boolean {
    // Don't correct if words are too different in length
    if (Math.abs(original.length - corrected.length) > 3) return false;

    // Don't correct very short words to very long words
    if (original.length <= 3 && corrected.length > 6) return false;

    // Check if first character is similar (important for Indonesian)
    const firstCharSimilar =
      original[0].toLowerCase() === corrected[0].toLowerCase() ||
      this.arePhoneticallySimilar(original[0], corrected[0]);

    if (!firstCharSimilar && original.length > 4) return false;

    return true;
  }

  /**
   * Check if two characters are phonetically similar
   */
  private arePhoneticallySimilar(char1: string, char2: string): boolean {
    const phoneticGroups = [
      ["f", "p", "v"],
      ["c", "s", "k"],
      ["d", "t"],
      ["g", "k"],
      ["i", "e"],
      ["u", "o"],
      ["a", "e"],
      ["j", "y"],
      ["z", "s"],
    ];

    for (const group of phoneticGroups) {
      if (
        group.includes(char1.toLowerCase()) &&
        group.includes(char2.toLowerCase())
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Legacy fuzzy word correction using Levenshtein distance
   */
  private fuzzyCorrectWord(word: string): string {
    if (word.length < 3) return word; // Skip very short words

    const commonWords = [
      "aktivitas",
      "dokumentasi",
      "pengajuan",
      "operator",
      "admin",
      "sistem",
      "jumlah",
      "berapa",
      "total",
      "statistik",
      "data",
      "informasi",
      "bulan",
      "tahun",
      "hari",
      "minggu",
      "sekarang",
      "lalu",
      "ini",
    ];

    let bestMatch = word;
    let minDistance = Math.floor(word.length / 3); // Allow up to 1/3 character differences

    for (const commonWord of commonWords) {
      const distance = this.levenshteinDistance(word.toLowerCase(), commonWord);
      if (distance < minDistance && distance > 0) {
        minDistance = distance;
        bestMatch = commonWord;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Enhanced handling of informal Indonesian expressions dengan comprehensive regional variations
   */
  private normalizeInformalExpressions(query: string): string {
    const enhancedInformalMappings = {
      // Jakarta + Betawi comprehensive
      aje: "saja",
      doang: "saja",
      aja: "saja",
      emang: "memang",
      emangnya: "memangnya",
      kalo: "kalau",
      klo: "kalau",
      kl: "kalau",
      gimana: "bagaimana",
      "gimana dong": "bagaimana",
      "gimana sih": "bagaimana",
      "gimana nih": "bagaimana",

      // Extended Betawi expressions
      berape: "berapa",
      brapa: "berapa",
      brp: "berapa",
      mane: "mana",
      dimane: "dimana",
      kemane: "kemana",
      ape: "apa",
      ngape: "mengapa",
      kenape: "mengapa",
      "banyak mane": "berapa banyak",

      // Javanese influences (common in Indonesian)
      kok: "mengapa",
      lho: "",
      to: "",
      je: "",
      tenan: "benar",
      wis: "sudah",
      durung: "belum",
      piye: "bagaimana",
      piro: "berapa",
      endi: "mana",
      opo: "apa",
      sopo: "siapa",
      kapan: "kapan",

      // Sundanese influences
      atuh: "",
      mah: "",
      teh: "",
      ge: "",
      kumaha: "bagaimana",
      naon: "apa",
      sabaraha: "berapa",
      dimana: "dimana",
      iraha: "kapan",
      saha: "siapa",

      // Gen Z expressions
      literally: "benar-benar",
      basically: "pada dasarnya",
      actually: "sebenarnya",
      totally: "benar-benar",
      seriously: "sungguh-sungguh",
      obviously: "jelas",

      // Enhanced informal expressions
      "ada gak": "ada tidak",
      "ada ga": "ada tidak",
      "berapa sih": "berapa",
      "berapa dong": "berapa",
      "kok bisa": "mengapa bisa",
      "kok gitu": "mengapa begitu",
      kenapa: "mengapa",
      knp: "mengapa",

      // Time expressions informal
      udah: "sudah",
      belom: "belum",
      blm: "belum",
      "udah ada": "sudah ada",
      "belom ada": "belum ada",
      "udah selesai": "sudah selesai",
      "belom selesai": "belum selesai",

      // Comparison informal
      kayak: "seperti",
      kaya: "seperti",
      "mirip kayak": "mirip seperti",
      "sama kayak": "sama seperti",
      "beda sama": "berbeda dengan",

      // Demonstrative informal
      gitu: "begitu",
      gini: "begini",
      gituan: "seperti itu",
      ginian: "seperti ini",
      tuh: "itu",
      "ini nih": "ini",

      // Administrative informal expressions
      "udah diapprove": "sudah disetujui",
      "belom diproses": "belum diproses",
      "lagi pending": "sedang menunggu",
      "udah kelar": "sudah selesai",
      "belom kelar": "belum selesai",
      "lagi dikerjain": "sedang dikerjakan",
      "udah beres": "sudah selesai",
      "belom beres": "belum selesai",

      // Quantity informal
      "banyak banget": "sangat banyak",
      dikit: "sedikit",
      "dikit banget": "sangat sedikit",
      "lumayan banyak": "cukup banyak",
      "segitu doang": "hanya segitu",

      // Question informal
      "berapa banyak sih": "berapa banyak",
      "ada berapa coba": "ada berapa",
      "jumlahnya berapa dong": "jumlahnya berapa",
      "totalnya berapa ya": "totalnya berapa",

      // Pronouns informal
      gue: "saya",
      gw: "saya",
      ane: "saya",
      lu: "anda",
      lo: "anda",
      elu: "anda",
      dia: "dia",
      mereka: "mereka",

      // Filler words (remove)
      dong: "",
      sih: "",
      nih: "",
      lah: "",
      kan: "",
      ya: "",
      coba: "",
      dulu: "",

      // Regional administrative slang
      ngurus: "mengurus",
      ngurusin: "mengurus",
      bikin: "membuat",
      bikinin: "membuatkan",
      cari: "mencari",
      cariin: "mencarikan",
      liat: "melihat",
      liatin: "melihat",

      // Status informal
      "udah jadi": "sudah selesai",
      "belom jadi": "belum selesai",
      "lagi proses": "sedang diproses",
      "udah fix": "sudah pasti",
      "belom fix": "belum pasti",
    };

    let normalized = query;

    // Apply enhanced informal mappings
    Object.entries(enhancedInformalMappings).forEach(([informal, formal]) => {
      const regex = new RegExp(`\\b${informal}\\b`, "gi");
      normalized = normalized.replace(regex, formal);
    });

    // Handle mixed formal/informal patterns
    normalized = this.handleMixedFormalInformal(normalized);

    // Clean up extra spaces dan punctuation
    normalized = normalized.replace(/\s+/g, " ").trim();

    return normalized;
  }

  /**
   * Handle mixed formal/informal patterns dalam same query
   */
  private handleMixedFormalInformal(query: string): string {
    let normalized = query;

    // Handle mixed patterns seperti "berapa jumlah aktivitas yang udah selesai"
    const mixedPatterns: Record<string, string> = {
      // Mixed time expressions
      "yang udah": "yang sudah",
      "yang belom": "yang belum",
      "yang lagi": "yang sedang",

      // Mixed status expressions
      "status yang udah": "status yang sudah",
      "data yang belom": "data yang belum",
      "aktivitas yang lagi": "aktivitas yang sedang",

      // Mixed administrative expressions
      "pengajuan yang udah": "pengajuan yang sudah",
      "dokumentasi yang belom": "dokumentasi yang belum",
      "verifikasi yang lagi": "verifikasi yang sedang",

      // Mixed quantity expressions
      "berapa yang udah": "berapa yang sudah",
      "jumlah yang belom": "jumlah yang belum",
      "total yang lagi": "total yang sedang",

      // Mixed comparison expressions
      "dibanding yang udah": "dibanding yang sudah",
      "sama yang belom": "sama yang belum",
      "vs yang lagi": "vs yang sedang",

      // Mixed conditional expressions
      "kalo udah": "kalau sudah",
      "jika belom": "jika belum",
      "bila lagi": "bila sedang",
    };

    Object.entries(mixedPatterns).forEach(([mixed, formal]) => {
      const regex = new RegExp(mixed, "gi");
      normalized = normalized.replace(regex, formal);
    });

    // Handle contextual informal-formal mixing
    normalized = this.handleContextualMixing(normalized);

    return normalized;
  }

  /**
   * Handle contextual mixing berdasarkan administrative context
   */
  private handleContextualMixing(query: string): string {
    let normalized = query;

    // Administrative context patterns
    const contextualPatterns = [
      // Formal administrative terms dengan informal connectors
      {
        pattern:
          /(\w+)\s+(udah|belom|lagi)\s+(diproses|disetujui|ditolak|diverifikasi)/gi,
        replacement: "$1 sudah $3",
      },
      {
        pattern: /(\w+)\s+(yang)\s+(udah|belom|lagi)\s+(\w+)/gi,
        replacement: "$1 yang sudah $4",
      },
      {
        pattern: /(berapa|jumlah|total)\s+(yang)\s+(udah|belom|lagi)/gi,
        replacement: "$1 yang sudah",
      },
    ];

    contextualPatterns.forEach(({ pattern, replacement }) => {
      normalized = normalized.replace(pattern, replacement);
    });

    return normalized;
  }

  /**
   * Expand synonyms to improve understanding
   */
  private expandSynonyms(query: string): string {
    let expanded = query;

    // Expand quantity synonyms
    this.synonyms.quantity.forEach((synonym) => {
      if (expanded.includes(synonym) && synonym !== "jumlah") {
        expanded = expanded.replace(
          new RegExp(`\\b${synonym}\\b`, "gi"),
          "jumlah",
        );
      }
    });

    // Expand time synonyms
    Object.entries(this.synonyms.time).forEach(([category, synonyms]) => {
      synonyms.forEach((synonym) => {
        if (expanded.includes(synonym)) {
          // Keep the most common form for each category
          const standardForm =
            category === "current"
              ? "sekarang"
              : category === "past"
                ? "lalu"
                : "akan datang";
          expanded = expanded.replace(
            new RegExp(`\\b${synonym}\\b`, "gi"),
            standardForm,
          );
        }
      });
    });

    return expanded;
  }

  private calculateRelativeDate(config: any): { start: Date; end: Date } {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    if (config.days) {
      start.setDate(now.getDate() + config.days);
      end = new Date(start);
      end.setDate(start.getDate() + 1);
    } else if (config.months) {
      if (Array.isArray(config.months)) {
        // For semester/quarter
        start = new Date(now.getFullYear(), config.months[0], 1);
        end = new Date(now.getFullYear(), config.months[1] + 1, 0);
      } else {
        start.setMonth(now.getMonth() + config.months);
        end = new Date(start);
        end.setMonth(start.getMonth() + 1);
      }
    } else if (config.years) {
      start.setFullYear(now.getFullYear() + config.years);
      end = new Date(start);
      end.setFullYear(start.getFullYear() + 1);
    }

    return { start, end };
  }
}

// Use IndonesianNLP.getInstance() to access the singleton instance
// This ensures proper singleton pattern without direct instance export
