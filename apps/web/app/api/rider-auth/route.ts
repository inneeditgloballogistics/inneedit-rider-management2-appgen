import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    // Check if session cookie exists
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify session in database
    const sessions = await sql`
      SELECT s."userId", s."expiresAt", u.name, u.email, u.role
      FROM session s
      JOIN "user" u ON u.id = s."userId"
      WHERE s.token = ${sessionToken}
      AND s."expiresAt" > NOW()
      LIMIT 1
    `;

    if (sessions.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    const session = sessions[0];

    // Get rider details
    const riders = await sql`
      SELECT id, cee_id, full_name, phone, email, status
      FROM riders
      WHERE user_id = ${session.userId}
      LIMIT 1
    `;

    if (riders.length === 0) {
      return NextResponse.json(
        { error: 'Rider not found' },
        { status: 404 }
      );
    }

    const rider = riders[0];

    return NextResponse.json({
      success: true,
      rider: {
        id: rider.id,
        ceeId: rider.cee_id,
        name: rider.full_name,
        phone: rider.phone,
        email: rider.email,
      },
    });
  } catch (error: any) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      { error: 'Authentication check failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, firebaseUid, idToken } = await request.json();

    if (!phoneNumber || !firebaseUid || !idToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify Firebase ID token (optional - adds extra security)
    // You can add Firebase Admin SDK verification here if needed

    // Check if rider exists with this phone number
    const riders = await sql`
      SELECT id, user_id, full_name, phone, email, status, cee_id
      FROM riders
      WHERE phone = ${phoneNumber}
      LIMIT 1
    `;

    if (riders.length === 0) {
      return NextResponse.json(
        { error: 'Rider not found. Please contact your administrator.' },
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

    // Update phone_verified status
    await sql`
      UPDATE riders
      SET phone_verified = true
      WHERE id = ${rider.id}
    `;

    // Create or update user in the user table for session management
    let userId = rider.user_id;
    
    if (!userId) {
      // Create a new user entry if doesn't exist
      const newUsers = await sql`
        INSERT INTO "user" (id, name, email, role, "emailVerified", "createdAt", "updatedAt")
        VALUES (
          ${firebaseUid},
          ${rider.full_name},
          ${rider.email || `${phoneNumber}@rider.internal`},
          'rider',
          false,
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
    } else {
      // Update existing user
      await sql`
        UPDATE "user"
        SET 
          name = ${rider.full_name},
          "updatedAt" = NOW()
        WHERE id = ${userId}
      `;
    }

    // Create session
    const sessionToken = `rider_${firebaseUid}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await sql`
      INSERT INTO session (id, "userId", token, "expiresAt", "createdAt", "updatedAt")
      VALUES (
        ${sessionToken},
        ${userId},
        ${sessionToken},
        ${expiresAt.toISOString()},
        NOW(),
        NOW()
      )
    `;

    // Return success with session token
    const response = NextResponse.json({
      success: true,
      rider: {
        id: rider.id,
        ceeId: rider.cee_id,
        name: rider.full_name,
        phone: rider.phone,
        email: rider.email,
      },
      sessionToken,
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
    console.error('Rider authentication error:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}
