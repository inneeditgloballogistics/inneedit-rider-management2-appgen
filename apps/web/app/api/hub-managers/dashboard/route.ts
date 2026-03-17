import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify session and get user
    const sessions = await sql`
      SELECT s."userId"
      FROM session s
      WHERE s.token = ${sessionToken}
      AND s."expiresAt" > NOW()
      LIMIT 1
    `;

    if (sessions.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    const userId = sessions[0].userId;

    // Get hub manager data
    const managers = await sql`
      SELECT hm.id, hm.hub_id, hm.manager_name, hm.manager_email, hm.manager_phone,
             h.hub_name, h.hub_code, h.location, h.city, h.state, h.pincode
      FROM hub_managers hm
      JOIN hubs h ON h.id = hm.hub_id
      WHERE hm.user_id = ${userId}
      LIMIT 1
    `;

    if (managers.length === 0) {
      return NextResponse.json(
        { error: 'Hub manager not found' },
        { status: 404 }
      );
    }

    const manager = managers[0];

    return NextResponse.json({
      hubId: manager.hub_id,
      hubName: manager.hub_name,
      hubCode: manager.hub_code,
      location: manager.location,
      city: manager.city,
      state: manager.state,
      pincode: manager.pincode,
      name: manager.manager_name,
      email: manager.manager_email,
      phone: manager.manager_phone,
    });
  } catch (error: any) {
    console.error('Dashboard fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
