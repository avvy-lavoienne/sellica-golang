/**
 * Temporal Intelligence Engine for SELLY Chatbot
 * Handles date parsing, temporal queries, and time-based analysis
 */

export interface DateRange {
  startDate: Date;
  endDate: Date;
  description: string;
  type: 'absolute' | 'relative' | 'calculated';
}

export interface TemporalCondition {
  type: 'duration' | 'comparison' | 'status';
  operator: 'greater_than' | 'less_than' | 'equal' | 'between';
  value: number | string;
  unit: 'days' | 'weeks' | 'months' | 'years' | 'status';
  description: string;
}

export interface RelativeDateType {
  period: 'day' | 'week' | 'month' | 'year';
  offset: number; // -1 for "last", 0 for "this", 1 for "next"
  description: string;
}

export interface TemporalQueryResult {
  dateRange?: DateRange;
  conditions?: TemporalCondition[];
  aggregationType?: 'count' | 'list' | 'breakdown' | 'analytics';
  targetUsers?: boolean;
  queryType: 'temporal_aggregation' | 'temporal_filter' | 'temporal_analysis';
}

export class TemporalIntelligence {
  
  /**
   * Indonesian month names mapping
   */
  private static readonly INDONESIAN_MONTHS = {
    'januari': 0, 'jan': 0,
    'februari': 1, 'feb': 1,
    'maret': 2, 'mar': 2,
    'april': 3, 'apr': 3,
    'mei': 4,
    'juni': 5, 'jun': 5,
    'juli': 6, 'jul': 6,
    'agustus': 7, 'ags': 7,
    'september': 8, 'sep': 8,
    'oktober': 9, 'okt': 9,
    'november': 10, 'nov': 10,
    'desember': 11, 'des': 11
  };

  /**
   * Relative date patterns in Indonesian
   */
  private static readonly RELATIVE_PATTERNS = {
    'hari ini': { period: 'day', offset: 0 },
    'kemarin': { period: 'day', offset: -1 },
    'besok': { period: 'day', offset: 1 },
    'minggu ini': { period: 'week', offset: 0 },
    'minggu lalu': { period: 'week', offset: -1 },
    'minggu depan': { period: 'week', offset: 1 },
    'bulan ini': { period: 'month', offset: 0 },
    'bulan lalu': { period: 'month', offset: -1 },
    'bulan depan': { period: 'month', offset: 1 },
    'tahun ini': { period: 'year', offset: 0 },
    'tahun lalu': { period: 'year', offset: -1 },
    'tahun depan': { period: 'year', offset: 1 }
  };

  /**
   * Duration patterns for temporal conditions
   */
  private static readonly DURATION_PATTERNS = {
    'lebih dari': 'greater_than',
    'kurang dari': 'less_than',
    'selama': 'equal',
    'sudah': 'greater_than',
    'belum': 'less_than',
    'masih': 'greater_than',
    'melebihi': 'greater_than',
    'di atas': 'greater_than',
    'di bawah': 'less_than',
    'sekitar': 'equal',
    'hampir': 'equal'
  };

  /**
   * Parse temporal query and extract date ranges and conditions
   */
  public static parseTemporalQuery(query: string): TemporalQueryResult | null {
    const lowerQuery = query.toLowerCase();
    console.log('🕐 [TEMPORAL] Parsing temporal query:', query);
    console.log('🕐 [TEMPORAL] Lower query:', lowerQuery);

    // Check if this is a temporal query
    const isTemporalResult = this.isTemporalQuery(lowerQuery);
    console.log('🕐 [TEMPORAL] Is temporal query result:', isTemporalResult);

    if (!isTemporalResult) {
      console.log('❌ [TEMPORAL] Not a temporal query');
      return null;
    }

    console.log('✅ [TEMPORAL] Confirmed as temporal query, proceeding with parsing...');

    const result: TemporalQueryResult = {
      queryType: this.determineQueryType(lowerQuery)
    };

    console.log('🕐 [TEMPORAL] Query type determined:', result.queryType);

    // Parse date ranges
    const dateRange = this.parseDateRange(lowerQuery);
    if (dateRange) {
      result.dateRange = dateRange;
      console.log('✅ [TEMPORAL] Found date range:', dateRange.description);
    } else {
      console.log('⚠️ [TEMPORAL] No date range found');
    }

    // Parse temporal conditions
    const conditions = this.parseTemporalConditions(lowerQuery);
    if (conditions.length > 0) {
      result.conditions = conditions;
      console.log('✅ [TEMPORAL] Found conditions:', conditions.map(c => c.description));
    } else {
      console.log('⚠️ [TEMPORAL] No temporal conditions found');
    }

    // Determine aggregation type
    result.aggregationType = this.determineAggregationType(lowerQuery);
    console.log('🕐 [TEMPORAL] Aggregation type:', result.aggregationType);

    // Check if targeting users
    result.targetUsers = this.isUserAggregationQuery(lowerQuery);
    console.log('🕐 [TEMPORAL] Target users:', result.targetUsers);

    console.log('🎯 [TEMPORAL] Final parsed result:', result);

    // Even if we don't find specific date ranges or conditions,
    // if it's a temporal query, we should still return a result
    return result;
  }

  /**
   * Check if query contains temporal patterns
   */
  private static isTemporalQuery(query: string): boolean {
    const temporalKeywords = [
      // Time periods
      'bulan', 'minggu', 'hari', 'tahun', 'tanggal',
      // Month names
      'januari', 'februari', 'maret', 'april', 'mei', 'juni',
      'juli', 'agustus', 'september', 'oktober', 'november', 'desember',
      // Relative dates
      'hari ini', 'minggu ini', 'bulan ini', 'tahun ini',
      'minggu lalu', 'bulan lalu', 'tahun lalu', 'kemarin', 'besok',
      'minggu depan', 'bulan depan', 'tahun depan',
      // Duration conditions
      'lebih dari', 'kurang dari', 'selama', 'sudah', 'belum', 'masih',
      'melebihi', 'di atas', 'di bawah', 'sekitar', 'hampir',
      // Temporal aggregation keywords
      'berapa', 'ada berapa', 'jumlah', 'siapa saja', 'analisis',
      'breakdown', 'tampilkan', 'lihat', 'dari', 'sampai', 'antara',
      // Status with temporal context
      'pending', 'selesai', 'proses'
    ];

    // Check for temporal keywords
    const hasTemporalKeywords = temporalKeywords.some(keyword => query.includes(keyword));

    // Check for date patterns (YYYY format)
    const hasDatePattern = /\b20\d{2}\b/.test(query);

    // Check for number + time unit patterns
    const hasNumberTimePattern = /\d+\s+(hari|minggu|bulan|tahun)/.test(query);

    // Enhanced detection for common temporal query patterns
    const hasTemporalAggregation = (query.includes('berapa') || query.includes('ada berapa')) &&
                                  (query.includes('bulan') || query.includes('minggu') || query.includes('hari'));

    // Specific pattern for "Ada berapa pengajuan ... di bulan ..."
    const hasMonthlyAggregationPattern = /ada berapa.*di bulan/i.test(query) ||
                                        /berapa.*bulan/i.test(query);

    console.log(`🕐 [TEMPORAL_CHECK] Query: "${query}"`);
    console.log(`🕐 [TEMPORAL_CHECK] Has temporal keywords: ${hasTemporalKeywords}`);
    console.log(`🕐 [TEMPORAL_CHECK] Has date pattern: ${hasDatePattern}`);
    console.log(`🕐 [TEMPORAL_CHECK] Has number+time pattern: ${hasNumberTimePattern}`);
    console.log(`🕐 [TEMPORAL_CHECK] Has temporal aggregation: ${hasTemporalAggregation}`);
    console.log(`🕐 [TEMPORAL_CHECK] Has monthly aggregation pattern: ${hasMonthlyAggregationPattern}`);

    const isTemporal = hasTemporalKeywords || hasDatePattern || hasNumberTimePattern ||
                      hasTemporalAggregation || hasMonthlyAggregationPattern;
    console.log(`🕐 [TEMPORAL_CHECK] Is temporal query: ${isTemporal}`);

    return isTemporal;
  }

  /**
   * Determine the type of temporal query
   */
  private static determineQueryType(query: string): 'temporal_aggregation' | 'temporal_filter' | 'temporal_analysis' {
    if (query.includes('berapa') || query.includes('jumlah') || query.includes('ada berapa')) {
      return 'temporal_aggregation';
    } else if (query.includes('siapa') || query.includes('yang') || query.includes('mana')) {
      return 'temporal_filter';
    } else {
      return 'temporal_analysis';
    }
  }

  /**
   * Parse date ranges from query
   */
  private static parseDateRange(query: string): DateRange | null {
    // Try relative dates first
    const relativeDate = this.parseRelativeDate(query);
    if (relativeDate) {
      return this.convertRelativeDateToRange(relativeDate);
    }

    // Try absolute dates
    const absoluteDate = this.parseAbsoluteDate(query);
    if (absoluteDate) {
      return absoluteDate;
    }

    return null;
  }

  /**
   * Parse relative dates (bulan ini, minggu lalu, etc.)
   */
  private static parseRelativeDate(query: string): RelativeDateType | null {
    for (const [pattern, config] of Object.entries(this.RELATIVE_PATTERNS)) {
      if (query.includes(pattern)) {
        return {
          period: config.period as any,
          offset: config.offset,
          description: pattern
        };
      }
    }

    return null;
  }

  /**
   * Parse absolute dates (maret 2025, januari sampai maret, etc.)
   */
  private static parseAbsoluteDate(query: string): DateRange | null {
    console.log('🕐 [TEMPORAL] Parsing absolute date from:', query);

    // Enhanced patterns for month-year detection
    const patterns = [
      // Pattern: "bulan maret 2025" or "di bulan maret 2025"
      /(?:di\s+)?bulan\s+(\w+)\s+(\d{4})/i,
      // Pattern: "maret 2025" (direct month year)
      /\b(\w+)\s+(\d{4})\b/i,
      // Pattern: "di maret 2025"
      /di\s+(\w+)\s+(\d{4})/i
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      console.log('🕐 [TEMPORAL] Testing pattern:', pattern, 'Match:', match);

      if (match) {
        const monthName = match[1].toLowerCase();
        const year = parseInt(match[2]);

        console.log('🕐 [TEMPORAL] Found month:', monthName, 'year:', year);
        console.log('🕐 [TEMPORAL] Available months:', Object.keys(this.INDONESIAN_MONTHS));

        if ((this.INDONESIAN_MONTHS as any)[monthName] !== undefined) {
          const month = (this.INDONESIAN_MONTHS as any)[monthName];
          const startDate = new Date(year, month, 1);
          const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

          const result = {
            startDate,
            endDate,
            description: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`,
            type: 'absolute' as const
          };

          console.log('✅ [TEMPORAL] Successfully parsed absolute date:', result);
          return result;
        } else {
          console.log('⚠️ [TEMPORAL] Month name not recognized:', monthName);
        }
      }
    }

    // Enhanced date range patterns for Indonesian queries
    const rangePatterns = [
      // Pattern 1: "januari sampai maret 2025" (existing pattern)
      {
        pattern: /(\w+)\s+sampai\s+(\w+)\s+(\d{4})/i,
        handler: (match: RegExpMatchArray) => {
          const startMonthName = match[1].toLowerCase();
          const endMonthName = match[2].toLowerCase();
          const year = parseInt(match[3]);
          return { startMonthName, endMonthName, startYear: year, endYear: year };
        }
      },

      // Pattern 2: "maret 2025 hingga juli 2025" (NEW - main issue)
      {
        pattern: /(\w+)\s+(\d{4})\s+hingga\s+(\w+)\s+(\d{4})/i,
        handler: (match: RegExpMatchArray) => {
          const startMonthName = match[1].toLowerCase();
          const startYear = parseInt(match[2]);
          const endMonthName = match[3].toLowerCase();
          const endYear = parseInt(match[4]);
          return { startMonthName, endMonthName, startYear, endYear };
        }
      },

      // Pattern 3: "maret 2025 hingga juli" (same year assumed)
      {
        pattern: /(\w+)\s+(\d{4})\s+hingga\s+(\w+)/i,
        handler: (match: RegExpMatchArray) => {
          const startMonthName = match[1].toLowerCase();
          const year = parseInt(match[2]);
          const endMonthName = match[3].toLowerCase();
          return { startMonthName, endMonthName, startYear: year, endYear: year };
        }
      },

      // Pattern 4: "bulan maret 2025 hingga juli 2025" (with "bulan" prefix)
      {
        pattern: /bulan\s+(\w+)\s+(\d{4})\s+hingga\s+(\w+)\s+(\d{4})/i,
        handler: (match: RegExpMatchArray) => {
          const startMonthName = match[1].toLowerCase();
          const startYear = parseInt(match[2]);
          const endMonthName = match[3].toLowerCase();
          const endYear = parseInt(match[4]);
          return { startMonthName, endMonthName, startYear, endYear };
        }
      },

      // Pattern 5: "dari maret 2025 hingga juli 2025"
      {
        pattern: /dari\s+(\w+)\s+(\d{4})\s+hingga\s+(\w+)\s+(\d{4})/i,
        handler: (match: RegExpMatchArray) => {
          const startMonthName = match[1].toLowerCase();
          const startYear = parseInt(match[2]);
          const endMonthName = match[3].toLowerCase();
          const endYear = parseInt(match[4]);
          return { startMonthName, endMonthName, startYear, endYear };
        }
      },

      // Pattern 6: "maret 2025 sampai juli 2025" (sampai with year after first month)
      {
        pattern: /(\w+)\s+(\d{4})\s+sampai\s+(\w+)\s+(\d{4})/i,
        handler: (match: RegExpMatchArray) => {
          const startMonthName = match[1].toLowerCase();
          const startYear = parseInt(match[2]);
          const endMonthName = match[3].toLowerCase();
          const endYear = parseInt(match[4]);
          return { startMonthName, endMonthName, startYear, endYear };
        }
      },

      // Pattern 7: "dari maret 2025 ke juli 2025"
      {
        pattern: /dari\s+(\w+)\s+(\d{4})\s+ke\s+(\w+)\s+(\d{4})/i,
        handler: (match: RegExpMatchArray) => {
          const startMonthName = match[1].toLowerCase();
          const startYear = parseInt(match[2]);
          const endMonthName = match[3].toLowerCase();
          const endYear = parseInt(match[4]);
          return { startMonthName, endMonthName, startYear, endYear };
        }
      }
    ];

    // Test each range pattern
    for (const rangePatternObj of rangePatterns) {
      const match = query.match(rangePatternObj.pattern);
      console.log(`🕐 [TEMPORAL] Testing range pattern:`, rangePatternObj.pattern, 'Match:', match ? 'YES' : 'NO');

      if (match) {
        const { startMonthName, endMonthName, startYear, endYear } = rangePatternObj.handler(match);

        if ((this.INDONESIAN_MONTHS as any)[startMonthName] !== undefined &&
            (this.INDONESIAN_MONTHS as any)[endMonthName] !== undefined) {
          const startMonth = (this.INDONESIAN_MONTHS as any)[startMonthName];
          const endMonth = (this.INDONESIAN_MONTHS as any)[endMonthName];

          const startDate = new Date(startYear, startMonth, 1);
          const endDate = new Date(endYear, endMonth + 1, 0, 23, 59, 59, 999);

          const description = startYear === endYear ?
            `${startMonthName} hingga ${endMonthName} ${startYear}` :
            `${startMonthName} ${startYear} hingga ${endMonthName} ${endYear}`;

          const result = {
            startDate,
            endDate,
            description,
            type: 'absolute' as const
          };

          console.log('✅ [TEMPORAL] Successfully parsed date range:', result);
          return result;
        } else {
          console.log('⚠️ [TEMPORAL] Month names not recognized:', startMonthName, endMonthName);
        }
      }
    }

    return null;
  }

  /**
   * Convert relative date to date range
   */
  private static convertRelativeDateToRange(relativeDate: RelativeDateType): DateRange {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (relativeDate.period) {
      case 'day':
        startDate = new Date(now);
        startDate.setDate(now.getDate() + relativeDate.offset);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;

      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + (relativeDate.offset * 7));
        weekStart.setHours(0, 0, 0, 0);
        startDate = weekStart;
        endDate = new Date(weekStart);
        endDate.setDate(weekStart.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;

      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() + relativeDate.offset, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + relativeDate.offset + 1, 0, 23, 59, 59, 999);
        break;

      case 'year':
        startDate = new Date(now.getFullYear() + relativeDate.offset, 0, 1);
        endDate = new Date(now.getFullYear() + relativeDate.offset, 11, 31, 23, 59, 59, 999);
        break;

      default:
        startDate = new Date(now);
        endDate = new Date(now);
    }

    return {
      startDate,
      endDate,
      description: relativeDate.description,
      type: 'relative'
    };
  }

  /**
   * Parse temporal conditions (lebih dari 30 hari, etc.)
   */
  private static parseTemporalConditions(query: string): TemporalCondition[] {
    const conditions: TemporalCondition[] = [];

    // Enhanced pattern: "lebih dari 30 hari", "melebihi 1 bulan", etc.
    const durationPattern = /(lebih dari|kurang dari|selama|sudah|belum|masih|melebihi|di atas|di bawah|sekitar|hampir)\s+(\d+)\s+(hari|minggu|bulan|tahun)/gi;
    let match;

    while ((match = durationPattern.exec(query)) !== null) {
      const operator = (this.DURATION_PATTERNS as any)[match[1].toLowerCase()];
      const value = parseInt(match[2]);
      const unit = match[3] as any;

      if (operator) {
        conditions.push({
          type: 'duration',
          operator: operator as any,
          value,
          unit,
          description: `${match[1]} ${value} ${unit}`
        });
      }
    }

    // Additional pattern for status conditions
    if (query.includes('pending') || query.includes('belum selesai') || query.includes('masih proses')) {
      conditions.push({
        type: 'status',
        operator: 'equal',
        value: 'pending',
        unit: 'status',
        description: 'status pending'
      });
    }

    if (query.includes('selesai') || query.includes('completed') || query.includes('ready')) {
      conditions.push({
        type: 'status',
        operator: 'equal',
        value: 'completed',
        unit: 'status',
        description: 'status selesai'
      });
    }

    return conditions;
  }

  /**
   * Determine aggregation type
   */
  private static determineAggregationType(query: string): 'count' | 'list' | 'breakdown' | 'analytics' {
    if (query.includes('berapa') || query.includes('jumlah') || query.includes('ada berapa')) {
      return 'count';
    } else if (query.includes('siapa') || query.includes('tampilkan') || query.includes('lihat')) {
      return 'list';
    } else if (query.includes('breakdown') || query.includes('detail') || query.includes('analisis')) {
      return 'breakdown';
    } else {
      return 'analytics';
    }
  }

  /**
   * Check if query is asking for user aggregation
   */
  private static isUserAggregationQuery(query: string): boolean {
    return query.includes('siapa') || 
           query.includes('user') || 
           query.includes('pengguna') ||
           query.includes('pengaju');
  }

  /**
   * Get current date context for relative calculations
   */
  public static getCurrentDateContext() {
    const now = new Date();
    return {
      currentDate: now,
      currentMonth: now.getMonth(),
      currentYear: now.getFullYear(),
      currentWeek: this.getWeekNumber(now),
      timezone: 'Asia/Jakarta'
    };
  }

  /**
   * Get week number of the year
   */
  private static getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
}
