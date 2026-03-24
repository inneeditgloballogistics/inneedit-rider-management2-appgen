import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';
import crypto from 'crypto';

// Simple password hashing (in production, use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { cee_id, phone, password } = await request.json();

    if (!cee_id || !phone || !password) {
      return NextResponse.json(
        { error: 'Cee ID, phone, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Verify rider exists with cee_id and phone match
    const riderCheck = await sql`
      SELECT id, cee_id, full_name, email, status, password_hash
      FROM riders
      WHERE UPPER(cee_id) = UPPER(${cee_id}) AND phone = ${phone}
      LIMIT 1
    `;

    if (riderCheck.length === 0) {
      return NextResponse.json(
        { error: 'Rider not found. Please verify your details.' },
        { status: 404 }
      );
    }

    const rider = riderCheck[0];

    // Check if password is already set
    if (rider.password_hash) {
      return NextResponse.json(
        { error: 'Password already set for this account. Please use the login page.' },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);

    // Update rider with password hash
    const result = await sql`
      UPDATE riders
      SET password_hash = ${passwordHash}
      WHERE id = ${rider.id}
      RETURNING id, cee_id, full_name, email, phone
    `;

    // Generate synthetic email if rider doesn't have one
    const riderRecord = result[0];
    const syntheticEmail = riderRecord.email || `${riderRecord.cee_id.toLowerCase()}@rider.inneedit.local`;

    // Create user entry if it doesn't exist
    const existingUser = await sql`
      SELECT id FROM "user" WHERE id = ${rider.user_id || ''}
      LIMIT 1
    `;

    if (existingUser.length === 0) {
      const userId = crypto.randomUUID();
      await sql`
        INSERT INTO "user" (id, name, email, role, "emailVerified", "createdAt", "updatedAt")
        VALUES (
          ${userId},
          ${rider.full_name},
          ${syntheticEmail},
          'rider',
          true,
          NOW(),
          NOW()
        )
      `;

      // Link user to rider
      await sql`
        UPDATE riders
        SET user_id = ${userId}
        WHERE id = ${rider.id}
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Password set successfully',
      rider: riderRecord,
    });
  } catch (error: any) {
    console.error('Set password self error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set password' },
      { status: 500 }
    );
  }
}
