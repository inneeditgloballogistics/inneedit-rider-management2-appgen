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
      // Fetch hubs with vehicle, rider, and technician counts for map view
      const hubs = await sql`
        SELECT 
          h.*,
          hm.manager_name,
          hm.manager_email,
          hm.manager_phone,
          (SELECT COUNT(*) FROM vehicles WHERE hub_id = h.id) as vehicles_assigned_count,
          (SELECT COUNT(*) FROM riders WHERE assigned_hub_id = h.id) as riders_collected_count,
          (SELECT COUNT(*) FROM technicians WHERE hub_id = h.id AND status = 'active') as technicians_count
        FROM hubs h
        LEFT JOIN hub_managers hm ON h.id = hm.hub_id AND hm.status = 'active'
        WHERE h.latitude IS NOT NULL AND h.longitude IS NOT NULL
        ORDER BY h.created_at DESC
      `;
      return NextResponse.json(hubs);
    }

    // If specific ID is requested, return only that hub
    if (id) {
      const hub = await sql`
        SELECT 
          h.*,
          hm.manager_name,
          hm.manager_email,
          hm.manager_phone,
          (SELECT COUNT(*) FROM technicians WHERE hub_id = h.id AND status = 'active') as technicians_count
        FROM hubs h
        LEFT JOIN hub_managers hm ON h.id = hm.hub_id AND hm.status = 'active'
        WHERE h.id = ${parseInt(id)}
      `;
      return NextResponse.json(hub);
    }

    const hubs = await sql`
      SELECT 
        h.*,
        hm.manager_name,
        hm.manager_email,
        hm.manager_phone,
        (SELECT COUNT(*) FROM technicians WHERE hub_id = h.id AND status = 'active') as technicians_count
      FROM hubs h
      LEFT JOIN hub_managers hm ON h.id = hm.hub_id AND hm.status = 'active'
      ORDER BY h.created_at DESC
    `;
    return NextResponse.json(hubs);
  } catch (error) {
    console.error('Error fetching hubs:', error);
    return NextResponse.json({ error: 'Failed to fetch hubs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hub_name, hub_code, location, city, state, pincode, manager_name, manager_phone, manager_email, status, latitude, longitude } = body;

    // Insert hub
    const hubResult = await sql`
      INSERT INTO hubs (hub_name, hub_code, location, city, state, pincode, status, latitude, longitude, created_at)
      VALUES (${hub_name}, ${hub_code}, ${location}, ${city || null}, ${state || null}, ${pincode || null}, ${status || 'active'}, ${latitude || null}, ${longitude || null}, CURRENT_TIMESTAMP)
      RETURNING id
    `;

    const hubId = hubResult[0].id;

    // Insert hub manager if provided
    if (manager_name || manager_phone) {
      await sql`
        INSERT INTO hub_managers (hub_id, manager_name, manager_phone, manager_email, status, created_at, updated_at)
        VALUES (${hubId}, ${manager_name || null}, ${manager_phone || null}, ${manager_email || null}, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
    }

    // Return hub with manager details
    const result = await sql`
      SELECT 
        h.*,
        hm.manager_name,
        hm.manager_email,
        hm.manager_phone
      FROM hubs h
      LEFT JOIN hub_managers hm ON h.id = hm.hub_id AND hm.status = 'active'
      WHERE h.id = ${hubId}
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
    const { id, hub_name, hub_code, location, city, state, pincode, manager_name, manager_phone, manager_email, status, latitude, longitude } = body;

    // Update hub details
    await sql`
      UPDATE hubs 
      SET hub_name = ${hub_name}, 
          hub_code = ${hub_code}, 
          location = ${location}, 
          city = ${city || null}, 
          state = ${state || null}, 
          pincode = ${pincode || null}, 
          status = ${status},
          latitude = ${latitude || null},
          longitude = ${longitude || null}
      WHERE id = ${id}
    `;

    // Update or insert hub manager details
    const existingManager = await sql`
      SELECT id FROM hub_managers WHERE hub_id = ${id} AND status = 'active' LIMIT 1
    `;

    if (existingManager.length > 0) {
      // Update existing manager
      await sql`
        UPDATE hub_managers 
        SET manager_name = ${manager_name || null}, 
            manager_phone = ${manager_phone || null}, 
            manager_email = ${manager_email || null},
            updated_at = CURRENT_TIMESTAMP
        WHERE hub_id = ${id} AND status = 'active'
      `;
    } else {
      // Create new manager entry if none exists
      if (manager_name || manager_phone) {
        await sql`
          INSERT INTO hub_managers (hub_id, manager_name, manager_phone, manager_email, status, created_at, updated_at)
          VALUES (${id}, ${manager_name || null}, ${manager_phone || null}, ${manager_email || null}, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;
      }
    }

    // Return updated hub with manager details
    const result = await sql`
      SELECT 
        h.*,
        hm.manager_name,
        hm.manager_email,
        hm.manager_phone
      FROM hubs h
      LEFT JOIN hub_managers hm ON h.id = hm.hub_id AND hm.status = 'active'
      WHERE h.id = ${id}
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
