import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hubId = searchParams.get('hubId');

    if (!hubId) {
      return NextResponse.json(
        { error: 'Hub ID is required' },
        { status: 400 }
      );
    }

    // Get riders assigned to this hub
    const riders = await sql`
      SELECT 
        id, 
        cee_id, 
        full_name, 
        phone, 
        email, 
        vehicle_type, 
        status, 
        assigned_hub_id
      FROM riders
      WHERE assigned_hub_id = ${parseInt(hubId)}
      ORDER BY full_name ASC
    `;

    return NextResponse.json(riders);
  } catch (error: any) {
    console.error('Riders fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch riders' },
      { status: 500 }
    );
  }
}
