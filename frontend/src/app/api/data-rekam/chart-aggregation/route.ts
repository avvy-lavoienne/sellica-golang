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

        // Return backend aggregation data directly
        // Backend returns per-table monthly/yearly aggregation:
        // MonthlyData: [{year, month, adjudicate_record, duplicate_operator, salah_rekam, pengajuan_bulanan}, ...]
        // YearlyData: [{year, adjudicate_record, duplicate_operator, salah_rekam, pengajuan_bulanan}, ...]
        
        const monthlyData = backendData.MonthlyData || [];
        const yearlyData = backendData.YearlyData || [];

        console.log('[chart-aggregation] Backend data received:', {
            monthlyCount: monthlyData.length,
            yearlyCount: yearlyData.length,
            firstMonthly: monthlyData[0],
            firstYearly: yearlyData[0],
        });

        const responseData = {
            monthly_data: monthlyData,
            yearly_data: yearlyData,
        };

        return NextResponse.json({
            success: true,
            data: responseData
        }, { status: 200 });

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
