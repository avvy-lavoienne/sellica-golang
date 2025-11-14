import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/approve-user
 * 
 * Approves a pending user registration and creates their profile.
 * This is a secure API route that:
 * 1. Validates user authentication via their token
 * 2. Calls the Go backend /admin/approve-user endpoint
 * 3. Returns success/failure response
 * 
 * Only accessible to admin users (verified by Go backend)
 * 
 * Request body: { pending_user_id: string }
 */
export async function POST(request: NextRequest) {
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

        // Parse request body
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid request body'
                },
                { status: 400 }
            );
        }

        // Validate required fields
        if (!body.pending_user_id) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'pending_user_id is required'
                },
                { status: 400 }
            );
        }

        // Get the Go backend URL
        const goBackendUrl = process.env.NEXT_PUBLIC_GO_BACKEND_URL || 'http://localhost:8080';

        // Call the Go backend admin endpoint
        const response = await fetch(
            `${goBackendUrl}/admin/approve-user`,
            {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(body),
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
                        error: errorData.error || 'Unauthorized'
                    },
                    { status: response.status }
                );
            }

            // Pass through other errors
            return NextResponse.json(
                {
                    success: false,
                    error: errorData.error || 'Failed to approve user'
                },
                { status: response.status }
            );
        }

        // Success response
        const data = await response.json();
        return NextResponse.json(
            {
                success: true,
                data: data
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error in approve-user route:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error'
            },
            { status: 500 }
        );
    }
}
