import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/pending-users
 * 
 * Retrieves all pending users for admin review and approval.
 * This is a secure API route that:
 * 1. Validates user authentication via their token
 * 2. Calls the Go backend /admin/pending-users endpoint
 * 3. Returns filtered data without sensitive fields
 * 
 * Only accessible to admin users (verified by Go backend)
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
        const goBackendUrl = process.env.NEXT_PUBLIC_GO_BACKEND_URL || 'http://localhost:8080';

        // Call the Go backend admin endpoint
        const response = await fetch(
            `${goBackendUrl}/admin/pending-users`,
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

            // Log other errors
            console.error('Go backend error:', {
                status: response.status,
                error: errorData
            });

            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to retrieve pending users'
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
