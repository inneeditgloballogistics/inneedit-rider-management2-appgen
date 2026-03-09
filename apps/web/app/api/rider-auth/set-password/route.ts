import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';
import crypto from 'crypto';

// Simple password hashing (in production, use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    // Verify if request has admin token (for security)
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.ADMIN_API_KEY || 'admin-key-123';

    if (authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { riderId, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);

    // Update rider with password hash
    const result = await sql`
      UPDATE riders
      SET password_hash = ${passwordHash}
      WHERE LOWER(email) = LOWER(${email})
      RETURNING id, cee_id, full_name, email
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Rider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Password set successfully for rider ${result[0].cee_id}`,
      rider: result[0],
    });
  } catch (error: any) {
    console.error('Set password error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set password' },
      { status: 500 }
    );
  }
}

// GET endpoint to check which riders have passwords set
export async function GET(request: NextRequest) {
  try {
    // Verify if request has admin token (for security)
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.ADMIN_API_KEY || 'admin-key-123';

    if (authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const riders = await sql`
      SELECT id, cee_id, full_name, email, status, password_hash IS NOT NULL as has_password
      FROM riders
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      success: true,
      riders,
    });
  } catch (error: any) {
    console.error('Get riders error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch riders' },
      { status: 500 }
    );
  }
}
