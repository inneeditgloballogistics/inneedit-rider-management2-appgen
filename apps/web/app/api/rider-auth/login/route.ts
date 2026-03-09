import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';
import crypto from 'crypto';

// Simple password hashing (in production, use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
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

    // Find rider by email
    const riders = await sql`
      SELECT id, user_id, cee_id, full_name, phone, email, status, password_hash
      FROM riders
      WHERE LOWER(email) = LOWER(${email})
      LIMIT 1
    `;

    if (riders.length === 0) {
      return NextResponse.json(
        { error: 'Email not found. Please contact your administrator.' },
        { status: 404 }
      );
    }

    const rider = riders[0];

    // Check if rider is active
    if (rider.status !== 'active') {
      return NextResponse.json(
        { error: 'Your account is not active. Please contact your administrator.' },
        { status: 403 }
      );
    }

    // Verify password
    if (!rider.password_hash || !verifyPassword(password, rider.password_hash)) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get or create user entry
    let userId = rider.user_id;

    if (!userId) {
      // Create a new user entry if doesn't exist
      const newUsers = await sql`
        INSERT INTO "user" (id, name, email, role, "emailVerified", "createdAt", "updatedAt")
        VALUES (
          ${crypto.randomUUID()},
          ${rider.full_name},
          ${rider.email},
          'rider',
          true,
          NOW(),
          NOW()
        )
        RETURNING id
      `;
      userId = newUsers[0].id;

      // Link user to rider
      await sql`
        UPDATE riders
        SET user_id = ${userId}
        WHERE id = ${rider.id}
      `;
    }

    // Create session
    const sessionToken = `rider_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await sql`
      INSERT INTO session (id, "userId", token, "expiresAt", "createdAt", "updatedAt")
      VALUES (
        ${crypto.randomUUID()},
        ${userId},
        ${sessionToken},
        ${expiresAt.toISOString()},
        NOW(),
        NOW()
      )
    `;

    // Return success response
    const response = NextResponse.json({
      success: true,
      rider: {
        id: rider.id,
        ceeId: rider.cee_id,
        name: rider.full_name,
        phone: rider.phone,
        email: rider.email,
      },
    });

    // Set session cookie
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Rider login error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
