import { NextRequest, NextResponse } from 'next/server';
import sql from '../utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const status = searchParams.get('status');

    if (action === 'count') {
      const result = await sql`SELECT COUNT(*) as count FROM vehicles`;
      return NextResponse.json({ count: parseInt(result[0].count) });
    }

    // Filter by status if provided
    let vehicles;
    if (status === 'available') {
      // Only show vehicles that are available and not assigned
      vehicles = await sql`
        SELECT v.*, h.hub_name 
        FROM vehicles v
        LEFT JOIN hubs h ON v.hub_id = h.id
        WHERE v.status = 'available' 
        AND (v.assigned_rider_id IS NULL OR v.assigned_rider_id = '')
        ORDER BY v.created_at DESC
      `;
    } else if (status) {
      vehicles = await sql`
        SELECT v.*, h.hub_name 
        FROM vehicles v
        LEFT JOIN hubs h ON v.hub_id = h.id
        WHERE v.status = ${status} 
        ORDER BY v.created_at DESC
      `;
    } else {
      vehicles = await sql`
        SELECT v.*, h.hub_name 
        FROM vehicles v
        LEFT JOIN hubs h ON v.hub_id = h.id
        ORDER BY v.created_at DESC
      `;
    }

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vehicle_number, vehicle_type, model, year, assigned_rider_id, hub_id, status } = body;

    const result = await sql`
      INSERT INTO vehicles (vehicle_number, vehicle_type, model, year, assigned_rider_id, hub_id, status)
      VALUES (${vehicle_number}, ${vehicle_type}, ${model || null}, ${year || null}, ${assigned_rider_id || null}, ${hub_id || null}, ${status || 'available'})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, vehicle_number, vehicle_type, model, year, assigned_rider_id, hub_id, status } = body;

    const result = await sql`
      UPDATE vehicles 
      SET vehicle_number = ${vehicle_number}, 
          vehicle_type = ${vehicle_type}, 
          model = ${model}, 
          year = ${year}, 
          assigned_rider_id = ${assigned_rider_id}, 
          hub_id = ${hub_id}, 
          status = ${status}
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    await sql`DELETE FROM vehicles WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 });
  }
}
