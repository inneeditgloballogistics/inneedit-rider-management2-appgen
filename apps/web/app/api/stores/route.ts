import { NextRequest, NextResponse } from 'next/server';
import sql from '../utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'count') {
      const result = await sql`SELECT COUNT(*) as count FROM stores`;
      return NextResponse.json({ count: parseInt(result[0].count) });
    }

    if (action === 'map') {
      // Fetch all stores with their coordinates and rider counts
      const stores = await sql`
        SELECT 
          s.id,
          s.store_name,
          s.store_code,
          s.client,
          s.location,
          s.city,
          s.state,
          s.pincode,
          s.status,
          s.latitude,
          s.longitude,
          s.store_manager_name,
          s.store_manager_phone,
          COALESCE(COUNT(CASE WHEN r.status = 'active' THEN 1 END), 0)::int as active_riders_count,
          COALESCE(COUNT(CASE WHEN r.status = 'inactive' THEN 1 END), 0)::int as inactive_riders_count,
          COALESCE(COUNT(r.id), 0)::int as total_riders_count
        FROM stores s
        LEFT JOIN riders r ON r.store_id = s.id
        WHERE s.latitude IS NOT NULL AND s.longitude IS NOT NULL
        GROUP BY s.id, s.store_name, s.store_code, s.client, s.location, s.city, s.state, 
                 s.pincode, s.status, s.latitude, s.longitude, s.store_manager_name, s.store_manager_phone
        ORDER BY s.created_at DESC
      `;
      return NextResponse.json(stores);
    }

    const stores = await sql`SELECT * FROM stores ORDER BY created_at DESC`;
    return NextResponse.json(stores);
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      store_name, store_code, client, location, city, state, pincode, 
      contact_person, contact_phone, status, latitude, longitude,
      store_manager_name, store_manager_phone
    } = body;

    const result = await sql`
      INSERT INTO stores (
        store_name, store_code, client, location, city, state, pincode, 
        contact_person, contact_phone, status, latitude, longitude,
        store_manager_name, store_manager_phone
      )
      VALUES (
        ${store_name}, ${store_code}, ${client}, ${location}, 
        ${city || null}, ${state || null}, ${pincode || null}, 
        ${contact_person || null}, ${contact_phone || null}, ${status || 'active'},
        ${latitude || null}, ${longitude || null},
        ${store_manager_name || null}, ${store_manager_phone || null}
      )
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating store:', error);
    return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, store_name, store_code, client, location, city, state, pincode, 
      contact_person, contact_phone, status, latitude, longitude,
      store_manager_name, store_manager_phone
    } = body;

    const result = await sql`
      UPDATE stores 
      SET store_name = ${store_name}, 
          store_code = ${store_code}, 
          client = ${client}, 
          location = ${location}, 
          city = ${city}, 
          state = ${state}, 
          pincode = ${pincode}, 
          contact_person = ${contact_person}, 
          contact_phone = ${contact_phone}, 
          status = ${status},
          latitude = ${latitude || null},
          longitude = ${longitude || null},
          store_manager_name = ${store_manager_name || null},
          store_manager_phone = ${store_manager_phone || null}
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating store:', error);
    return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    await sql`DELETE FROM stores WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting store:', error);
    return NextResponse.json({ error: 'Failed to delete store' }, { status: 500 });
  }
}
