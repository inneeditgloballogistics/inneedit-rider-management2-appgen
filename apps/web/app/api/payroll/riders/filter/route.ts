import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, month, week, date, filter, search } = body;

    // Base query
    let query = `
      SELECT 
        r.id,
        r.cee_id,
        r.full_name,
        r.phone,
        r.email,
        r.vehicle_type,
        r.assigned_hub_id,
        r.vehicle_ownership,
        r.status
      FROM riders r
      WHERE 1=1
    `;

    const params: any[] = [];

    // Apply date filters if provided
    if (date) {
      query += ` AND r.created_at::date <= $${params.length + 1}`;
      params.push(date);
    }

    // Build the final query dynamically
    const result = await sql`
      SELECT 
        id,
        cee_id,
        full_name,
        phone,
        email,
        vehicle_type,
        assigned_hub_id,
        vehicle_ownership,
        status
      FROM riders
      WHERE status IS NOT NULL
      ORDER BY full_name ASC
    `;

    // Filter based on filter type
    let filteredRiders = result as any[];

    if (filter === 'active') {
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
        r.full_name.toLowerCase().includes(searchLower) ||
        r.cee_id.toLowerCase().includes(searchLower) ||
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
