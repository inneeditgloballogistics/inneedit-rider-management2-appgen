import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      referrer_cee_id,
      rider_name,
      referred_name,
      referred_phone,
      preferred_location,
      notes,
      amount,
      approval_status,
      created_at
    } = body;

    const result = await sql`
      INSERT INTO referrals (
        referrer_cee_id,
        referrer_name,
        referred_name,
        referred_phone,
        preferred_location,
        notes,
        amount,
        approval_status,
        created_at
      ) VALUES (
        ${referrer_cee_id},
        ${rider_name},
        ${referred_name},
        ${referred_phone},
        ${preferred_location},
        ${notes},
        ${amount || 0},
        ${approval_status || 'approved'},
        (${created_at ? new Date(created_at).toISOString() : new Date().toISOString()})::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'
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
