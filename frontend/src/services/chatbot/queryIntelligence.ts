import { chatbotDataService } from './dataService';
import { QueryIntent, DataQueryResult } from '@/types/chatbot';
import { IndonesianNLP, ProcessedQuery } from "./indonesianNLP";

/**
 * Enhanced query intelligence system for SELLY chatbot
 * Processes natural language queries and converts them to database operations
 */
export class QueryIntelligence {
  private static instance: QueryIntelligence;
  private conversationContext: Map<string, any> = new Map();

  public static getInstance(): QueryIntelligence {
    if (!QueryIntelligence.instance) {
      QueryIntelligence.instance = new QueryIntelligence();
    }
    return QueryIntelligence.instance;
  }

  // Keywords mapping for Indonesian language processing
  private readonly keywordMappings = {
    // Action keywords
    actions: {
      cari: ["search", "find"],
      tampilkan: ["show", "display"],
      berikan: ["give", "provide"],
      lihat: ["view", "see"],
      analisis: ["analyze", "analysis"],
      ringkasan: ["summary", "overview"],
      statistik: ["statistics", "stats"],
      laporan: ["report"],
      hitung: ["count", "calculate"],
    },

    // Data type keywords
    dataTypes: {
      pengguna: ["user", "users", "profiles"],
      aktivitas: ["activity", "activities"],
      dokumentasi: ["documentation", "docs"],
      salah_rekam: ["kesalahan", "error", "mistake"],
      adjudicate: ["adjudication", "adjudicate_record"],
      duplicate: ["duplikat", "duplicate_operator"],
      pengajuan: ["submission", "pengajuan_bulanan"],
      pengaduan: ["complaint", "pengaduan_bulanan"],
    },

    // Time keywords
    timeframes: {
      hari_ini: ["today", "sekarang"],
      kemarin: ["yesterday"],
      minggu_ini: ["this week", "week"],
      bulan_ini: ["this month", "month"],
      tahun_ini: ["this year", "year"],
      terbaru: ["recent", "latest", "new"],
      "7_hari": ["7 days", "seminggu"],
      "30_hari": ["30 days", "sebulan"],
    },

    // Status keywords
    status: {
      selesai: ["completed", "done", "finished"],
      pending: ["waiting", "incomplete"],
      aktif: ["active"],
      tidak_aktif: ["inactive"],
      semua: ["all", "total"],
    },

    // Comparison keywords
    comparisons: {
      lebih_dari: ["more than", "greater than", ">", "di atas"],
      kurang_dari: ["less than", "smaller than", "<", "di bawah"],
      sama_dengan: ["equal to", "=", "equals"],
      antara: ["between", "dari ... sampai"],
    },
  };

  /**
   * Process natural language query and return structured intent
   */
  async processQuery(query: string): Promise<QueryIntent> {
    const normalizedQuery = this.normalizeQuery(query);
    const tokens = this.tokenizeQuery(normalizedQuery);

    // Determine query type
    const queryType = this.determineQueryType(tokens);

    // Extract entities
    const entities = this.extractEntities(tokens, queryType);

    // Calculate confidence
    const confidence = this.calculateConfidence(tokens, queryType, entities);

    return {
      type: queryType,
      confidence,
      entities,
      parameters: {
        originalQuery: query,
        normalizedQuery,
        tokens,
      },
    };
  }

  /**
   * Execute database query based on intent
   */
  async executeQuery(intent: QueryIntent): Promise<DataQueryResult> {
    try {
      switch (intent.type) {
        case "statistics":
          return await this.handleStatisticsQuery(intent);

        case "search":
          return await this.handleSearchQuery(intent);

        case "data_request":
          return await this.handleDataRequest(intent);

        case "database_test":
          return await this.handleDatabaseTest(intent);

        case "help":
          return this.handleHelpQuery(intent);

        default:
          return this.handleGeneralQuery(intent);
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Kesalahan tidak diketahui",
        suggestions: [
          "Coba gunakan kata kunci yang lebih spesifik",
          "Periksa ejaan dalam pertanyaan Anda",
          "Gunakan format yang lebih sederhana",
        ],
      };
    }
  }

  /**
   * Enhanced query processing using Indonesian NLP
   */
  async processEnhancedQuery(
    query: string,
    userId?: string,
  ): Promise<DataQueryResult> {
    try {
      // Get conversation context for this user
      const context = userId ? this.conversationContext.get(userId) : undefined;

      // Step 1: Process query with enhanced Indonesian NLP
      const processedQuery = IndonesianNLP.getInstance().processQuery(
        query,
        context,
      );

      // Step 2: Convert processed query to legacy QueryIntent format
      const intent = this.convertToQueryIntent(processedQuery);

      // Step 3: Execute the query based on processed intent
      const result = await this.executeEnhancedQuery(processedQuery, intent);

      // Step 4: Update conversation context
      if (userId) {
        this.updateConversationContext(userId, processedQuery, result);
      }

      return result;
    } catch (error) {
      console.error("Error processing enhanced query:", error);
      return {
        success: false,
        error: `Gagal memproses query: ${error instanceof Error ? error.message : "Unknown error"}`,
        suggestions: [
          "Coba sederhanakan pertanyaan Anda",
          "Periksa ejaan kata kunci",
          "Gunakan format yang lebih spesifik",
        ],
      };
    }
  }

  /**
   * Convert ProcessedQuery to legacy QueryIntent format
   */
  private convertToQueryIntent(processedQuery: ProcessedQuery): QueryIntent {
    return {
      type: this.mapQueryTypeToIntent(
        processedQuery.queryType,
        processedQuery.intent.primary,
      ),
      confidence: processedQuery.intent.confidence,
      entities: {
        table: processedQuery.entities.tables?.[0],
        dateRange: processedQuery.entities.dateExpressions?.[0]
          ? {
              start: processedQuery.entities.dateExpressions[0].startDate,
              end: processedQuery.entities.dateExpressions[0].endDate,
            }
          : undefined,
        searchTerm: this.extractSearchTermFromProcessed(processedQuery),
        specificMonth: this.extractMonthFromProcessed(processedQuery),
        specificYear: this.extractYearFromProcessed(processedQuery),
      },
      parameters: {
        originalQuery: processedQuery.originalQuery,
        normalizedQuery: processedQuery.normalizedQuery,
        queryType: processedQuery.queryType,
        processedQuery: processedQuery,
      },
    };
  }

  /**
   * Normalize query for processing
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, " ") // Remove punctuation
      .replace(/\s+/g, " "); // Normalize whitespace
  }

  /**
   * Tokenize query into meaningful parts
   */
  private tokenizeQuery(query: string): string[] {
    return query.split(" ").filter((token) => token.length > 1);
  }

  /**
   * Determine the type of query based on tokens
   */
  private determineQueryType(tokens: string[]): QueryIntent["type"] {
    // PRIORITY 1: Check for NIK-specific queries first (highest priority)
    // This fixes the issue where "bagaimana status pengajuan NIK X" was classified as "help"
    const nikPattern = tokens.some(token => /^\d{16}$/.test(token)); // 16-digit NIK
    const nikKeywords = ["nik"];
    const statusKeywords = ["status", "pengajuan"];

    if (nikPattern && tokens.some(token => nikKeywords.includes(token))) {
      console.log('🎯 [QUERY_TYPE] NIK-specific query detected - routing to search');
      return "search";
    }

    if (tokens.some(token => statusKeywords.includes(token)) &&
        tokens.some(token => ["pengajuan", "adjudicate", "duplicate", "salah"].includes(token))) {
      console.log('🎯 [QUERY_TYPE] Status query detected - routing to search');
      return "search";
    }

    // PRIORITY 2: Check for database test keywords
    const testKeywords = ["test", "tes", "koneksi", "database", "connectivity"];
    if (tokens.some((token) => testKeywords.includes(token))) {
      return "database_test";
    }

    // PRIORITY 3: Check for statistics keywords
    const statsKeywords = [
      "statistik",
      "ringkasan",
      "total",
      "jumlah",
      "berapa",
      "hitung",
    ];
    if (tokens.some((token) => statsKeywords.includes(token))) {
      return "statistics";
    }

    // PRIORITY 4: Check for search keywords
    const searchKeywords = ["cari", "temukan", "nik", "nama"];
    if (tokens.some((token) => searchKeywords.includes(token))) {
      return "search";
    }

    // PRIORITY 5: Check for data request keywords
    const dataKeywords = ["tampilkan", "lihat", "data", "tabel"];
    if (tokens.some((token) => dataKeywords.includes(token))) {
      return "data_request";
    }

    // PRIORITY 6: Check for help keywords (moved to lower priority)
    // Only trigger help if it's a generic help request, not specific queries
    const helpKeywords = ["bantuan", "help", "cara"];
    const genericHelpKeywords = ["bagaimana"];

    if (tokens.some((token) => helpKeywords.includes(token))) {
      return "help";
    }

    // Only classify as help if "bagaimana" is used without specific context
    if (tokens.some((token) => genericHelpKeywords.includes(token)) &&
        !tokens.some((token) => ["nik", "status", "pengajuan", "adjudicate", "duplicate", "salah"].includes(token))) {
      return "help";
    }

    return "general";
  }

  /**
   * Extract entities from tokens based on query type
   */
  private extractEntities(
    tokens: string[],
    queryType: QueryIntent["type"],
  ): QueryIntent["entities"] {
    const entities: QueryIntent["entities"] = {};

    // Extract table names
    const tableKeywords = {
      pengguna: "profiles",
      profil: "profiles",
      aktivitas: "aktivitas_user",
      siak: "aktivitas_siak",
      dokumentasi: "dokumentasi",
      salah: "salah_rekam",
      kesalahan: "salah_rekam",
      adjudicate: "adjudicate_record",
      duplicate: "duplicate_operator",
      duplikat: "duplicate_operator",
      pengajuan: "pengajuan_bulanan",
      pengaduan: "pengaduan_bulanan",
    };

    for (const [keyword, table] of Object.entries(tableKeywords)) {
      if (tokens.includes(keyword)) {
        entities.table = table;
        break;
      }
    }

    // Extract search terms for search queries
    if (queryType === "search") {
      const searchTerms = tokens.filter(
        (token) =>
          !["cari", "temukan", "data", "dalam", "sistem"].includes(token) &&
          token.length > 2,
      );
      if (searchTerms.length > 0) {
        entities.searchTerm = searchTerms.join(" ");
      }
    }

    // Extract date ranges - enhanced with specific month/year parsing
    const monthNames = {
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

    let specificMonth: number | undefined;
    let specificYear: number | undefined;

    // Check for month names
    for (const [monthName, monthIndex] of Object.entries(monthNames)) {
      if (tokens.includes(monthName)) {
        specificMonth = monthIndex;
        break;
      }
    }

    // Check for year (4-digit numbers)
    const yearToken = tokens.find((token) => /^\d{4}$/.test(token));
    if (yearToken) {
      specificYear = parseInt(yearToken);
    }

    // If we have specific month/year, create precise date range
    if (specificMonth !== undefined || specificYear !== undefined) {
      const year = specificYear || new Date().getFullYear();
      const month =
        specificMonth !== undefined ? specificMonth : new Date().getMonth();

      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

      entities.dateRange = {
        start: startDate,
        end: endDate,
      };

      // Store specific month/year for reference
      entities.specificMonth = month;
      entities.specificYear = year;
    } else {
      // Fallback to relative date keywords
      const dateKeywords = {
        hari: 1,
        minggu: 7,
        bulan: 30,
        tahun: 365,
      };

      for (const [keyword, days] of Object.entries(dateKeywords)) {
        if (tokens.includes(keyword) || tokens.includes(`${keyword}_ini`)) {
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - days);

          entities.dateRange = {
            start: startDate,
            end: endDate,
          };
          break;
        }
      }
    }

    // Extract filters
    entities.filters = {};

    if (tokens.includes("selesai") || tokens.includes("completed")) {
      entities.filters.is_ready_to_record = true;
    }

    if (tokens.includes("pending") || tokens.includes("belum")) {
      entities.filters.is_ready_to_record = false;
    }

    return entities;
  }

  /**
   * Calculate confidence score for the intent
   */
  private calculateConfidence(
    tokens: string[],
    queryType: QueryIntent["type"],
    entities: QueryIntent["entities"],
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on keyword matches
    const typeKeywords = {
      statistics: ["statistik", "ringkasan", "total", "jumlah"],
      search: ["cari", "temukan", "nik", "nama"],
      help: ["bantuan", "help", "cara"],
      data_request: ["tampilkan", "lihat", "data"],
      database_test: ["test", "tes", "koneksi", "database"],
      general: ["halo", "hai", "selamat", "terima"],
    };

    const relevantKeywords =
      typeKeywords[queryType as keyof typeof typeKeywords] || [];
    const matchedKeywords = tokens.filter((token) =>
      relevantKeywords.includes(token),
    );
    confidence += matchedKeywords.length * 0.1;

    // Increase confidence if entities are found
    if (entities.table) confidence += 0.2;
    if (entities.searchTerm) confidence += 0.2;
    if (entities.dateRange) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Handle statistics queries
   */
  private async handleStatisticsQuery(
    intent: QueryIntent,
  ): Promise<DataQueryResult> {
    // Check if this is specifically a user-related query
    const isUserQuery =
      intent.parameters?.originalQuery?.toLowerCase().includes("pengguna") ||
      intent.parameters?.originalQuery?.toLowerCase().includes("user") ||
      intent.entities.table === "profiles";

    if (isUserQuery) {
      // Get comprehensive user statistics
      const userStats = await chatbotDataService.getUserStatistics();

      return {
        success: true,
        data: [userStats],
        summary:
          `👥 **Statistik Pengguna Sellica:**\n\n` +
          `📊 **Ringkasan:**\n` +
          `• **Total Pengguna**: ${userStats.totalUsers.toLocaleString("id-ID")}\n` +
          `• **Pengguna Aktif**: ${userStats.approvedUsers.toLocaleString("id-ID")}\n` +
          `• **Menunggu Persetujuan**: ${userStats.pendingUsers.toLocaleString("id-ID")}\n` +
          `• **Aktivitas 30 Hari**: ${userStats.activeUsers.toLocaleString("id-ID")}\n\n` +
          `🔐 **Berdasarkan Role:**\n` +
          Object.entries(userStats.usersByRole)
            .map(([role, count]) => `• ${this.formatRoleName(role)}: ${count}`)
            .join("\n") +
          (Object.keys(userStats.usersByRole).length === 0
            ? "• Belum ada pengguna aktif"
            : "") +
          `\n\n📋 **Status Pendaftaran:**\n` +
          Object.entries(userStats.usersByStatus)
            .map(
              ([status, count]) =>
                `• ${this.formatStatusName(status)}: ${count}`,
            )
            .join("\n") +
          (Object.keys(userStats.usersByStatus).length === 0
            ? "• Belum ada pendaftaran"
            : "") +
          `\n\n💡 **Catatan:** Pengguna baru perlu persetujuan admin sebelum dapat mengakses sistem.`,
        visualizationType: "stats",
      };
    }

    // Check if this is an activity-related query with date range
    const isActivityQuery =
      intent.parameters?.originalQuery?.toLowerCase().includes("aktivitas") ||
      intent.parameters?.originalQuery?.toLowerCase().includes("activity") ||
      intent.entities.table?.includes("aktivitas");

    if (isActivityQuery && intent.entities.dateRange) {
      // Get activities for specific date range
      const activityStats =
        await chatbotDataService.getUserActivitiesByDateRange(
          intent.entities.dateRange.start!,
          intent.entities.dateRange.end!,
          intent.entities.table,
        );

      if (activityStats.isFutureDate) {
        const monthName = this.getMonthName(intent.entities.specificMonth || 0);
        const year = intent.entities.specificYear || new Date().getFullYear();

        return {
          success: true,
          data: [activityStats],
          summary:
            `📅 **Aktivitas ${monthName} ${year}:**\n\n` +
            `⚠️ **Tanggal Masa Depan Terdeteksi**\n` +
            `Data untuk ${monthName} ${year} belum tersedia karena tanggal tersebut belum terjadi.\n\n` +
            `📊 **Informasi Saat Ini:**\n` +
            `• Sistem dapat memberikan data aktivitas untuk periode yang sudah berlalu\n` +
            `• Untuk melihat aktivitas terkini, coba tanyakan "aktivitas bulan ini" atau "aktivitas minggu ini"\n\n` +
            `💡 **Saran:** Tanyakan tentang aktivitas di bulan atau tahun yang sudah berlalu untuk mendapatkan data yang akurat.`,
          visualizationType: "stats",
          suggestions: [
            'Coba "aktivitas bulan ini"',
            'Atau "aktivitas januari 2025"',
            'Atau "total aktivitas tahun 2024"',
          ],
        };
      }

      const monthName = this.getMonthName(
        intent.entities.specificMonth || new Date().getMonth(),
      );
      const year = intent.entities.specificYear || new Date().getFullYear();

      return {
        success: true,
        data: [activityStats],
        summary:
          `📊 **Total Aktivitas ${monthName} ${year}:**\n\n` +
          `🎯 **Ringkasan:**\n` +
          `• **Total Aktivitas**: ${activityStats.totalActivities.toLocaleString("id-ID")}\n` +
          `• **Periode**: ${new Date(activityStats.dateRange.start).toLocaleDateString("id-ID")} - ${new Date(activityStats.dateRange.end).toLocaleDateString("id-ID")}\n\n` +
          `📋 **Rincian per Tabel:**\n` +
          Object.entries(activityStats.activitiesByTable)
            .filter(([, count]) => count > 0)
            .map(
              ([table, count]) =>
                `• **${this.formatTableName(table)}**: ${count.toLocaleString("id-ID")}`,
            )
            .join("\n") +
          (Object.values(activityStats.activitiesByTable).every(
            (count) => count === 0,
          )
            ? "• Tidak ada aktivitas ditemukan untuk periode ini"
            : "") +
          `\n\n💡 **Catatan:** Data diambil dari semua tabel aktivitas dalam sistem.`,
        visualizationType: "stats",
      };
    }

    if (intent.entities.table) {
      // Get specific table statistics
      const tableSummary = await chatbotDataService.getTableSummary(
        intent.entities.table,
        intent.entities.table,
        `Statistik ${intent.entities.table}`,
      );

      return {
        success: true,
        data: [tableSummary],
        summary:
          `📊 **Statistik ${tableSummary.displayName}:**\n` +
          `• Total Record: ${tableSummary.totalCount}\n` +
          `• Selesai: ${tableSummary.completedCount}\n` +
          `• Pending: ${tableSummary.pendingCount}\n` +
          `• Aktivitas 7 Hari: ${tableSummary.recentCount}`,
        visualizationType: "stats",
      };
    } else {
      // Get overall system statistics
      const overview = await chatbotDataService.getDatabaseOverview();

      return {
        success: true,
        data: [overview],
        summary:
          `📊 **Ringkasan Sistem:**\n` +
          `• Total Record: ${overview.totalRecords.toLocaleString("id-ID")}\n` +
          `• Total Tabel: ${overview.totalTables}\n` +
          `• Total Pengguna: ${overview.totalUsers}\n` +
          `• Aktivitas Terbaru: ${overview.recentActivities}\n` +
          `• Status Sistem: ${this.getSystemHealthText(overview.systemHealth)}`,
        visualizationType: "stats",
      };
    }
  }

  /**
   * Handle search queries
   */
  private async handleSearchQuery(
    intent: QueryIntent,
  ): Promise<DataQueryResult> {
    if (!intent.entities.searchTerm) {
      return {
        success: false,
        error: "Kata kunci pencarian tidak ditemukan",
        suggestions: [
          'Gunakan format: "cari [nama/nik]"',
          'Contoh: "cari John Doe" atau "cari 1234567890"',
        ],
      };
    }

    const results = await chatbotDataService.searchData(
      intent.entities.searchTerm,
      10,
    );

    if (results.length === 0) {
      return {
        success: true,
        data: [],
        summary: `🔍 Tidak ditemukan hasil untuk pencarian "${intent.entities.searchTerm}"`,
        suggestions: [
          "Periksa ejaan kata kunci",
          "Gunakan kata kunci yang lebih umum",
          "Coba cari dengan NIK atau nama lengkap",
        ],
      };
    }

    return {
      success: true,
      data: results,
      summary:
        `🔍 **Hasil Pencarian "${intent.entities.searchTerm}":**\n` +
        `Ditemukan ${results.length} hasil yang sesuai.`,
      visualizationType: "table",
    };
  }

  /**
   * Handle data request queries
   */
  private async handleDataRequest(
    intent: QueryIntent,
  ): Promise<DataQueryResult> {
    if (intent.entities.table) {
      const tableSummary = await chatbotDataService.getTableSummary(
        intent.entities.table,
        intent.entities.table,
        `Data ${intent.entities.table}`,
      );

      return {
        success: true,
        data: [tableSummary],
        summary:
          `📋 **Data ${tableSummary.displayName}:**\n` +
          `${tableSummary.description}\n\n` +
          `• Total: ${tableSummary.totalCount} record\n` +
          `• Terakhir diperbarui: ${
            tableSummary.lastUpdated
              ? new Date(tableSummary.lastUpdated).toLocaleDateString("id-ID")
              : "Tidak diketahui"
          }`,
        visualizationType: "stats",
      };
    }

    // Default to overview
    const overview = await chatbotDataService.getDatabaseOverview();
    return {
      success: true,
      data: [overview],
      summary: `📋 **Data Sistem:** Tersedia ${overview.totalTables} tabel dengan ${overview.totalRecords} total record.`,
      visualizationType: "stats",
    };
  }

  /**
   * Handle database connectivity test queries
   */
  private async handleDatabaseTest(
    intent: QueryIntent,
  ): Promise<DataQueryResult> {
    try {
      const testResult = await chatbotDataService.testDatabaseConnectivity();

      return {
        success: testResult.success,
        data: [testResult.results],
        summary: testResult.summary,
        visualizationType: "stats",
        suggestions: testResult.success
          ? [
              "Database connectivity is working properly",
              "All tables are accessible with service role permissions",
              "You can now ask questions about your data",
            ]
          : [
              "Check your Supabase configuration",
              "Verify service role key permissions",
              "Ensure RLS policies allow service role access",
            ],
      };
    } catch (error) {
      return {
        success: false,
        error: `Database test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        suggestions: [
          "Check your internet connection",
          "Verify Supabase service is running",
          "Contact system administrator",
        ],
      };
    }
  }

  /**
   * Handle help queries
   */
  private handleHelpQuery(intent: QueryIntent): DataQueryResult {
    return {
      success: true,
      data: [],
      summary:
        `❓ **Bantuan SELLY:**\n\n` +
        `🔍 **Pencarian:**\n` +
        `• "cari [nama/nik]" - Mencari data berdasarkan nama atau NIK\n` +
        `• "temukan data John" - Mencari semua data terkait John\n\n` +
        `📊 **Statistik:**\n` +
        `• "statistik sistem" - Ringkasan lengkap sistem\n` +
        `• "jumlah pengguna" - Total pengguna terdaftar\n` +
        `• "aktivitas terbaru" - Aktivitas 7 hari terakhir\n\n` +
        `📋 **Data:**\n` +
        `• "tampilkan data salah rekam" - Info tabel salah rekam\n` +
        `• "lihat pengajuan bulanan" - Data pengajuan bulanan\n\n` +
        `💡 **Tips:** Gunakan bahasa Indonesia yang natural dan spesifik.`,
      visualizationType: "stats",
    };
  }

  /**
   * Handle general queries
   */
  private handleGeneralQuery(intent: QueryIntent): DataQueryResult {
    return {
      success: true,
      data: [],
      summary:
        `Halo! Saya SELLY, asisten data cerdas Anda. 👋\n\n` +
        `Saya dapat membantu Anda dengan:\n` +
        `• 🔍 Mencari data dalam sistem\n` +
        `• 📊 Memberikan statistik dan ringkasan\n` +
        `• 📋 Menampilkan informasi tabel\n` +
        `• ❓ Menjawab pertanyaan tentang data\n\n` +
        `Silakan tanyakan apa yang ingin Anda ketahui!`,
      suggestions: [
        'Coba tanyakan "statistik sistem"',
        'Atau cari data dengan "cari [nama]"',
        'Ketik "bantuan" untuk panduan lengkap',
      ],
    };
  }

  /**
   * Get system health text in Indonesian
   */
  private getSystemHealthText(health: string): string {
    const healthMap = {
      excellent: "🟢 Sangat Baik",
      good: "🟡 Baik",
      fair: "🟠 Cukup",
      poor: "🔴 Perlu Perhatian",
    };
    return healthMap[health as keyof typeof healthMap] || "❓ Tidak Diketahui";
  }

  /**
   * Format role name in Indonesian
   */
  private formatRoleName(role: string): string {
    const roleMap = {
      admin: "👑 Administrator",
      user: "👤 Pengguna",
      operator: "⚙️ Operator",
      manager: "📊 Manager",
      unknown: "❓ Tidak Diketahui",
    };
    return (
      roleMap[role as keyof typeof roleMap] ||
      `📝 ${role.charAt(0).toUpperCase() + role.slice(1)}`
    );
  }

  /**
   * Format status name in Indonesian
   */
  private formatStatusName(status: string): string {
    const statusMap = {
      pending: "⏳ Menunggu Persetujuan",
      approved: "✅ Disetujui",
      rejected: "❌ Ditolak",
      active: "🟢 Aktif",
      inactive: "🔴 Tidak Aktif",
      unknown: "❓ Tidak Diketahui",
    };
    return (
      statusMap[status as keyof typeof statusMap] ||
      `📋 ${status.charAt(0).toUpperCase() + status.slice(1)}`
    );
  }

  /**
   * Get month name in Indonesian
   */
  private getMonthName(monthIndex: number): string {
    const monthNames = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    return monthNames[monthIndex] || "Tidak Diketahui";
  }

  /**
   * Format table name in Indonesian
   */
  private formatTableName(tableName: string): string {
    const tableMap = {
      aktivitas_user: "📱 Aktivitas Pengguna",
      aktivitas_siak: "🏢 Aktivitas SIAK",
      dokumentasi: "📄 Dokumentasi",
      pengaduan_bulanan: "📝 Pengaduan Bulanan",
      pengajuan_bulanan: "📋 Pengajuan Bulanan",
      salah_rekam: "⚠️ Salah Rekam",
      adjudicate_record: "⚖️ Adjudikasi Record",
      duplicate_operator: "👥 Duplikasi Operator",
      profiles: "👤 Profil Pengguna",
      pending_users: "⏳ Pengguna Pending",
    };
    return (
      tableMap[tableName as keyof typeof tableMap] ||
      `📊 ${tableName.charAt(0).toUpperCase() + tableName.slice(1)}`
    );
  }

  /**
   * Execute enhanced query with support for complex patterns
   */
  private async executeEnhancedQuery(
    processedQuery: ProcessedQuery,
    intent: QueryIntent,
  ): Promise<DataQueryResult> {
    // Handle complex query types
    switch (processedQuery.queryType) {
      case "compound":
        return await this.handleCompoundQuery(processedQuery, intent);
      case "comparative":
        return await this.handleComparativeQuery(processedQuery, intent);
      case "conditional":
        return await this.handleConditionalQuery(processedQuery, intent);
      case "aggregation":
        return await this.handleAggregationQuery(processedQuery, intent);
      default:
        // Fall back to standard query execution
        return await this.executeQuery(intent);
    }
  }

  /**
   * Update conversation context for follow-up queries
   */
  private updateConversationContext(
    userId: string,
    processedQuery: ProcessedQuery,
    result: DataQueryResult,
  ): void {
    this.conversationContext.set(userId, {
      lastQuery: processedQuery,
      lastResult: result,
      timestamp: new Date(),
      entities: processedQuery.entities,
      queryHistory: [
        ...(this.conversationContext.get(userId)?.queryHistory || []).slice(-4),
        processedQuery,
      ],
    });
  }

  /**
   * Map ProcessedQuery type to QueryIntent type
   */
  private mapQueryTypeToIntent(
    queryType: ProcessedQuery["queryType"],
    primaryIntent: string,
  ): QueryIntent["type"] {
    switch (queryType) {
      case "compound":
      case "comparative":
      case "conditional":
      case "aggregation":
        return "statistics"; // Most complex queries are statistical in nature
      default:
        // Map primary intent to QueryIntent type
        switch (primaryIntent) {
          case "statistics":
            return "statistics";
          case "search":
            return "search";
          case "help":
            return "help";
          default:
            return "general";
        }
    }
  }

  /**
   * Extract search term from processed query
   */
  private extractSearchTermFromProcessed(
    processedQuery: ProcessedQuery,
  ): string | undefined {
    // Look for specific names, NIKs, or identifiers in the original query
    const searchPatterns = [
      /nik\s+(\d+)/i,
      /nama\s+([a-zA-Z\s]+)/i,
      /operator\s+([a-zA-Z\s]+)/i,
      /user\s+([a-zA-Z\s]+)/i,
    ];

    for (const pattern of searchPatterns) {
      const match = processedQuery.originalQuery.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract month from processed query
   */
  private extractMonthFromProcessed(
    processedQuery: ProcessedQuery,
  ): number | undefined {
    const dateExpr = processedQuery.entities.dateExpressions?.[0];
    if (dateExpr && dateExpr.startDate) {
      return dateExpr.startDate.getMonth();
    }
    return undefined;
  }

  /**
   * Extract year from processed query
   */
  private extractYearFromProcessed(
    processedQuery: ProcessedQuery,
  ): number | undefined {
    const dateExpr = processedQuery.entities.dateExpressions?.[0];
    if (dateExpr && dateExpr.startDate) {
      return dateExpr.startDate.getFullYear();
    }
    return undefined;
  }

  /**
   * Handle compound queries (multiple questions in one)
   */
  private async handleCompoundQuery(
    processedQuery: ProcessedQuery,
    intent: QueryIntent,
  ): Promise<DataQueryResult> {
    // For now, fall back to standard execution
    // TODO: Implement compound query splitting and parallel execution
    return await this.executeQuery(intent);
  }

  /**
   * Handle comparative queries (comparing data across periods/categories)
   */
  private async handleComparativeQuery(
    processedQuery: ProcessedQuery,
    intent: QueryIntent,
  ): Promise<DataQueryResult> {
    // For now, fall back to standard execution
    // TODO: Implement comparative analysis
    return await this.executeQuery(intent);
  }

  /**
   * Handle conditional queries (if/when conditions)
   */
  private async handleConditionalQuery(
    processedQuery: ProcessedQuery,
    intent: QueryIntent,
  ): Promise<DataQueryResult> {
    // For now, fall back to standard execution
    // TODO: Implement conditional filtering
    return await this.executeQuery(intent);
  }

  /**
   * Handle aggregation queries (sum, count, average, etc.)
   */
  private async handleAggregationQuery(
    processedQuery: ProcessedQuery,
    intent: QueryIntent,
  ): Promise<DataQueryResult> {
    // For now, fall back to standard execution
    // TODO: Implement advanced aggregation functions
    return await this.executeQuery(intent);
  }
}

// Export singleton instance
export const queryIntelligence = QueryIntelligence.getInstance();
