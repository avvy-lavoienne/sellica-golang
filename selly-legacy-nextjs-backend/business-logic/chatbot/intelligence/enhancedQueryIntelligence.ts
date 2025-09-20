/**
 * Enhanced Query Intelligence with Deep Schema Awareness
 * Integrates schema intelligence with natural language processing for superior data analysis
 */

import { schemaIntelligence, insightEngine } from './schemaIntelligence';
import { IndonesianNLP, ProcessedQuery } from "../nlp/indonesianNLP";
import { chatbotDataService } from "../../../backend-utilities/chatbot/data/dataService";
import { ConversationalEnhancer } from "../../../../src/services/chatbot/conversationalEnhancer";
import { groqResponseEnhancer } from '../core/groqResponseEnhancer';
import {
  DatabaseToolSelector,
  databaseTools,
  type ToolCallResult,
} from "../../../backend-utilities/chatbot/data/databaseTools";
import { QueryIntent, DataQueryResult } from "@/types/chatbot";
import { visualizationEngine, ChartConfig } from "../../../../src/services/chatbot/visualizationEngine";
import { EnhancedQueryResult, InsightSuggestion } from "../../../../src/services/chatbot/queryTypes";
import { administrativeRelationshipMapper } from "../analytics/administrativeRelationshipMapper";
import { administrativeSQLTemplates } from "../../../backend-utilities/chatbot/data/administrativeSQLTemplates";
import { administrativeCrossTableAnalytics } from "../analytics/administrativeCrossTableAnalytics";
import { enhancedSchemaIntelligence } from "../../../../src/services/chatbot/enhancedSchemaIntelligence";
import { administrativeWorkflowIntelligence } from "../analytics/administrativeWorkflowIntelligence";
import type { AdministrativeContext } from "./schemaIntelligence";
import { PersonaService, ConversationContext } from "../../../../src/services/chatbot/personaService";
import { aiLogger } from '../../../backend-utilities/monitoring/monitoring/logger';

// Extended ProcessedQuery interface for enhanced functionality
export interface EnhancedProcessedQuery extends ProcessedQuery {
  entities: ProcessedQuery["entities"] & {
    suggestedColumns?: string[];
    columnSuggestions?: ColumnSuggestion[];
    validatedFunctions?: string[];
    optimizedJoins?: string[];
  };
}

// EnhancedQueryResult is now imported from queryTypes.ts

export interface ColumnSuggestion {
  columnName: string;
  tableName: string;
  relevanceScore: number;
  suggestedAnalytics: string[];
  description: string;
}

export interface QueryOptimization {
  type: "performance" | "accuracy" | "completeness";
  suggestion: string;
  impact: "low" | "medium" | "high";
  implementation: string;
}

export class EnhancedQueryIntelligence {
  private static instance: EnhancedQueryIntelligence;
  private conversationalEnhancer = new ConversationalEnhancer();
  private relationshipMapper = administrativeRelationshipMapper;
  private sqlTemplates = administrativeSQLTemplates;
  private crossTableAnalytics = administrativeCrossTableAnalytics;
  private workflowIntelligence = administrativeWorkflowIntelligence;
  private personaService = new PersonaService();

  public static getInstance(): EnhancedQueryIntelligence {
    if (!EnhancedQueryIntelligence.instance) {
      EnhancedQueryIntelligence.instance = new EnhancedQueryIntelligence();
    }
    return EnhancedQueryIntelligence.instance;
  }

  /**
   * Process query with enhanced schema awareness and insight generation
   */
  public async processEnhancedQuery(
    query: string,
    userId?: string,
  ): Promise<EnhancedQueryResult> {
    try {
      aiLogger.enhancedQuery.debug('Enhanced Query Intelligence: Processing query', {
        query: query.substring(0, 100),
        userId
      });

      // Step 0: Handle greetings first (highest priority)
      const isGreeting = /halo|hai|hello|selamat|selly/i.test(query.toLowerCase());
      if (isGreeting) {
        console.log('Greeting detected, applying persona greeting response');

        // Use persona service for proper greeting
        const conversationContext: ConversationContext = {
          isFirstInteraction: true,
          timeOfDay: this.getTimeOfDay(),
          userGreeting: query,
          previousInteractions: 0,
          userId: userId
        };

        const personaGreeting = await this.personaService.applyPersona('', query, conversationContext);

        return {
          success: true,
          data: [],
          summary: personaGreeting.content,
          visualizationType: "stats",
          schemaInsights: {
            suggestedColumns: [],
            availableAnalytics: [],
            tableRelationships: [],
            dataQualityNotes: [],
          },
          proactiveInsights: [],
          followUpQuestions: [
            "Berapa total user yang terdaftar?",
            "Tampilkan data pengajuan terbaru",
            "Cari data berdasarkan nama atau NIK"
          ],
          queryOptimizations: [],
        };
      }

      // Step 1: Try tool-use approach for data queries
      console.log('🔍 [ENHANCED_QUERY] Attempting tool-use approach for query:', query);
      const toolResult = await this.tryToolUseApproach(query);
      console.log('🔍 [ENHANCED_QUERY] Tool-use approach result:', toolResult ? 'SUCCESS' : 'FAILED');

      if (toolResult) {
        console.log('✅ [ENHANCED_QUERY] Tool-use approach succeeded, returning detailed result');
        console.log('📋 [ENHANCED_QUERY] Tool result summary:', toolResult.summary?.substring(0, 100) + '...');
        return toolResult;
      } else {
        console.log('❌ [ENHANCED_QUERY] Tool-use approach failed, falling back to schema intelligence');
      }

      // Step 1: Normalize query for better understanding
      const normalizedQuery = this.conversationalEnhancer.normalizeQuery(query);
      console.log('Normalized query:', normalizedQuery);

      // Step 2: Process with Indonesian NLP (use normalized query)
      const processedQuery =
        IndonesianNLP.getInstance().processQuery(normalizedQuery);
      console.log('Processed query intent:', processedQuery.intent);

      // Step 2: Detect administrative context
      const administrativeContext = schemaIntelligence.detectAdministrativeDomain(query);
      console.log('🎯 [ADMIN_CONTEXT] Administrative context detected:', administrativeContext);

      // Step 3: Try advanced analytics queries
      const analyticsResult = await this.tryAdvancedAnalytics(query, administrativeContext);
      if (analyticsResult) {
        console.log('Advanced analytics query matched successfully');
        return analyticsResult;
      }

      // Step 4: Try administrative SQL templates
      const templateResult = await this.tryAdministrativeTemplates(query, administrativeContext);
      if (templateResult) {
        console.log('Administrative template matched successfully');
        return templateResult;
      }

      // Step 5: Enhance with schema intelligence
      const schemaEnhancedQuery =
        this.enhanceWithSchemaIntelligence(processedQuery);

      // Step 6: Execute optimized query
      const baseResult =
        await this.executeSchemaAwareQuery(schemaEnhancedQuery);

      // Step 7: Generate proactive insights with administrative context
      const proactiveInsights = this.generateProactiveInsights(
        processedQuery,
        baseResult,
        administrativeContext
      );

      // Step 5: Create enhanced result
      return this.createEnhancedResult(
        baseResult,
        processedQuery,
        proactiveInsights,
      );
    } catch (error) {
      console.error("Error in enhanced query processing:", error);
      return this.createErrorResult(error);
    }
  }

  /**
   * Enhance processed query with schema intelligence
   */
  private enhanceWithSchemaIntelligence(
    processedQuery: ProcessedQuery,
  ): EnhancedProcessedQuery {
    const enhancedEntities: EnhancedProcessedQuery["entities"] = {
      ...processedQuery.entities,
    };

    // Enhance table detection with schema validation
    if (enhancedEntities.tables) {
      enhancedEntities.tables = enhancedEntities.tables.filter((table) => {
        const schema = schemaIntelligence.getTableSchema(table);
        return schema !== null;
      });
    }

    // Add suggested columns based on query intent
    const suggestedColumns: ColumnSuggestion[] = [];
    if (enhancedEntities.tables) {
      for (const table of enhancedEntities.tables) {
        const columns = schemaIntelligence.suggestColumns(
          table,
          processedQuery.intent.primary,
        );
        columns.forEach((column) => {
          suggestedColumns.push({
            columnName: column.name,
            tableName: table,
            relevanceScore: this.calculateColumnRelevance(
              column,
              processedQuery,
            ),
            suggestedAnalytics: column.suggestedAnalytics,
            description: column.description || "",
          });
        });
      }
    }

    // Sort by relevance and add to entities
    enhancedEntities.suggestedColumns = suggestedColumns
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5)
      .map((col) => `${col.tableName}.${col.columnName}`);

    enhancedEntities.columnSuggestions = suggestedColumns
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);

    return {
      ...processedQuery,
      entities: enhancedEntities,
    } as EnhancedProcessedQuery;
  }

  /**
   * Calculate column relevance score based on query context
   */
  private calculateColumnRelevance(
    column: any,
    processedQuery: ProcessedQuery,
  ): number {
    let score = 0.5; // Base score

    const queryText = processedQuery.normalizedQuery.toLowerCase();
    const intent = processedQuery.intent.primary.toLowerCase();

    // Boost score for direct column name matches
    if (queryText.includes(column.name.toLowerCase())) {
      score += 0.3;
    }

    // Boost score for statistical type alignment
    if (intent.includes("trend") && column.statisticalType === "temporal") {
      score += 0.2;
    }
    if (
      intent.includes("distribusi") &&
      column.statisticalType === "categorical"
    ) {
      score += 0.2;
    }
    if (intent.includes("rata") && column.statisticalType === "numerical") {
      score += 0.2;
    }

    // Boost score for suggested analytics alignment
    column.suggestedAnalytics.forEach((analytics: string) => {
      if (queryText.includes(analytics.replace("_", " "))) {
        score += 0.1;
      }
    });

    return Math.min(score, 1.0);
  }

  /**
   * Try tool-use approach for intelligent database interaction
   */
  private async tryToolUseApproach(
    query: string,
  ): Promise<EnhancedQueryResult | null> {
    try {
      console.log("🔧 [TOOL_USE] Trying tool-use approach for query:", query);

      const toolSelection = DatabaseToolSelector.selectTool(query);
      console.log("🔧 [TOOL_USE] Tool selection result:", toolSelection ? `Tool: ${toolSelection.tool.name}` : 'NULL');

      if (!toolSelection) {
        console.log("❌ [TOOL_USE] No suitable tool found for query - this will cause fallback to schema intelligence");
        return null;
      }

      console.log(
        "✅ Selected tool:",
        toolSelection.tool.name,
        "with params:",
        toolSelection.params,
      );

      const toolResult: ToolCallResult = await toolSelection.tool.execute(
        toolSelection.params,
      );

      if (!toolResult.success) {
        console.log("❌ Tool execution failed:", toolResult.explanation);
        return null;
      }

      // Enhance the tool result with Groq or conversational layer
      let enhanced;

      // Check if Groq enhancement is enabled (faster alternative to basic enhancement)
      if (groqResponseEnhancer.isEnabled()) {
        console.log('🚀 [GROQ] Applying fast response enhancement to tool result...');
        const groqResult = await groqResponseEnhancer.enhanceResponse({
          content: toolResult.explanation,
          type: 'administrative',
          metadata: {}
        });

        if (groqResult.success) {
          enhanced = {
            content: groqResult.enhancedResponse,
            suggestions: [],
            followUpQuestions: []
          };
          console.log('✅ [GROQ] Tool result enhancement completed:', {
            enhanced: true,
            originalLength: toolResult.explanation.length,
            enhancedLength: groqResult.enhancedResponse.length,
            processingTime: `${groqResult.enhancementMetadata.processingTime}ms`
          });
        } else {
          enhanced = this.conversationalEnhancer.enhanceResponse(
            toolResult.explanation,
            query,
          );
          console.log('⚠️ [GROQ] Enhancement failed, using basic conversational enhancer');
        }
      } else {
        // Fallback to basic conversational enhancer
        enhanced = this.conversationalEnhancer.enhanceResponse(
          toolResult.explanation,
          query,
        );
      }

      console.log("🎉 Tool-use approach successful");

      return {
        success: true,
        summary: enhanced.content,
        data: toolResult.data,
        suggestions: toolResult.suggestedFollowUps,
        visualizationType: this.determineVisualizationType(
          toolSelection.tool.name,
        ),
        schemaInsights: {
          suggestedColumns: [],
          availableAnalytics: [],
          tableRelationships: [],
          dataQualityNotes: [],
        },
        proactiveInsights: [],
        followUpQuestions: enhanced.followUpQuestions || [],
        queryOptimizations: [],
      };
    } catch (error) {
      console.error("🚨 Tool-use approach error:", error);
      return null;
    }
  }

  /**
   * Determine visualization type based on tool used
   */
  private determineVisualizationType(
    toolName: string,
  ): "table" | "chart" | "stats" {
    switch (toolName) {
      case "search_data":
        return "table";
      case "get_user_statistics":
      case "get_table_statistics":
      case "get_database_overview":
        return "stats";
      default:
        return "stats";
    }
  }

  /**
   * Execute query with schema awareness
   */
  private async executeSchemaAwareQuery(
    processedQuery: EnhancedProcessedQuery,
  ): Promise<DataQueryResult> {
    // Convert DateExpression to expected format
    const dateRange = processedQuery.entities.dateExpressions?.[0]
      ? {
          start: processedQuery.entities.dateExpressions[0].startDate,
          end: processedQuery.entities.dateExpressions[0].endDate,
        }
      : undefined;

    // Convert to legacy QueryIntent format for compatibility
    const intent: QueryIntent = {
      type: this.mapQueryTypeToIntent(
        processedQuery.queryType,
        processedQuery.intent.primary,
      ),
      confidence: processedQuery.intent.confidence,
      entities: {
        table: processedQuery.entities.tables?.[0],
        searchTerm: this.extractSearchTerm(processedQuery.normalizedQuery),
        dateRange: dateRange,
        ...processedQuery.entities,
      },
      parameters: {
        originalQuery: processedQuery.originalQuery,
        normalizedQuery: processedQuery.normalizedQuery,
        tokens: processedQuery.normalizedQuery.split(" "),
      },
    };

    // Execute based on query type with schema enhancements
    switch (processedQuery.queryType) {
      case "aggregation":
        return await this.executeAggregationQuery(processedQuery, intent);
      case "comparative":
        return await this.executeComparativeQuery(processedQuery, intent);
      case "conditional":
        return await this.executeConditionalQuery(processedQuery, intent);
      default:
        return await this.executeBasicQuery(intent);
    }
  }

  /**
   * Execute aggregation query with statistical intelligence
   */
  private async executeAggregationQuery(
    processedQuery: EnhancedProcessedQuery,
    intent: QueryIntent,
  ): Promise<DataQueryResult> {
    const originalQuery = processedQuery.originalQuery.toLowerCase();

    // Check if this is actually a user statistics query disguised as aggregation
    const isUserStatsQuery =
      (originalQuery.includes("user") ||
        originalQuery.includes("pengguna") ||
        originalQuery.includes("sellica")) &&
      (originalQuery.includes("berapa") ||
        originalQuery.includes("jumlah") ||
        originalQuery.includes("total"));

    if (isUserStatsQuery) {
      // Redirect to user statistics handler
      const userStats = await chatbotDataService.getUserStatistics();

      // Create base response
      const baseResponse =
        `📊 **Statistik Pengguna SELLICA**\n\n` +
        `👥 **Total Pengguna**: ${userStats.totalUsers}\n` +
        `✅ **Pengguna Aktif**: ${userStats.activeUsers}\n` +
        `⏳ **Menunggu Persetujuan**: ${userStats.pendingUsers}\n` +
        `✔️ **Sudah Disetujui**: ${userStats.approvedUsers}\n\n` +
        `**Distribusi Berdasarkan Role:**\n` +
        Object.entries(userStats.usersByRole)
          .map(([role, count]) => `• ${role}: ${count} orang`)
          .join("\n");

      // Enhance with conversational layer
      const enhanced = this.conversationalEnhancer.enhanceResponse(
        baseResponse,
        originalQuery,
      );

      return {
        success: true,
        data: [userStats],
        summary: enhanced.content,
        suggestions: enhanced.suggestions,
        visualizationType: "stats",
      };
    }

    const aggregations = processedQuery.entities.aggregations;
    if (!aggregations || aggregations.length === 0) {
      return await this.executeBasicQuery(intent);
    }

    const agg = aggregations[0];
    const tableName = processedQuery.entities.tables?.[0];

    if (!tableName) {
      return await this.executeBasicQuery(intent);
    }

    // Get schema to validate aggregation function
    const schema = schemaIntelligence.getTableSchema(tableName);
    if (!schema) {
      return await this.executeBasicQuery(intent);
    }

    // Find appropriate column for aggregation
    const targetColumn = schema.columns.find((col) => {
      if (agg.function === "count") return true; // Count works on any column
      if (["sum", "average", "min", "max"].includes(agg.function)) {
        return col.statisticalType === "numerical";
      }
      return false;
    });

    if (!targetColumn) {
      return {
        success: false,
        data: [],
        summary: `Fungsi ${agg.function} tidak dapat diterapkan pada tabel ${tableName}`,
        visualizationType: "stats",
      };
    }

    // Execute aggregation (simplified - would need actual SQL generation)
    const tableSummary = await chatbotDataService.getTableSummary(
      tableName,
      schema.displayName,
      schema.description,
    );

    let result: number;
    let description: string;

    switch (agg.function) {
      case "count":
        result = tableSummary.totalCount;
        description = `Total ${schema.displayName.toLowerCase()}`;
        break;
      case "sum":
        result = tableSummary.totalCount; // Placeholder
        description = `Jumlah total ${targetColumn.description?.toLowerCase()}`;
        break;
      default:
        result = tableSummary.totalCount;
        description = `${agg.function} dari ${schema.displayName.toLowerCase()}`;
    }

    return {
      success: true,
      data: [
        { [agg.function]: result, table: tableName, column: targetColumn.name },
      ],
      summary: `${description}: ${result.toLocaleString("id-ID")}`,
      visualizationType: "stats",
    };
  }

  /**
   * Execute comparative query with relationship awareness
   */
  private async executeComparativeQuery(
    processedQuery: EnhancedProcessedQuery,
    intent: QueryIntent,
  ): Promise<DataQueryResult> {
    const comparisons = processedQuery.entities.comparisons;
    if (!comparisons || comparisons.length === 0) {
      return await this.executeBasicQuery(intent);
    }

    const comparison = comparisons[0];
    const tables = processedQuery.entities.tables || [];

    if (tables.length < 2) {
      // Single table comparison - compare different values
      const tableName = tables[0];
      if (!tableName) return await this.executeBasicQuery(intent);

      const tableSummary = await chatbotDataService.getTableSummary(
        tableName,
        tableName,
        `Perbandingan ${tableName}`,
      );

      return {
        success: true,
        data: [tableSummary],
        summary: `Perbandingan ${tableName}: Selesai ${tableSummary.completedCount} vs Pending ${tableSummary.pendingCount}`,
        visualizationType: "chart",
      };
    }

    // Multi-table comparison
    const results = [];
    for (const table of tables) {
      const summary = await chatbotDataService.getTableSummary(
        table,
        table,
        table,
      );
      results.push(summary);
    }

    return {
      success: true,
      data: results,
      summary: `Perbandingan antar tabel: ${results.map((r) => `${r.displayName} (${r.totalCount})`).join(" vs ")}`,
      visualizationType: "chart",
    };
  }

  /**
   * Execute conditional query with filter intelligence
   */
  private async executeConditionalQuery(
    processedQuery: EnhancedProcessedQuery,
    intent: QueryIntent,
  ): Promise<DataQueryResult> {
    // For now, fall back to basic query
    // TODO: Implement conditional filtering with schema validation
    return await this.executeBasicQuery(intent);
  }

  /**
   * Execute basic query using existing data service
   */
  private async executeBasicQuery(
    intent: QueryIntent,
  ): Promise<DataQueryResult> {
    console.log("=== executeBasicQuery Debug ===");
    console.log("Intent:", intent);
    console.log("Intent type:", intent.type);
    console.log("Intent entities:", intent.entities);
    console.log("Original query:", intent.parameters?.originalQuery);

    if (intent.type === "statistics") {
      const originalQuery =
        intent.parameters?.originalQuery?.toLowerCase() || "";
      console.log("Processing statistics query:", originalQuery);

      // Check for user statistics requests (check both entity flag and query content)
      const hasUserStatsEntity =
        intent.parameters?.processedQuery?.entities?.userStatistics;
      const hasUserKeywords =
        originalQuery.includes("user") ||
        originalQuery.includes("pengguna") ||
        originalQuery.includes("sellica");

      console.log("User stats detection:", {
        hasUserStatsEntity,
        hasUserKeywords,
        originalQuery,
      });

      if (hasUserStatsEntity || hasUserKeywords) {
        const userStats = await chatbotDataService.getUserStatistics();

        // Create base response
        const baseResponse =
          `📊 **Statistik Pengguna SELLICA**\n\n` +
          `👥 **Total Pengguna**: ${userStats.totalUsers}\n` +
          `✅ **Pengguna Aktif**: ${userStats.activeUsers}\n` +
          `⏳ **Menunggu Persetujuan**: ${userStats.pendingUsers}\n` +
          `✔️ **Sudah Disetujui**: ${userStats.approvedUsers}\n\n` +
          `**Distribusi Berdasarkan Role:**\n` +
          Object.entries(userStats.usersByRole)
            .map(([role, count]) => `• ${role}: ${count} orang`)
            .join("\n");

        // Enhance with conversational layer
        const enhanced = this.conversationalEnhancer.enhanceResponse(
          baseResponse,
          originalQuery,
        );

        return {
          success: true,
          data: [userStats],
          summary: enhanced.content,
          suggestions: enhanced.suggestions,
          visualizationType: "stats",
        };
      }

      // Check for specific table statistics
      console.log(
        "Checking table statistics. Table entity:",
        intent.entities.table,
      );
      console.log("All entities:", intent.entities);

      // Enhanced table detection - check for table keywords in query
      const tableKeywords = {
        pengajuan: "pengajuan_bulanan",
        pengaduan: "pengaduan_bulanan",
        "salah rekam": "salah_rekam",
        dokumentasi: "dokumentasi",
        profil: "profiles",
        user: "profiles",
        pengguna: "profiles",
      };

      let detectedTable = intent.entities.table;
      if (!detectedTable) {
        // Try to detect table from query content
        for (const [keyword, tableName] of Object.entries(tableKeywords)) {
          if (originalQuery.includes(keyword)) {
            detectedTable = tableName;
            console.log(
              `Detected table "${tableName}" from keyword "${keyword}"`,
            );
            break;
          }
        }
      }

      if (detectedTable) {
        console.log("Getting table summary for:", detectedTable);
        const tableSummary = await chatbotDataService.getTableSummary(
          detectedTable,
          detectedTable,
          `Statistik ${detectedTable}`,
        );

        // Create base response
        const baseResponse =
          `📊 **Statistik ${tableSummary.displayName}**\n\n` +
          `📋 **Total Record**: ${tableSummary.totalCount}\n` +
          `✅ **Selesai**: ${tableSummary.completedCount}\n` +
          `⏳ **Pending**: ${tableSummary.pendingCount}`;

        // Enhance with conversational layer
        const enhanced = this.conversationalEnhancer.enhanceResponse(
          baseResponse,
          originalQuery,
        );

        return {
          success: true,
          data: [tableSummary],
          summary: enhanced.content,
          suggestions: enhanced.suggestions,
          visualizationType: "stats",
        };
      } else {
        console.log("No table detected, falling back to overview");
        const overview = await chatbotDataService.getDatabaseOverview();

        // Create base response
        const baseResponse =
          `📊 **Ringkasan Sistem Database**\n\n` +
          `📋 **Total Record**: ${overview.totalRecords}\n` +
          `🗂️ **Total Tabel**: ${overview.totalTables}`;

        // Enhance with conversational layer
        const enhanced = this.conversationalEnhancer.enhanceResponse(
          baseResponse,
          originalQuery,
        );

        return {
          success: true,
          data: [overview],
          summary: enhanced.content,
          suggestions: enhanced.suggestions,
          visualizationType: "stats",
        };
      }
    }

    if (intent.type === "search" && intent.entities.searchTerm) {
      const searchResults = await chatbotDataService.searchData(
        intent.entities.searchTerm,
      );
      return {
        success: true,
        data: searchResults,
        summary: `Ditemukan ${searchResults.length} hasil untuk "${intent.entities.searchTerm}"`,
        visualizationType: "table",
      };
    }

    if (intent.type === "help") {
      const originalQuery =
        intent.parameters?.originalQuery?.toLowerCase() || "";

      console.log('Help intent detected, originalQuery:', originalQuery);

      // Check if it's a greeting
      const isGreeting = /halo|hai|hello|selamat|selly/i.test(originalQuery);
      console.log('Is greeting:', isGreeting);

      if (isGreeting) {
        return {
          success: true,
          data: [],
          summary:
            `Halo! 👋 Saya SELLY, asisten data cerdas untuk sistem administrasi Anda.\n\n` +
            `Senang bertemu dengan Anda! Saya siap membantu Anda dengan:\n\n` +
            `🔍 **Pencarian Data**\n` +
            `   • Cari warga: "cari nama John" atau "cari NIK 1234567890123456"\n` +
            `   • Temukan informasi spesifik dalam database\n\n` +
            `📊 **Statistik & Ringkasan**\n` +
            `   • "statistik sistem" - overview lengkap database\n` +
            `   • "jumlah pengajuan" - data pengajuan bulanan\n` +
            `   • "berapa total data" - ringkasan keseluruhan\n\n` +
            `📋 **Informasi Tabel**\n` +
            `   • "data salah rekam" - informasi kesalahan perekaman\n` +
            `   • "pengaduan bulanan" - data pengaduan\n` +
            `   • "dokumentasi" - file dan dokumen\n\n` +
            `Apa yang bisa saya bantu hari ini?`,
          suggestions: [
            'Lihat "statistik sistem"',
            'Cari data dengan "cari [nama]"',
            'Tanyakan "data pengajuan"',
          ],
          visualizationType: "stats",
        };
      } else {
        return {
          success: true,
          data: [],
          summary:
            `Panduan Penggunaan SELLY 📖\n\n` +
            `**Format Pencarian:**\n` +
            `• "cari [nama]" - mencari berdasarkan nama\n` +
            `• "cari NIK [16 digit]" - mencari berdasarkan NIK\n` +
            `• "tampilkan data [nama]" - menampilkan informasi\n\n` +
            `**Format Statistik:**\n` +
            `• "statistik sistem" - overview database\n` +
            `• "jumlah [tabel]" - statistik tabel tertentu\n` +
            `• "berapa total data" - ringkasan keseluruhan\n\n` +
            `**Tabel yang Tersedia:**\n` +
            `• Salah Rekam • Pengajuan Bulanan\n` +
            `• Pengaduan • Dokumentasi • Profil\n\n` +
            `Silakan coba salah satu format di atas!`,
          suggestions: [
            'Coba "statistik sistem"',
            'Atau "cari [nama]"',
            'Lihat "data pengajuan"',
          ],
          visualizationType: "stats",
        };
      }
    }

    if (intent.type === "general") {
      // For general queries, try to provide a more helpful response
      const originalQuery =
        intent.parameters?.originalQuery?.toLowerCase() || "";

      // Check if it's actually a search query that wasn't detected
      if (
        originalQuery.includes("cari") ||
        originalQuery.includes("temukan") ||
        originalQuery.includes("nama")
      ) {
        // Extract potential search term
        const words = originalQuery.split(" ");
        const searchIndex = words.findIndex((word: string) =>
          ["cari", "temukan", "nama"].includes(word),
        );
        if (searchIndex !== -1 && searchIndex < words.length - 1) {
          const searchTerm = words.slice(searchIndex + 1).join(" ");
          if (searchTerm.length > 2) {
            const searchResults =
              await chatbotDataService.searchData(searchTerm);
            return {
              success: true,
              data: searchResults,
              summary: `Ditemukan ${searchResults.length} hasil untuk "${searchTerm}"`,
              visualizationType: "table",
            };
          }
        }
      }

      // Check if it's a user statistics request that wasn't detected
      if (
        (originalQuery.includes("berapa") ||
          originalQuery.includes("jumlah")) &&
        (originalQuery.includes("user") ||
          originalQuery.includes("pengguna") ||
          originalQuery.includes("sellica"))
      ) {
        const userStats = await chatbotDataService.getUserStatistics();

        // Create base response
        const baseResponse =
          `📊 **Statistik Pengguna SELLICA**\n\n` +
          `👥 **Total Pengguna**: ${userStats.totalUsers}\n` +
          `✅ **Pengguna Aktif**: ${userStats.activeUsers}\n` +
          `⏳ **Menunggu Persetujuan**: ${userStats.pendingUsers}\n` +
          `✔️ **Sudah Disetujui**: ${userStats.approvedUsers}`;

        // Enhance with conversational layer
        const enhanced = this.conversationalEnhancer.enhanceResponse(
          baseResponse,
          originalQuery,
        );

        return {
          success: true,
          data: [userStats],
          summary: enhanced.content,
          suggestions: enhanced.suggestions,
          visualizationType: "stats",
        };
      }

      // Check if it's a general statistics request that wasn't detected
      if (
        originalQuery.includes("statistik") ||
        originalQuery.includes("jumlah") ||
        originalQuery.includes("berapa")
      ) {
        const overview = await chatbotDataService.getDatabaseOverview();
        return {
          success: true,
          data: [overview],
          summary: `Ringkasan sistem: ${overview.totalRecords} total record dari ${overview.totalTables} tabel`,
          visualizationType: "stats",
        };
      }

      // Default helpful response for unclear queries
      return {
        success: true,
        data: [],
        summary:
          `Maaf, saya tidak sepenuhnya memahami permintaan Anda. Saya dapat membantu dengan:\n\n` +
          `• 🔍 **Pencarian data**: "cari [nama/nik]"\n` +
          `• 📊 **Statistik**: "statistik sistem" atau "jumlah data"\n` +
          `• 📋 **Info tabel**: "data pengajuan" atau "salah rekam"\n` +
          `• ❓ **Bantuan**: "bantuan" atau "help"\n\n` +
          `Silakan coba dengan format yang lebih spesifik!`,
        suggestions: [
          'Cari data dengan "cari [nama]"',
          'Lihat statistik dengan "statistik sistem"',
          'Tanyakan "bantuan" untuk panduan lengkap',
        ],
        visualizationType: "stats",
      };
    }

    // This should rarely be reached now

    const overview = await chatbotDataService.getDatabaseOverview();
    return {
      success: true,
      data: [overview],
      summary: "Ringkasan sistem database",
      visualizationType: "stats",
    };
  }

  /**
   * Generate proactive insights based on query and results with administrative context
   */
  private generateProactiveInsights(
    processedQuery: EnhancedProcessedQuery,
    result: DataQueryResult,
    administrativeContext?: AdministrativeContext | null
  ): InsightSuggestion[] {
    const tables = processedQuery.entities.tables || [];
    const baseInsights = insightEngine.generateInsights(
      processedQuery.originalQuery,
      tables,
    );

    // Add administrative insights if context is available
    if (administrativeContext) {
      const adminInsights: InsightSuggestion[] = [{
        type: 'administrative',
        title: `Insight ${administrativeContext.domain}`,
        description: `${administrativeContext.businessLogic} - Priority: ${administrativeContext.priority}`,
        query: `Analisis mendalam untuk ${administrativeContext.workflow}`,
        confidence: 0.85,
        complexity: administrativeContext.priority === 'critical' ? 'advanced' : 'intermediate',
        expectedValue: `Administrative workflow insights for ${administrativeContext.stage}`
      }];

      // Add relationship insights if multiple tables involved
      if (tables.length > 1) {
        const relationshipAnalysis = this.relationshipMapper.analyzeRelationships(tables, processedQuery.originalQuery);

        if (relationshipAnalysis.primaryRelationships.length > 0) {
          adminInsights.push({
            type: 'relationship',
            title: 'Analisis Relasi Data',
            description: relationshipAnalysis.businessContext,
            query: 'Bagaimana hubungan antar data ini?',
            confidence: 0.8,
            complexity: relationshipAnalysis.complexityScore > 7 ? 'advanced' : 'intermediate',
            expectedValue: `Cross-table analysis with complexity score: ${relationshipAnalysis.complexityScore}`
          });
        }
      }

      return [...baseInsights, ...adminInsights];
    }

    return baseInsights;
  }

  /**
   * Create enhanced result with schema insights
   */
  private createEnhancedResult(
    baseResult: DataQueryResult,
    processedQuery: EnhancedProcessedQuery,
    proactiveInsights: InsightSuggestion[],
  ): EnhancedQueryResult {
    const tables = processedQuery.entities.tables || [];
    const schemaInsights = this.generateSchemaInsights(tables);
    const followUpQuestions = this.generateFollowUpQuestions(
      processedQuery,
      baseResult,
    );
    const queryOptimizations = this.generateQueryOptimizations(processedQuery);

    // Generate visualization if data is suitable
    const chartConfig = visualizationEngine.generateVisualization(
      {
        ...baseResult,
        schemaInsights,
        proactiveInsights,
        followUpQuestions,
        queryOptimizations,
      } as EnhancedQueryResult,
      processedQuery,
    );

    return {
      ...baseResult,
      schemaInsights,
      proactiveInsights,
      followUpQuestions,
      queryOptimizations,
      chartConfig: chartConfig || undefined,
    };
  }

  /**
   * Generate schema-based insights
   */
  private generateSchemaInsights(
    tables: string[],
  ): EnhancedQueryResult["schemaInsights"] {
    const suggestedColumns: string[] = [];
    const availableAnalytics: string[] = [];
    const tableRelationships: string[] = [];
    const dataQualityNotes: string[] = [];

    for (const table of tables) {
      const schema = schemaIntelligence.getTableSchema(table);
      if (!schema) continue;

      // Add suggested columns
      schema.columns.forEach((col) => {
        if (col.suggestedAnalytics.length > 0) {
          suggestedColumns.push(`${table}.${col.name}`);
          availableAnalytics.push(...col.suggestedAnalytics);
        }
      });

      // Add relationships
      schema.relationships.forEach((rel) => {
        tableRelationships.push(`${table} → ${rel.targetTable} (${rel.type})`);
      });

      // Add data quality notes
      const temporalColumns = schema.columns.filter(
        (col) => col.statisticalType === "temporal",
      );
      if (temporalColumns.length > 0) {
        dataQualityNotes.push(
          `${schema.displayName} memiliki data temporal untuk analisis trend`,
        );
      }

      const categoricalColumns = schema.columns.filter(
        (col) => col.statisticalType === "categorical",
      );
      if (categoricalColumns.length > 0) {
        dataQualityNotes.push(
          `${schema.displayName} memiliki ${categoricalColumns.length} kolom kategorikal untuk segmentasi`,
        );
      }
    }

    return {
      suggestedColumns: [...new Set(suggestedColumns)].slice(0, 5),
      availableAnalytics: [...new Set(availableAnalytics)].slice(0, 8),
      tableRelationships: [...new Set(tableRelationships)],
      dataQualityNotes: [...new Set(dataQualityNotes)],
    };
  }

  /**
   * Generate contextual follow-up questions
   */
  private generateFollowUpQuestions(
    processedQuery: EnhancedProcessedQuery,
    result: DataQueryResult,
  ): string[] {
    const questions: string[] = [];
    const tables = processedQuery.entities.tables || [];

    // Add schema-based follow-ups
    for (const table of tables) {
      const schema = schemaIntelligence.getTableSchema(table);
      if (schema) {
        questions.push(...schema.commonQueries.slice(0, 2));
      }
    }

    // Add result-based follow-ups
    if (result.success && result.data && result.data.length > 0) {
      questions.push("Bagaimana trendnya dalam 30 hari terakhir?");
      questions.push("Ada anomali yang perlu diperhatikan?");
      questions.push("Bisa breakdown lebih detail?");
    }

    return [...new Set(questions)].slice(0, 4);
  }

  /**
   * Generate query optimization suggestions
   */
  private generateQueryOptimizations(
    processedQuery: EnhancedProcessedQuery,
  ): string[] {
    const optimizations: string[] = [];

    // Check for missing table specifications
    if (
      !processedQuery.entities.tables ||
      processedQuery.entities.tables.length === 0
    ) {
      optimizations.push("Spesifikasi tabel akan meningkatkan akurasi hasil");
    }

    // Check for vague time references
    if (
      processedQuery.normalizedQuery.includes("hari ini") ||
      processedQuery.normalizedQuery.includes("sekarang")
    ) {
      optimizations.push(
        "Rentang waktu spesifik akan memberikan analisis yang lebih mendalam",
      );
    }

    // Check for aggregation opportunities
    if (
      processedQuery.queryType === "simple" &&
      processedQuery.normalizedQuery.includes("berapa")
    ) {
      optimizations.push(
        "Tambahkan fungsi agregasi (rata-rata, total, maksimum) untuk insight lebih kaya",
      );
    }

    return optimizations;
  }

  /**
   * Helper methods
   */
  private mapQueryTypeToIntent(
    queryType: string,
    primaryIntent?: string,
  ): QueryIntent["type"] {
    // First check primary intent
    if (primaryIntent) {
      switch (primaryIntent) {
        case "help":
          return "help";
        case "search":
          return "search";
        case "statistics":
          return "statistics";
        default:
          break;
      }
    }

    // Then check query type
    switch (queryType) {
      case "aggregation":
        return "statistics";
      case "comparative":
        return "statistics";
      case "conditional":
        return "data_request";
      default:
        return primaryIntent === "help"
          ? "help"
          : primaryIntent === "search"
            ? "search"
            : primaryIntent === "statistics"
              ? "statistics"
              : "general";
    }
  }

  private extractSearchTerm(query: string): string | undefined {
    const searchPatterns = ["cari", "temukan", "nik", "nama"];
    for (const pattern of searchPatterns) {
      if (query.includes(pattern)) {
        const words = query.split(" ");
        const patternIndex = words.findIndex((word) => word.includes(pattern));
        if (patternIndex >= 0 && patternIndex < words.length - 1) {
          return words[patternIndex + 1];
        }
      }
    }
    return undefined;
  }

  private createErrorResult(error: any): EnhancedQueryResult {
    return {
      success: false,
      data: [],
      summary: "Terjadi kesalahan dalam pemrosesan query",
      visualizationType: "stats",
      schemaInsights: {
        suggestedColumns: [],
        availableAnalytics: [],
        tableRelationships: [],
        dataQualityNotes: [],
      },
      proactiveInsights: [],
      followUpQuestions: [
        "Coba dengan query yang lebih spesifik",
        "Periksa nama tabel yang digunakan",
      ],
      queryOptimizations: [],
    };
  }

  /**
   * Try administrative SQL templates for specialized queries
   */
  private async tryAdministrativeTemplates(
    query: string,
    context: AdministrativeContext | null
  ): Promise<EnhancedQueryResult | null> {
    try {
      console.log(`🔍 [TEMPLATE] Trying administrative templates for query: "${query}"`);

      // Step 1: Try enhanced schema intelligence first
      console.log(`🧠 [ENHANCED_SCHEMA] Attempting enhanced schema intelligence parsing...`);
      const businessContext = enhancedSchemaIntelligence.parseAdministrativeQuery(query);

      if (businessContext) {
        console.log(`🧠 [ENHANCED_SCHEMA] Business context parsed for ${businessContext.tableName}`);

        const enhancedQuery = enhancedSchemaIntelligence.generateEnhancedQuery(businessContext);
        console.log(`🔧 [ENHANCED_SCHEMA] Generated enhanced query: ${enhancedQuery.sql}`);

        // Execute the enhanced query
        const queryResult = await chatbotDataService.executeCustomQuery(enhancedQuery.sql);

        if (queryResult.success && queryResult.data) {
          console.log(`✅ [ENHANCED_SCHEMA] Enhanced query executed successfully with ${queryResult.data.length} results`);

          return {
            success: true,
            data: queryResult.data,
            summary: this.generateEnhancedSummary(queryResult.data, enhancedQuery, businessContext),
            visualizationType: this.determineVisualizationTypeFromContext(businessContext),
            suggestions: enhancedQuery.relatedQueries,
            schemaInsights: {
              suggestedColumns: businessContext.columns,
              availableAnalytics: this.getAvailableAnalytics(businessContext.tableName),
              tableRelationships: this.getRelatedTables(businessContext.tableName),
              dataQualityNotes: enhancedQuery.businessInsights
            },
            proactiveInsights: [{
              type: 'administrative',
              title: 'Enhanced Database Intelligence',
              description: enhancedQuery.businessExplanation,
              query: query,
              confidence: 0.95,
              complexity: 'intermediate',
              expectedValue: enhancedQuery.expectedResultFormat
            }],
            followUpQuestions: enhancedQuery.relatedQueries,
            queryOptimizations: []
          };
        } else {
          console.log(`⚠️ [ENHANCED_SCHEMA] Enhanced query failed, falling back to templates`);
        }
      } else {
        console.log(`⚠️ [ENHANCED_SCHEMA] No business context parsed, falling back to templates`);
      }

      // Step 2: Fallback to traditional template matching
      const templateMatches = this.sqlTemplates.findMatchingTemplates(query);
      console.log(`🔍 [TEMPLATE] Found ${templateMatches.length} template matches`);

      if (templateMatches.length === 0) {
        console.log(`❌ [TEMPLATE] No template matches found for query: "${query}"`);
        return null;
      }

      const bestMatch = templateMatches[0];
      console.log(`🎯 [TEMPLATE] Best match: ${bestMatch.template.name} (confidence: ${bestMatch.confidence})`);

      if (bestMatch.confidence < 0.7) {
        console.log(`❌ [TEMPLATE] Confidence too low: ${bestMatch.confidence} < 0.7`);
        return null;
      }

      console.log(`✅ [TEMPLATE] Using administrative template: ${bestMatch.template.name}`);

      // Execute the template SQL
      const templateSQL = this.processTemplate(
        bestMatch.template.template,
        bestMatch.extractedEntities
      );

      const result = await chatbotDataService.executeCustomQuery(templateSQL);

      if (!result.success || !result.data || result.data.length === 0) {
        return null;
      }

      // Process response template
      const responseText = this.processTemplate(
        bestMatch.template.responseTemplate,
        result.data[0]
      );

      return {
        success: true,
        data: result.data,
        summary: responseText,
        visualizationType: bestMatch.template.queryType === 'AGGREGATE' ? 'stats' : 'table',
        schemaInsights: {
          suggestedColumns: [],
          availableAnalytics: [`Template: ${bestMatch.template.name}`],
          tableRelationships: bestMatch.template.requiredEntities,
          dataQualityNotes: [`Complexity: ${bestMatch.template.estimatedComplexity}`]
        },
        proactiveInsights: context ? [{
          type: 'administrative',
          title: `Insight ${context.domain}`,
          description: context.businessLogic,
          query: `Analisis lebih lanjut untuk ${context.domain}`,
          confidence: bestMatch.confidence,
          complexity: this.mapComplexity(bestMatch.template.estimatedComplexity),
          expectedValue: `Administrative insights for ${context.workflow}`
        }] : [],
        followUpQuestions: this.generateAdministrativeFollowUps(bestMatch.template, context),
        queryOptimizations: []
      };

    } catch (error) {
      console.error('❌ [TEMPLATE] Error in administrative template processing:', error);
      return null;
    }
  }

  /**
   * Process template with data substitution
   */
  private processTemplate(template: string, data: Record<string, any>): string {
    let processed = template;

    // Simple template processing - replace {{variable}} with data values
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, String(value || 0));
    }

    // Handle conditional blocks {{#if condition}}...{{/if}}
    processed = processed.replace(/{{#if\s+(\w+)\s*>\s*(\d+)}}([\s\S]*?){{\/if}}/g, (_match, variable, threshold, content) => {
      const value = data[variable];
      return (value && Number(value) > Number(threshold)) ? content : '';
    });

    processed = processed.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (_match, variable, content) => {
      const value = data[variable];
      return (value && value !== '' && value !== null) ? content : '';
    });

    return processed.trim();
  }

  /**
   * Generate administrative follow-up questions
   */
  private generateAdministrativeFollowUps(
    _template: any,
    context: AdministrativeContext | null
  ): string[] {
    const followUps: string[] = [];

    if (context) {
      switch (context.domain) {
        case 'userManagement':
          followUps.push(
            'Berapa pengguna baru minggu ini?',
            'Siapa yang menunggu persetujuan terlama?',
            'Bagaimana trend registrasi pengguna?'
          );
          break;
        case 'applicationProcessing':
          followUps.push(
            'Apa jenis pengajuan yang paling banyak?',
            'Berapa lama rata-rata proses pengajuan?',
            'Ada pengajuan yang tertunda?'
          );
          break;
        case 'recordManagement':
          followUps.push(
            'Berapa record yang perlu divalidasi?',
            'Apa jenis kesalahan yang sering terjadi?',
            'Bagaimana efisiensi proses koreksi?'
          );
          break;
        case 'systemOperations':
          followUps.push(
            'Bagaimana performa sistem hari ini?',
            'Ada dokumen yang perlu diperbarui?',
            'Bagaimana aktivitas sistem minggu ini?'
          );
          break;
      }
    }

    return followUps.slice(0, 3);
  }

  /**
   * Map complexity levels between different systems
   */
  private mapComplexity(complexity: string): "basic" | "intermediate" | "advanced" {
    switch (complexity) {
      case 'basic':
        return 'basic';
      case 'medium':
        return 'intermediate';
      case 'high':
        return 'advanced';
      default:
        return 'intermediate';
    }
  }

  /**
   * Try advanced analytics queries for comprehensive insights
   */
  private async tryAdvancedAnalytics(
    query: string,
    _context: AdministrativeContext | null
  ): Promise<EnhancedQueryResult | null> {
    try {
      const queryLower = query.toLowerCase();

      // Check for comprehensive analytics keywords
      const analyticsKeywords = [
        'analisis', 'insight', 'trend', 'performa', 'efisiensi',
        'dashboard', 'laporan', 'statistik', 'overview', 'ringkasan'
      ];

      const hasAnalyticsKeyword = analyticsKeywords.some(keyword =>
        queryLower.includes(keyword)
      );

      if (!hasAnalyticsKeyword) {
        return null;
      }

      // Check for workflow analysis keywords
      const workflowKeywords = [
        'workflow', 'proses', 'alur', 'tahapan', 'status', 'bottleneck'
      ];

      const hasWorkflowKeyword = workflowKeywords.some(keyword =>
        queryLower.includes(keyword)
      );

      if (hasWorkflowKeyword) {
        console.log('Processing workflow intelligence query');
        const workflowAnalysis = await this.workflowIntelligence.analyzeWorkflowStatus(query);

        return {
          success: true,
          data: workflowAnalysis.currentState,
          summary: this.formatWorkflowAnalysis(workflowAnalysis),
          visualizationType: 'workflow',
          schemaInsights: {
            suggestedColumns: [],
            availableAnalytics: ['Workflow Analysis', 'Bottleneck Detection'],
            tableRelationships: ['Multi-table workflow tracking'],
            dataQualityNotes: [`Performance: ${workflowAnalysis.performanceMetrics.successRate}% success rate`]
          },
          proactiveInsights: [{
            type: 'workflow',
            title: `Analisis Workflow ${workflowAnalysis.context.type}`,
            description: `${workflowAnalysis.context.stage} - Priority: ${workflowAnalysis.context.priority}`,
            query: 'Bagaimana cara mengoptimalkan workflow ini?',
            confidence: 0.9,
            complexity: 'advanced',
            expectedValue: 'Workflow optimization recommendations'
          }],
          followUpQuestions: [
            'Apa bottleneck utama dalam workflow ini?',
            'Bagaimana cara meningkatkan efisiensi?',
            'Berapa lama estimasi penyelesaian?'
          ],
          queryOptimizations: []
        };
      }

      // Check for comprehensive analytics
      if (queryLower.includes('insight') || queryLower.includes('analisis komprehensif') ||
          queryLower.includes('dashboard') || queryLower.includes('overview')) {

        console.log('Processing comprehensive analytics query');
        const comprehensiveInsights = await this.crossTableAnalytics.generateAdministrativeInsights();

        return {
          success: true,
          data: [comprehensiveInsights],
          summary: this.formatComprehensiveInsights(comprehensiveInsights),
          visualizationType: 'dashboard',
          schemaInsights: {
            suggestedColumns: [],
            availableAnalytics: ['Cross-table Analytics', 'Trend Analysis', 'Performance Metrics'],
            tableRelationships: ['All administrative tables'],
            dataQualityNotes: [
              `Data Quality: ${comprehensiveInsights.dataQuality.completeness}% complete`,
              `Accuracy: ${comprehensiveInsights.dataQuality.accuracy}%`
            ]
          },
          proactiveInsights: [{
            type: 'comprehensive',
            title: 'Insight Administratif Komprehensif',
            description: 'Analisis mendalam across semua domain administratif',
            query: 'Bagaimana performa sistem secara keseluruhan?',
            confidence: 0.95,
            complexity: 'advanced',
            expectedValue: 'Complete administrative system analysis'
          }],
          followUpQuestions: [
            'Bagaimana trend engagement pengguna?',
            'Apa area yang perlu diperbaiki?',
            'Bagaimana efisiensi validasi?'
          ],
          queryOptimizations: []
        };
      }

      return null;

    } catch (error) {
      console.error('Error in advanced analytics processing:', error);
      return null;
    }
  }

  /**
   * Format workflow analysis for display
   */
  private formatWorkflowAnalysis(analysis: any): string {
    let formatted = `🔄 **Analisis Workflow: ${analysis.context.type}**\n\n`;

    formatted += `**Konteks:**\n`;
    formatted += `• Stage: ${analysis.context.stage}\n`;
    formatted += `• Priority: ${analysis.context.priority}\n`;
    formatted += `• Estimasi: ${analysis.context.estimatedCompletion}\n\n`;

    if (analysis.currentState.length > 0) {
      formatted += `**Status Workflow Aktif:**\n`;
      analysis.currentState.slice(0, 5).forEach((state: any) => {
        formatted += `• ${state.workflowType}: ${state.currentStage} (${state.progress}%)\n`;
      });
      formatted += '\n';
    }

    if (analysis.nextSteps.length > 0) {
      formatted += `**Langkah Selanjutnya:**\n`;
      analysis.nextSteps.forEach((step: string) => {
        formatted += `• ${step}\n`;
      });
      formatted += '\n';
    }

    if (analysis.recommendations.length > 0) {
      formatted += `**Rekomendasi:**\n`;
      analysis.recommendations.forEach((rec: string) => {
        formatted += `• ${rec}\n`;
      });
    }

    formatted += `\n📊 **Metrik Performa:**\n`;
    formatted += `• Rata-rata penyelesaian: ${analysis.performanceMetrics.averageCompletionTime} hari\n`;
    formatted += `• Success rate: ${analysis.performanceMetrics.successRate}%\n`;

    return formatted;
  }

  /**
   * Format comprehensive insights for display
   */
  private formatComprehensiveInsights(insights: any): string {
    let formatted = `📊 **Insight Administratif Komprehensif**\n\n`;

    // User Engagement Summary
    if (insights.userEngagement.length > 0) {
      formatted += `**👥 Engagement Pengguna:**\n`;
      const topUsers = insights.userEngagement.slice(0, 3);
      topUsers.forEach((user: any) => {
        formatted += `• ${user.userName}: ${user.totalPengajuan} pengajuan, ${user.totalAktivitas} aktivitas\n`;
      });
      formatted += '\n';
    }

    // Application Trends Summary
    if (insights.applicationTrends.length > 0) {
      formatted += `**📈 Trend Pengajuan:**\n`;
      const recentTrends = insights.applicationTrends.slice(0, 3);
      recentTrends.forEach((trend: any) => {
        formatted += `• ${trend.bulan}: ${trend.totalPengajuan} pengajuan (${trend.trendDirection})\n`;
      });
      formatted += '\n';
    }

    // Validation Efficiency
    formatted += `**⚡ Efisiensi Validasi:**\n`;
    formatted += `• Total validasi: ${insights.validationEfficiency.totalValidations}\n`;
    formatted += `• Rata-rata waktu: ${insights.validationEfficiency.averageProcessingTime} hari\n`;
    formatted += `• Success rate: ${insights.validationEfficiency.successRate}%\n`;
    formatted += `• Efficiency score: ${insights.validationEfficiency.efficiencyScore}/100\n\n`;

    // System Performance
    formatted += `**🏥 Performa Sistem:**\n`;
    formatted += `• Overall health: ${insights.systemPerformance.overallHealth}%\n`;
    formatted += `• User activity: ${insights.systemPerformance.userActivityLevel}\n`;
    formatted += `• Application volume: ${insights.systemPerformance.applicationVolume}\n`;
    formatted += `• Error rate: ${insights.systemPerformance.errorRate}%\n\n`;

    // Recommendations
    if (insights.systemPerformance.systemRecommendations.length > 0) {
      formatted += `**💡 Rekomendasi Sistem:**\n`;
      insights.systemPerformance.systemRecommendations.forEach((rec: string) => {
        formatted += `• ${rec}\n`;
      });
      formatted += '\n';
    }

    // Data Quality
    formatted += `**📋 Kualitas Data:**\n`;
    formatted += `• Completeness: ${insights.dataQuality.completeness}%\n`;
    formatted += `• Accuracy: ${insights.dataQuality.accuracy}%\n`;
    formatted += `• Timeliness: ${insights.dataQuality.timeliness}%\n`;

    return formatted;
  }

  /**
   * Generate enhanced summary with business context
   */
  private generateEnhancedSummary(data: any[], enhancedQuery: any, businessContext: any): string {
    const count = data.length > 0 ? data[0].count || data.length : 0;
    const tableName = businessContext.tableName;

    let summary = `📊 **${this.getTableDisplayName(tableName)}**\n\n`;
    summary += `**Data Terkini:**\n`;
    summary += `• Total Record: ${count}\n`;

    // Add business context
    if (businessContext.conditions.length > 0) {
      summary += `• Filter: ${businessContext.conditions.map((c: any) => c.businessMeaning).join(', ')}\n`;
    }

    if (businessContext.timeframe) {
      summary += `• Periode: ${businessContext.timeframe.businessContext}\n`;
    }

    summary += `\n**Penjelasan:**\n${enhancedQuery.businessExplanation}`;

    return summary;
  }

  /**
   * Determine visualization type based on business context
   */
  private determineVisualizationTypeFromContext(businessContext: any): "table" | "chart" | "stats" | "workflow" | "dashboard" {
    if (businessContext.aggregations.some((agg: any) => agg.function === 'COUNT')) {
      return 'stats';
    }
    if (businessContext.timeframe) {
      return 'chart';
    }
    return 'table';
  }

  /**
   * Get available analytics for a table
   */
  private getAvailableAnalytics(tableName: string): string[] {
    const analytics = [
      `Analisis trend ${tableName}`,
      `Distribusi status ${tableName}`,
      `Performa pemrosesan ${tableName}`
    ];
    return analytics;
  }

  /**
   * Get related tables for a table
   */
  private getRelatedTables(tableName: string): string[] {
    const relations: Record<string, string[]> = {
      'pengajuan_bulanan': ['profiles', 'dokumentasi'],
      'salah_rekam': ['profiles', 'adjudicate_record'],
      'profiles': ['pengajuan_bulanan', 'aktivitas_user']
    };
    return relations[tableName] || [];
  }

  /**
   * Get display name for table
   */
  private getTableDisplayName(tableName: string): string {
    const displayNames: Record<string, string> = {
      'pengajuan_bulanan': 'Pengajuan Bulanan',
      'salah_rekam': 'Salah Rekam',
      'profiles': 'Profil Pengguna',
      'aktivitas_user': 'Aktivitas User'
    };
    return displayNames[tableName] || tableName;
  }

  /**
   * Get current time of day for persona context
   */
  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 15) return 'afternoon';
    if (hour >= 15 && hour < 19) return 'evening';
    return 'night';
  }
}

// Export singleton instance
export const enhancedQueryIntelligence = EnhancedQueryIntelligence.getInstance();
