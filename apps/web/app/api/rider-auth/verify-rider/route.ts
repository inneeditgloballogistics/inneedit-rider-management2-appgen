import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function POST(request: NextRequest) {
  try {
    const { cee_id, email } = await request.json();

    if (!cee_id || !email) {
      return NextResponse.json(
        { error: 'Cee ID and email are required' },
        { status: 400 }
      );
    }

    // Find rider by cee_id and email
    const result = await sql`
      SELECT id, cee_id, full_name, email, phone, status, password_hash
      FROM riders
      WHERE UPPER(cee_id) = UPPER(${cee_id}) AND LOWER(email) = LOWER(${email})
      LIMIT 1
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Rider not found. Please check your Cee ID and email.' },
        { status: 404 }
      );
    }

    const rider = result[0];

    // Check if password is already set
    if (rider.password_hash) {
      return NextResponse.json(
        { error: 'Password already set for this account. Please use the login page.' },
        { status: 400 }
      );
    }

    // Check if rider status is active
    if (rider.status !== 'active' && rider.status !== 'Active') {
      return NextResponse.json(
        { error: `Your account is currently ${rider.status}. Please contact your hub manager.` },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      rider: {
        id: rider.id,
        cee_id: rider.cee_id,
        full_name: rider.full_name,
        email: rider.email,
        phone: rider.phone,
      },
    });
  } catch (error: any) {
    console.error('Verify rider error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify rider' },
      { status: 500 }
    );
  }
}
