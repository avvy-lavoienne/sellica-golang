/**
 * Comprehensive Test Suite for Temporal Intelligence
 * Tests Indonesian date parsing, temporal conditions, and edge cases
 */

import { TemporalIntelligence, TemporalQueryResult, TemporalCondition, DateRange } from '../temporalIntelligence';

describe('TemporalIntelligence', () => {
  describe('Indonesian Date Parsing', () => {
    describe('Absolute Date Recognition', () => {
      test('should parse Indonesian month names correctly', () => {
        const queries = [
          { query: 'data januari 2024', expected: { month: 0, year: 2024 } },
          { query: 'pengajuan februari 2024', expected: { month: 1, year: 2024 } },
          { query: 'laporan maret 2024', expected: { month: 2, year: 2024 } },
          { query: 'statistik april 2024', expected: { month: 3, year: 2024 } },
          { query: 'data mei 2024', expected: { month: 4, year: 2024 } },
          { query: 'pengajuan juni 2024', expected: { month: 5, year: 2024 } },
          { query: 'laporan juli 2024', expected: { month: 6, year: 2024 } },
          { query: 'data agustus 2024', expected: { month: 7, year: 2024 } },
          { query: 'pengajuan september 2024', expected: { month: 8, year: 2024 } },
          { query: 'laporan oktober 2024', expected: { month: 9, year: 2024 } },
          { query: 'data november 2024', expected: { month: 10, year: 2024 } },
          { query: 'pengajuan desember 2024', expected: { month: 11, year: 2024 } }
        ];

        queries.forEach(({ query, expected }) => {
          const result = TemporalIntelligence.parseTemporalQuery(query);
          expect(result).toBeTruthy();
          expect(result?.dateRange).toBeTruthy();
          expect(result?.dateRange?.startDate.getMonth()).toBe(expected.month);
          expect(result?.dateRange?.startDate.getFullYear()).toBe(expected.year);
        });
      });

      test('should parse abbreviated Indonesian month names', () => {
        const queries = [
          { query: 'data jan 2024', expected: { month: 0, year: 2024 } },
          { query: 'pengajuan feb 2024', expected: { month: 1, year: 2024 } },
          { query: 'laporan mar 2024', expected: { month: 2, year: 2024 } },
          { query: 'statistik apr 2024', expected: { month: 3, year: 2024 } },
          { query: 'pengajuan jun 2024', expected: { month: 5, year: 2024 } },
          { query: 'laporan jul 2024', expected: { month: 6, year: 2024 } },
          { query: 'data ags 2024', expected: { month: 7, year: 2024 } },
          { query: 'pengajuan sep 2024', expected: { month: 8, year: 2024 } },
          { query: 'laporan okt 2024', expected: { month: 9, year: 2024 } },
          { query: 'data nov 2024', expected: { month: 10, year: 2024 } },
          { query: 'pengajuan des 2024', expected: { month: 11, year: 2024 } }
        ];

        queries.forEach(({ query, expected }) => {
          const result = TemporalIntelligence.parseTemporalQuery(query);
          expect(result).toBeTruthy();
          expect(result?.dateRange?.startDate.getMonth()).toBe(expected.month);
          expect(result?.dateRange?.startDate.getFullYear()).toBe(expected.year);
        });
      });

      test('should handle case insensitive month names', () => {
        const queries = [
          'data JANUARI 2024',
          'pengajuan Februari 2024',
          'laporan mArEt 2024',
          'statistik APRIL 2024'
        ];

        queries.forEach(query => {
          const result = TemporalIntelligence.parseTemporalQuery(query);
          expect(result).toBeTruthy();
          expect(result?.dateRange).toBeTruthy();
        });
      });
    });

    describe('Relative Date Recognition', () => {
      test('should parse relative date expressions', () => {
        const queries = [
          { query: 'data bulan ini', expected: 'this_month' },
          { query: 'pengajuan bulan lalu', expected: 'last_month' },
          { query: 'laporan minggu ini', expected: 'this_week' },
          { query: 'statistik minggu lalu', expected: 'last_week' },
          { query: 'data tahun ini', expected: 'this_year' },
          { query: 'pengajuan tahun lalu', expected: 'last_year' },
          { query: 'laporan hari ini', expected: 'today' },
          { query: 'data kemarin', expected: 'yesterday' }
        ];

        queries.forEach(({ query, expected }) => {
          const result = TemporalIntelligence.parseTemporalQuery(query);
          expect(result).toBeTruthy();
          expect(result?.dateRange).toBeTruthy();
          expect(result?.dateRange?.type).toBe('relative');
        });
      });

      test('should calculate correct date ranges for relative dates', () => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const result = TemporalIntelligence.parseTemporalQuery('data bulan ini');
        expect(result?.dateRange?.startDate.getMonth()).toBe(currentMonth);
        expect(result?.dateRange?.startDate.getFullYear()).toBe(currentYear);
        expect(result?.dateRange?.endDate.getMonth()).toBe(currentMonth);
        expect(result?.dateRange?.endDate.getFullYear()).toBe(currentYear);
      });
    });

    describe('Date Range Recognition', () => {
      test('should parse date ranges with Indonesian months', () => {
        const queries = [
          {
            query: 'data dari januari sampai maret 2024',
            expected: { startMonth: 0, endMonth: 2, year: 2024 }
          },
          {
            query: 'pengajuan dari april hingga juni 2024',
            expected: { startMonth: 3, endMonth: 5, year: 2024 }
          },
          {
            query: 'laporan dari juli sampai september 2024',
            expected: { startMonth: 6, endMonth: 8, year: 2024 }
          }
        ];

        queries.forEach(({ query, expected }) => {
          const result = TemporalIntelligence.parseTemporalQuery(query);
          expect(result).toBeTruthy();
          expect(result?.dateRange).toBeTruthy();
          expect(result?.dateRange?.startDate.getMonth()).toBe(expected.startMonth);
          expect(result?.dateRange?.endDate.getMonth()).toBe(expected.endMonth);
          expect(result?.dateRange?.startDate.getFullYear()).toBe(expected.year);
        });
      });

      test('should handle cross-year date ranges', () => {
        const result = TemporalIntelligence.parseTemporalQuery('data dari november 2023 sampai februari 2024');
        expect(result).toBeTruthy();
        expect(result?.dateRange?.startDate.getMonth()).toBe(10); // November
        expect(result?.dateRange?.startDate.getFullYear()).toBe(2023);
        expect(result?.dateRange?.endDate.getMonth()).toBe(1); // February
        expect(result?.dateRange?.endDate.getFullYear()).toBe(2024);
      });
    });
  });

  describe('Temporal Condition Parsing', () => {
    describe('Duration Conditions', () => {
      test('should parse duration conditions correctly', () => {
        const queries = [
          {
            query: 'data lebih dari 30 hari',
            expected: { operator: 'greater_than', value: 30, unit: 'hari' }
          },
          {
            query: 'pengajuan kurang dari 2 minggu',
            expected: { operator: 'less_than', value: 2, unit: 'minggu' }
          },
          {
            query: 'laporan selama 3 bulan',
            expected: { operator: 'equal', value: 3, unit: 'bulan' }
          },
          {
            query: 'data melebihi 1 tahun',
            expected: { operator: 'greater_than', value: 1, unit: 'tahun' }
          }
        ];

        queries.forEach(({ query, expected }) => {
          const result = TemporalIntelligence.parseTemporalQuery(query);
          expect(result).toBeTruthy();
          expect(result?.conditions).toBeTruthy();
          expect(result?.conditions?.length).toBeGreaterThan(0);
          
          const condition = result?.conditions?.[0];
          expect(condition?.type).toBe('duration');
          expect(condition?.value).toBe(expected.value);
        });
      });

      test('should handle multiple duration conditions', () => {
        const query = 'data lebih dari 30 hari dan kurang dari 60 hari';
        const result = TemporalIntelligence.parseTemporalQuery(query);
        
        expect(result).toBeTruthy();
        expect(result?.conditions).toBeTruthy();
        expect(result?.conditions?.length).toBe(2);
        
        const conditions = result?.conditions || [];
        expect(conditions[0].type).toBe('duration');
        expect(conditions[1].type).toBe('duration');
      });
    });

    describe('Status Conditions', () => {
      test('should parse status conditions correctly', () => {
        const queries = [
          { query: 'data yang masih pending', expected: 'pending' },
          { query: 'pengajuan yang belum selesai', expected: 'pending' },
          { query: 'laporan yang sudah selesai', expected: 'completed' },
          { query: 'data yang ready', expected: 'completed' }
        ];

        queries.forEach(({ query, expected }) => {
          const result = TemporalIntelligence.parseTemporalQuery(query);
          expect(result).toBeTruthy();
          expect(result?.conditions).toBeTruthy();
          
          const statusCondition = result?.conditions?.find(c => c.type === 'status');
          expect(statusCondition).toBeTruthy();
          expect(statusCondition?.value).toBe(expected);
          expect(statusCondition?.unit).toBe('status');
        });
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle invalid month names gracefully', () => {
      const queries = [
        'data invalidmonth 2024',
        'pengajuan xyz 2024',
        'laporan 13bulan 2024'
      ];

      queries.forEach(query => {
        const result = TemporalIntelligence.parseTemporalQuery(query);
        // Should either return null or handle gracefully without throwing
        expect(() => TemporalIntelligence.parseTemporalQuery(query)).not.toThrow();
      });
    });

    test('should handle malformed date queries', () => {
      const queries = [
        '',
        '   ',
        'data',
        'pengajuan 2024',
        'laporan bulan',
        'statistik dari sampai'
      ];

      queries.forEach(query => {
        expect(() => TemporalIntelligence.parseTemporalQuery(query)).not.toThrow();
      });
    });

    test('should handle future dates appropriately', () => {
      const futureYear = new Date().getFullYear() + 2;
      const query = `data januari ${futureYear}`;
      const result = TemporalIntelligence.parseTemporalQuery(query);
      
      expect(result).toBeTruthy();
      expect(result?.dateRange?.startDate.getFullYear()).toBe(futureYear);
    });

    test('should handle very old dates', () => {
      const query = 'data januari 1900';
      const result = TemporalIntelligence.parseTemporalQuery(query);
      
      expect(result).toBeTruthy();
      expect(result?.dateRange?.startDate.getFullYear()).toBe(1900);
    });
  });

  describe('Query Type Classification', () => {
    test('should classify temporal query types correctly', () => {
      const queries = [
        {
          query: 'berapa pengajuan bulan ini',
          expected: 'temporal_aggregation'
        },
        {
          query: 'tampilkan data januari 2024',
          expected: 'temporal_filter'
        },
        {
          query: 'analisis trend pengajuan 6 bulan terakhir',
          expected: 'temporal_analysis'
        }
      ];

      queries.forEach(({ query, expected }) => {
        const result = TemporalIntelligence.parseTemporalQuery(query);
        expect(result).toBeTruthy();
        expect(result?.queryType).toBe(expected);
      });
    });
  });

  describe('Performance Tests', () => {
    test('should parse temporal queries within performance threshold', () => {
      const query = 'berapa pengajuan dari januari sampai desember 2024 yang lebih dari 30 hari dan masih pending';
      
      const startTime = performance.now();
      const result = TemporalIntelligence.parseTemporalQuery(query);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      
      expect(result).toBeTruthy();
      expect(processingTime).toBeLessThan(100); // Should complete within 100ms
    });

    test('should handle concurrent parsing requests', async () => {
      const queries = [
        'data bulan ini',
        'pengajuan minggu lalu',
        'laporan januari 2024',
        'statistik lebih dari 30 hari',
        'data yang masih pending'
      ];

      const promises = queries.map(query => 
        Promise.resolve(TemporalIntelligence.parseTemporalQuery(query))
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeTruthy();
      });
    });
  });
});
