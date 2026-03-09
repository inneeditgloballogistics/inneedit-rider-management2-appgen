import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';
import crypto from 'crypto';

// Simple password hashing
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

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);

    // Update rider with password hash
    const result = await sql`
      UPDATE riders
      SET password_hash = ${passwordHash}, phone_verified = true
      WHERE LOWER(email) = LOWER(${email})
      RETURNING id, cee_id, full_name, email, phone
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Rider not found with this email' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Password updated successfully for ${result[0].cee_id}`,
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
