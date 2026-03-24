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

    // Find hub manager by email
    const managers = await sql`
      SELECT 
        hm.id,
        hm.user_id,
        hm.hub_id,
        hm.manager_name,
        hm.manager_email,
        hm.manager_phone,
        hm.password_hash,
        hm.status,
        h.hub_name,
        h.hub_code
      FROM hub_managers hm
      JOIN hubs h ON h.id = hm.hub_id
      WHERE LOWER(hm.manager_email) = LOWER(${email})
    `;

    if (managers.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const manager = managers[0];

    // Check if manager is active
    if (manager.status !== 'active') {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Contact your administrator.' },
        { status: 403 }
      );
    }

    // Verify password
    const passwordHash = hashPassword(password);
    if (manager.password_hash !== passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Return manager data
    return NextResponse.json({
      success: true,
      hub_manager: {
        id: manager.id,
        user_id: manager.user_id,
        name: manager.manager_name,
        email: manager.manager_email,
        phone: manager.manager_phone,
        hub_id: manager.hub_id,
        hub_name: manager.hub_name,
        hub_code: manager.hub_code,
        status: manager.status,
      },
    });
  } catch (error: any) {
    console.error('Hub Manager Login Error:', error);
    return NextResponse.json(
      { error: 'Failed to process login request' },
      { status: 500 }
    );
  }
}
