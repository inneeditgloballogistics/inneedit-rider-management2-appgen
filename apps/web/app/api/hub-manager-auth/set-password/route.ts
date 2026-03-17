import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { managerId, password, adminToken } = await request.json();

    if (!managerId || !password) {
      return NextResponse.json(
        { error: 'Manager ID and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Hash the password
    const passwordHash = hashPassword(password);

    // Update manager password
    const result = await sql`
      UPDATE hub_managers
      SET password_hash = ${passwordHash},
          updated_at = NOW()
      WHERE id = ${parseInt(managerId)}
      RETURNING id, manager_name, manager_email
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Hub manager not found' },
        { status: 404 }
      );
    }

    const manager = result[0];

    return NextResponse.json({
      success: true,
      message: `Password set successfully for ${manager.manager_name}`,
      manager: {
        id: manager.id,
        name: manager.manager_name,
        email: manager.manager_email,
      },
    });
  } catch (error: any) {
    console.error('Set password error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set password' },
      { status: 500 }
    );
  }
}
