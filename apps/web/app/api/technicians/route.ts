import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hubId = searchParams.get('hubId');

    if (hubId) {
      const technicians = await sql`
        SELECT * FROM technicians 
        WHERE hub_id = ${parseInt(hubId)} AND status = 'active'
        ORDER BY name ASC
      `;
      return NextResponse.json(technicians);
    }

    // Get all technicians
    const technicians = await sql`
      SELECT * FROM technicians 
      ORDER BY name ASC
    `;
    return NextResponse.json(technicians);
  } catch (error) {
    console.error('Error fetching technicians:', error);
    return NextResponse.json({ error: 'Failed to fetch technicians' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, hub_id, password_hash, status = 'active' } = body;

    const result = await sql`
      INSERT INTO technicians (name, email, phone, hub_id, password_hash, status, created_at, updated_at)
      VALUES (${name}, ${email}, ${phone}, ${hub_id}, ${password_hash}, ${status}, NOW(), NOW())
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating technician:', error);
    return NextResponse.json({ error: 'Failed to create technician' }, { status: 500 });
  }
}
