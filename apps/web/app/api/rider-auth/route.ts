import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function GET(request: NextRequest) {
  try {
    // Check if session cookie exists
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      console.error('No session token in cookies');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('Session token found:', sessionToken);

    // Verify session in database
    let sessions;
    try {
      sessions = await sql`
        SELECT s."userId", s."expiresAt", u.name, u.email, u.role
        FROM session s
        JOIN "user" u ON u.id = s."userId"
        WHERE s.token = ${sessionToken}
        AND s."expiresAt" > NOW()
        LIMIT 1
      `;
    } catch (dbError: any) {
      console.error('Database query error:', dbError);
      throw dbError;
    }

    console.log('Session query result:', sessions);

    if (sessions.length === 0) {
      console.error('Session not found or expired for token:', sessionToken);
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    const session = sessions[0];

    // Get rider details with all fields
    let riders;
    try {
      riders = await sql`
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
          store_id,
          status,
          phone_verified,
          created_at,
          onboarding_completed
        FROM riders
        WHERE user_id = ${session.userId}
        LIMIT 1
      `;
    } catch (riderError: any) {
      console.error('Rider query error:', riderError);
      throw riderError;
    }

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
        store_id: rider.store_id,
        status: rider.status,
        phone_verified: rider.phone_verified,
        created_at: rider.created_at,
        onboarding_completed: rider.onboarding_completed,
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

export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('session_token');
    return response;
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
