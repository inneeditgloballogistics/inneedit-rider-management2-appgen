import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, month, date, filter, search, status } = body;

    // Fetch riders with vehicle information
    const result = await sql`
      SELECT 
        r.id,
        r.cee_id,
        r.full_name,
        r.phone,
        r.email,
        r.vehicle_ownership,
        r.assigned_hub_id,
        r.status,
        r.assigned_vehicle_id,
        v.vehicle_number,
        v.model,
        v.vehicle_type,
        v.year as vehicle_year,
        v.status as vehicle_status
      FROM riders r
      LEFT JOIN vehicles v ON r.assigned_vehicle_id = v.id
      WHERE r.status IS NOT NULL
      ORDER BY r.full_name ASC
    `;

    // Filter based on filter type or status
    let filteredRiders = result as any[];

    if (status === 'active' || filter === 'active') {
      filteredRiders = filteredRiders.filter((r: any) => r.status === 'active');
    } else if (filter === 'inactive') {
      filteredRiders = filteredRiders.filter((r: any) => r.status !== 'active');
    } else if (filter === 'own_vehicle') {
      filteredRiders = filteredRiders.filter((r: any) => r.vehicle_ownership === 'own');
    } else if (filter === 'company_ev') {
      filteredRiders = filteredRiders.filter((r: any) => r.vehicle_ownership === 'company_ev');
    }

    // Filter by search query
    if (search) {
      const searchLower = search.toLowerCase();
      filteredRiders = filteredRiders.filter((r: any) =>
        r.rider_name.toLowerCase().includes(searchLower) ||
        r.rider_id.toLowerCase().includes(searchLower) ||
        r.phone.includes(search)
      );
    }

    return NextResponse.json({
      riders: filteredRiders,
      count: filteredRiders.length
    });
  } catch (error) {
    console.error('Error filtering riders:', error);
    return NextResponse.json(
      { error: 'Failed to filter riders', details: String(error) },
      { status: 500 }
    );
  }
}
