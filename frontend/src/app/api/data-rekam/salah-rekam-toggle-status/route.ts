import { NextRequest, NextResponse } from 'next/server';

/**
 * PATCH /api/data-rekam/salah-rekam-toggle-status
 * 
 * Toggles the is_ready_to_record status for a salah rekam record.
 * Only admin or superuser roles are allowed.
 * 
 * Request Body:
 * {
 *   id: string,
 *   is_ready_to_record: boolean
 * }
 * 
 * Authorization: Bearer <JWT_TOKEN>
 */
export async function PATCH(request: NextRequest) {
  try {
    const { id, is_ready_to_record } = await request.json();

    // Validate request body
    if (!id || typeof is_ready_to_record !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, is_ready_to_record' },
        { status: 400 }
      );
    }

    // Extract JWT token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    // Validate token format
    if (!token.startsWith('eyJ')) {
      console.error('[SalahRekamToggleStatus] Invalid token format detected');
      return NextResponse.json(
        { success: false, error: 'Invalid token format' },
        { status: 401 }
      );
    }

    // Decode JWT manually to extract role claim
    let decoded: any;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT structure');
      }

      const payload = parts[1];
      const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
      const decoded_str = Buffer.from(padded, 'base64').toString('utf-8');
      decoded = JSON.parse(decoded_str);
    } catch (e) {
      console.error('[SalahRekamToggleStatus] Failed to decode JWT:', e);
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Extract and normalize role
    const userRole = (decoded.user_role || decoded.role || '').toLowerCase().trim();
    if (!['admin', 'superuser'].includes(userRole)) {
      console.error('[SalahRekamToggleStatus] Insufficient permissions - role:', userRole);
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions: admin role required' },
        { status: 403 }
      );
    }

    // Call Go backend with the token
    const goBackendUrl = process.env.NEXT_PUBLIC_GO_BACKEND_URL || 'http://localhost:8080';
    const response = await fetch(
      `${goBackendUrl}/data-rekam/salah-rekam/${id}/toggle-status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id, is_ready_to_record }),
      }
    );

    // Pass through response from Go backend
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[SalahRekamToggleStatus] Go backend error:', {
        status: response.status,
        error: errorData
      });
      return NextResponse.json(
        { success: false, error: errorData.error || 'Failed to update status' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('[SalahRekamToggleStatus] API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
