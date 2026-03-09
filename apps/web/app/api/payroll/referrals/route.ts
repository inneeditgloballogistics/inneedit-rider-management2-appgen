import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      rider_id,
      rider_name,
      referred_name,
      referred_phone,
      preferred_location,
      notes
    } = body;

    const result = await sql`
      INSERT INTO referrals (
        referrer_id,
        referrer_cee_id,
        referrer_name,
        referred_name,
        referred_phone,
        preferred_location,
        notes,
        approval_status,
        created_at
      ) VALUES (
        ${rider_id},
        ${rider_id},
        ${rider_name},
        ${referred_name},
        ${referred_phone},
        ${preferred_location},
        ${notes},
        'approved',
        NOW()
      )
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      referral: result[0]
    });
  } catch (error) {
    console.error('Error creating referral:', error);
    return NextResponse.json(
      { error: 'Failed to create referral', details: String(error) },
      { status: 500 }
    );
  }
}
