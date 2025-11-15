import { NextRequest, NextResponse } from 'next/server';

/**
 * PATCH /api/data-rekam/salah-rekam-update-date
 * 
 * Updates the estimasi_tanggal_perekaman for a salah rekam record.
 * Only admin or superuser roles are allowed.
 * 
 * Request Body:
 * {
 *   id: string,
 *   estimasi_tanggal_perekaman: string (YYYY-MM-DD format)
 * }
 * 
 * Authorization: Bearer <JWT_TOKEN>
 */
export async function PATCH(request: NextRequest) {
  try {
    const { id, estimasi_tanggal_perekaman } = await request.json();

    console.log('[SalahRekamUpdateDate] Request received:', {
      id,
      estimasi_tanggal_perekaman,
      type_of_date: typeof estimasi_tanggal_perekaman,
    });

    // Validate request body
    if (!id || !estimasi_tanggal_perekaman) {
      console.error('[SalahRekamUpdateDate] Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, estimasi_tanggal_perekaman' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(estimasi_tanggal_perekaman)) {
      console.error('[SalahRekamUpdateDate] Invalid date format:', estimasi_tanggal_perekaman);
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
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
      console.error('[SalahRekamUpdateDate] Invalid token format detected');
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
      console.error('[SalahRekamUpdateDate] Failed to decode JWT:', e);
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Extract and normalize role
    const userRole = (decoded.user_role || decoded.role || '').toLowerCase().trim();
    if (!['admin', 'superuser'].includes(userRole)) {
      console.error('[SalahRekamUpdateDate] Insufficient permissions - role:', userRole);
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions: admin role required' },
        { status: 403 }
      );
    }

    // Call Go backend with the token
    const goBackendUrl = process.env.NEXT_PUBLIC_GO_BACKEND_URL || 'http://localhost:8080';
    console.log('[SalahRekamUpdateDate] Calling Go backend:', {
      url: `${goBackendUrl}/data-rekam/salah-rekam/${id}/update-date`,
      body: { id, estimasi_tanggal_perekaman },
    });

    const response = await fetch(
      `${goBackendUrl}/data-rekam/salah-rekam/${id}/update-date`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id, estimasi_tanggal_perekaman }),
      }
    );

    // Pass through response from Go backend
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[SalahRekamUpdateDate] Go backend error:', {
        status: response.status,
        error: errorData
      });
      return NextResponse.json(
        { success: false, error: errorData.error || 'Failed to update date' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[SalahRekamUpdateDate] Success:', data);
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('[SalahRekamUpdateDate] API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
