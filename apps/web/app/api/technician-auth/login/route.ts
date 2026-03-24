import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find technician by email
    const technicians = await sql`
      SELECT 
        t.id,
        t.user_id,
        t.hub_id,
        t.name,
        t.email,
        t.phone,
        t.password_hash,
        t.status,
        h.hub_name,
        h.hub_code
      FROM technicians t
      JOIN hubs h ON h.id = t.hub_id
      WHERE LOWER(t.email) = LOWER(${email})
    `;

    if (technicians.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const technician = technicians[0];

    // Check if technician is active
    if (technician.status !== 'active') {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Contact your administrator.' },
        { status: 403 }
      );
    }

    // Verify password
    const passwordHash = hashPassword(password);
    if (technician.password_hash !== passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Return technician data
    return NextResponse.json({
      success: true,
      technician: {
        id: technician.id,
        user_id: technician.user_id,
        name: technician.name,
        email: technician.email,
        phone: technician.phone,
        hub_id: technician.hub_id,
        hub_name: technician.hub_name,
        hub_code: technician.hub_code,
        status: technician.status,
      },
    });
  } catch (error: any) {
    console.error('Technician Login Error:', error);
    return NextResponse.json(
      { error: 'Failed to process login request' },
      { status: 500 }
    );
  }
}
