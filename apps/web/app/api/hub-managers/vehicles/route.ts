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

    // Get vehicles at this hub
    const vehicles = await sql`
      SELECT 
        id, 
        vehicle_number, 
        vehicle_type, 
        model, 
        year, 
        status,
        assigned_rider_id
      FROM vehicles
      WHERE hub_id = ${parseInt(hubId)}
      ORDER BY vehicle_number ASC
    `;

    return NextResponse.json(vehicles);
  } catch (error: any) {
    console.error('Vehicles fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}
