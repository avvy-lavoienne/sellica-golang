import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/data-rekam/chart-aggregation
 * 
 * Retrieves aggregated time-series data specifically for chart visualization.
 * This route is separate from dashboard-stats to avoid affecting card data.
 * 
 * Query Parameters:
 * - start_date: Filter by start date (YYYY-MM-DD, optional)
 * - end_date: Filter by end date (YYYY-MM-DD, optional)
 * 
 * Response includes aggregated monthly and yearly data:
 * - monthly_data: Array of {year, month, count} for all records
 * - yearly_data: Array of {year, count} for all records
 */
export async function GET(request: NextRequest) {
    try {
        // Get authorization token from request headers
        const authHeader = request.headers.get('authorization');
        
        if (!authHeader) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Authentication required'
                },
                { status: 401 }
            );
        }

        // Get the Go backend URL
        const goBackendUrl = process.env.NEXT_PUBLIC_GO_BACKEND_URL || 'http://localhost:8081';

        // Forward query parameters to Go backend
        const searchParams = request.nextUrl.searchParams;
        const queryString = searchParams.toString();

        // Call the Go backend data-rekam endpoint for aggregated stats
        const response = await fetch(
            `${goBackendUrl}/data-rekam/dashboard-stats${queryString ? '?' + queryString : ''}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            }
        );

        // Check if response is okay
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            // Pass through authentication errors (401, 403)
            if (response.status === 401 || response.status === 403) {
                return NextResponse.json(
                    {
                        success: false,
                        error: errorData.error || 'Authentication failed'
                    },
                    { status: response.status }
                );
            }

            console.error('Go backend error:', {
                status: response.status,
                error: errorData
            });

            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to retrieve chart aggregation data'
                },
                { status: response.status }
            );
        }

        // Parse successful response from Go backend
        const response_data = await response.json();

        // Backend returns wrapped response: { success: true, data: { MonthlyData, YearlyData, ... } }
        const backendData = response_data.data || response_data;

        console.log('[chart-aggregation] Backend response data:', {
            hasMonthlyData: !!backendData.MonthlyData,
            monthlyDataCount: backendData.MonthlyData?.length || 0,
            hasYearlyData: !!backendData.YearlyData,
            yearlyDataCount: backendData.YearlyData?.length || 0,
            fullData: response_data,
        });

        const monthlyData = backendData.MonthlyData || [];
        const yearlyData = backendData.YearlyData || [];

        console.log('[chart-aggregation] Backend data received:', {
            monthlyCount: monthlyData.length,
            yearlyCount: yearlyData.length,
            firstMonthly: monthlyData[0],
            firstYearly: yearlyData[0],
        });

        // Transform backend per-table aggregated data into chartData format
        // Backend format: [{year, month, adjudicate_record, duplicate_operator, salah_rekam, pengajuan_bulanan}, ...]
        // We need to transform into individual items for prepareChartData to process
        
        const tableNames = [
            { key: 'adjudicate_record', display: 'Adjudicate Record' },
            { key: 'duplicate_operator', display: 'Duplicate Operator' },
            { key: 'salah_rekam', display: 'Salah Rekam' },
            { key: 'pengajuan_bulanan', display: 'Pengajuan Bulanan' },
        ];

        try {
            // Build chartData array - each table becomes an array of items
            const chartData = tableNames.map((table) => {
                try {
                    // Create individual items for each month/table count
                    const tableData = monthlyData
                        .flatMap((row: any) => {
                            try {
                                const count = parseInt(row[table.key]) || 0;
                                const year = parseInt(row.year) || 2024;
                                const month = parseInt(row.month) || 1;
                                
                                // Validate ranges
                                if (month < 1 || month > 12) {
                                    console.warn(`[chart-aggregation] Invalid month ${month} for year ${year}, skipping`);
                                    return [];
                                }
                                
                                // Create synthetic items with created_at timestamp
                                const items = [];
                                for (let i = 0; i < count; i++) {
                                    items.push({
                                        created_at: new Date(year, month - 1, 15).toISOString(),
                                        table: table.key,
                                    });
                                }
                                return items;
                            } catch (rowError) {
                                console.error(`[chart-aggregation] Error processing row for table ${table.key}:`, rowError, row);
                                return [];
                            }
                        });
                    
                    return {
                        table_name: table.key,
                        data: tableData,
                    };
                } catch (tableError) {
                    console.error(`[chart-aggregation] Error processing table ${table.key}:`, tableError);
                    return {
                        table_name: table.key,
                        data: [],
                    };
                }
            });

            const responseData = {
                chartData: chartData,
                monthly_data: monthlyData,
                yearly_data: yearlyData,
            };

            console.log('[chart-aggregation] Transformed data:', {
                chartDataLength: chartData.length,
                totalDataPoints: chartData.reduce((sum: number, cat: any) => sum + (cat.data?.length || 0), 0),
                tables: chartData.map((cat: any) => ({ name: cat.table_name, count: cat.data?.length || 0 })),
            });

            return NextResponse.json({
                success: true,
                data: responseData
            }, { status: 200 });
        } catch (transformError) {
            console.error('[chart-aggregation] Transformation error:', transformError);
            // Return raw aggregated data as fallback
            return NextResponse.json({
                success: true,
                data: {
                    chartData: [],
                    monthly_data: monthlyData,
                    yearly_data: yearlyData,
                }
            }, { status: 200 });
        }

    } catch (error) {
        console.error('API route error:', error);
        
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            },
            { status: 500 }
        );
    }
}
