import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/data-rekam/adjudicate
 * 
 * Retrieves adjudicate record list with authorization.
 * This is a secure API route that:
 * 1. Validates user authentication via their token
 * 2. Passes query parameters to Go backend
 * 3. Handles authorization checks server-side
 * 4. Returns paginated filtered results
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - page_size: Results per page (default: 10, max: 100)
 * - status: Filter by status (all, completed, pending)
 * - search: Text search query
 * - start_date: Filter by start date (YYYY-MM-DD)
 * - end_date: Filter by end date (YYYY-MM-DD)
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

        // Call the Go backend data-rekam endpoint
        const response = await fetch(
            `${goBackendUrl}/data-rekam/adjudicate${queryString ? '?' + queryString : ''}`,
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
                    error: 'Failed to retrieve adjudicate records'
                },
                { status: response.status }
            );
        }

        // Parse successful response from Go backend
        const data = await response.json();

        // Return the data to the frontend
        return NextResponse.json(data, { status: 200 });

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
