import { NextRequest, NextResponse } from 'next/server';
import { sql } from '../utils/sql';

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

    // Get rider details with all fields
    const riders = await sql`
      SELECT 
        id, 
        user_id, 
        cee_id, 
        full_name, 
        phone, 
        email, 
        date_of_birth,
        gender,
        address,
        city, 
        state, 
        pincode,
        emergency_contact_name,
        emergency_contact_phone,
        client,
        driving_license_number,
        driving_license_expiry,
        driving_license_url,
        aadhar_number,
        aadhar_url,
        bank_name,
        account_number,
        ifsc_code,
        vehicle_type,
        assigned_hub_id,
        assigned_vehicle_id,
        status,
        phone_verified,
        created_at
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
        user_id: rider.user_id,
        ceeId: rider.cee_id,
        full_name: rider.full_name,
        phone: rider.phone,
        email: rider.email,
        date_of_birth: rider.date_of_birth,
        gender: rider.gender,
        address: rider.address,
        city: rider.city,
        state: rider.state,
        pincode: rider.pincode,
        emergency_contact_name: rider.emergency_contact_name,
        emergency_contact_phone: rider.emergency_contact_phone,
        client: rider.client,
        driving_license_number: rider.driving_license_number,
        driving_license_expiry: rider.driving_license_expiry,
        driving_license_url: rider.driving_license_url,
        aadhar_number: rider.aadhar_number,
        aadhar_url: rider.aadhar_url,
        bank_name: rider.bank_name,
        account_number: rider.account_number,
        ifsc_code: rider.ifsc_code,
        vehicle_type: rider.vehicle_type,
        assigned_hub_id: rider.assigned_hub_id,
        assigned_vehicle_id: rider.assigned_vehicle_id,
        status: rider.status,
        phone_verified: rider.phone_verified,
        created_at: rider.created_at,
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
