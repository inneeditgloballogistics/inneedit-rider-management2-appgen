import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    if (action === 'count') {
      const result = await sql`SELECT COUNT(*) as count FROM hubs`;
      return NextResponse.json({ count: parseInt(result[0].count) });
    }

    if (action === 'map') {
      // Fetch hubs with vehicle and rider counts for map view
      const hubs = await sql`
        SELECT 
          h.*,
          (SELECT COUNT(*) FROM vehicles WHERE hub_id = h.id) as vehicles_assigned_count,
          (SELECT COUNT(*) FROM riders WHERE assigned_hub_id = h.id) as riders_collected_count
        FROM hubs h
        WHERE h.latitude IS NOT NULL AND h.longitude IS NOT NULL
        ORDER BY h.created_at DESC
      `;
      return NextResponse.json(hubs);
    }

    // If specific ID is requested, return only that hub
    if (id) {
      const hub = await sql`SELECT * FROM hubs WHERE id = ${parseInt(id)}`;
      return NextResponse.json(hub);
    }

    const hubs = await sql`SELECT * FROM hubs ORDER BY created_at DESC`;
    return NextResponse.json(hubs);
  } catch (error) {
    console.error('Error fetching hubs:', error);
    return NextResponse.json({ error: 'Failed to fetch hubs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hub_name, hub_code, location, city, state, pincode, manager_name, manager_phone, status, latitude, longitude } = body;

    const result = await sql`
      INSERT INTO hubs (hub_name, hub_code, location, city, state, pincode, manager_name, manager_phone, status, latitude, longitude)
      VALUES (${hub_name}, ${hub_code}, ${location}, ${city || null}, ${state || null}, ${pincode || null}, ${manager_name || null}, ${manager_phone || null}, ${status || 'active'}, ${latitude || null}, ${longitude || null})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating hub:', error);
    return NextResponse.json({ error: 'Failed to create hub' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, hub_name, hub_code, location, city, state, pincode, manager_name, manager_phone, status, latitude, longitude } = body;

    const result = await sql`
      UPDATE hubs 
      SET hub_name = ${hub_name}, 
          hub_code = ${hub_code}, 
          location = ${location}, 
          city = ${city}, 
          state = ${state}, 
          pincode = ${pincode}, 
          manager_name = ${manager_name}, 
          manager_phone = ${manager_phone}, 
          status = ${status},
          latitude = ${latitude || null},
          longitude = ${longitude || null}
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating hub:', error);
    return NextResponse.json({ error: 'Failed to update hub' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Hub ID is required' }, { status: 400 });
    }

    // Check if hub has assigned riders
    const ridersCheck = await sql`SELECT COUNT(*) as count FROM riders WHERE assigned_hub_id = ${parseInt(id)}`;
    const riderCount = parseInt(ridersCheck[0].count);

    // Check if hub has assigned vehicles
    const vehiclesCheck = await sql`SELECT COUNT(*) as count FROM vehicles WHERE hub_id = ${parseInt(id)}`;
    const vehicleCount = parseInt(vehiclesCheck[0].count);

    if (riderCount > 0 || vehicleCount > 0) {
      return NextResponse.json({ 
        error: `Cannot delete hub. It has ${riderCount} rider(s) and ${vehicleCount} vehicle(s) assigned. Please reassign them first.` 
      }, { status: 400 });
    }

    await sql`DELETE FROM hubs WHERE id = ${parseInt(id)}`;
    return NextResponse.json({ success: true, message: 'Hub deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting hub:', error);
    return NextResponse.json({ 
      error: error?.message || 'Failed to delete hub' 
    }, { status: 500 });
  }
}
