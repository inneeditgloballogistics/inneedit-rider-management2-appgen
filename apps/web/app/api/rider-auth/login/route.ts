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

    // Check if password is set
    if (!rider.password_hash) {
      return NextResponse.json(
        { 
          error: 'Password not set. Please set your password first.',
          redirectTo: '/rider-password-setup',
          needsPasswordSetup: true
        },
        { status: 400 }
      );
    }

    // Verify password
    if (!verifyPassword(password, rider.password_hash)) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get or create user entry
    let userId = rider.user_id;

    // ALWAYS check if the user exists in the user table
    if (userId) {
      const userExists = await sql`
        SELECT id FROM "user" WHERE id = ${userId}
      `;
      
      if (userExists.length === 0) {
        // User ID exists in rider but user doesn't exist, create it
        await sql`
          INSERT INTO "user" (id, name, email, role, "emailVerified", "createdAt", "updatedAt")
          VALUES (
            ${userId},
            ${rider.full_name},
            ${rider.email},
            'rider',
            true,
            NOW(),
            NOW()
          )
        `;
      }
    } else {
      // No user_id in rider, check if user exists by email
      const existingUsers = await sql`
        SELECT id FROM "user" WHERE LOWER(email) = LOWER(${rider.email})
      `;

      if (existingUsers.length > 0) {
        userId = existingUsers[0].id;
      } else {
        // Create a new user entry
        userId = crypto.randomUUID();
        await sql`
          INSERT INTO "user" (id, name, email, role, "emailVerified", "createdAt", "updatedAt")
          VALUES (
            ${userId},
            ${rider.full_name},
            ${rider.email},
            'rider',
            true,
            NOW(),
            NOW()
          )
        `;
      }

      // Link user to rider
      await sql`
        UPDATE riders
        SET user_id = ${userId}
        WHERE id = ${rider.id}
      `;
    }

    // Create session
    const sessionToken = `rider_${crypto.randomUUID()}`;
    const expiresAtDate = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now (IST)
    const sessionId = crypto.randomUUID();

    console.log('Creating session:', { sessionId, userId, sessionToken, expiresAt: expiresAtDate });

    try {
      await sql`
        INSERT INTO session (id, "userId", token, "expiresAt", "createdAt", "updatedAt")
        VALUES (
          ${sessionId},
          ${userId},
          ${sessionToken},
          ${expiresAtDate},
          NOW(),
          NOW()
        )
      `;
      console.log('Session created successfully');
    } catch (sessionError: any) {
      console.error('Session creation error:', sessionError);
      throw new Error(`Failed to create session: ${sessionError.message}`);
    }

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

    console.log('Login response sent with session cookie');
    return response;
  } catch (error: any) {
    console.error('Rider login error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
