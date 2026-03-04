import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const riderId = searchParams.get('riderId');
    const status = searchParams.get('status');
    const action = searchParams.get('action');

    // If action is 'count', return pending referrals count
    if (action === 'count') {
      const result = await sql`
        SELECT COUNT(*) as count FROM referrals 
        WHERE status = 'pending'
      `;
      return NextResponse.json({ pendingCount: result[0].count || 0 });
    }

    let query;
    if (riderId) {
      query = sql`
        SELECT * FROM referrals 
        WHERE referrer_id = ${riderId}
        ORDER BY created_at DESC
      `;
    } else if (status) {
      query = sql`
        SELECT * FROM referrals 
        WHERE status = ${status}
        ORDER BY created_at DESC
      `;
    } else {
      query = sql`
        SELECT * FROM referrals 
        ORDER BY created_at DESC
      `;
    }

    const referrals = await query;
    return NextResponse.json(referrals);
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referrerId, referrerCeeId, referrerName, referredName, referredPhone, preferredLocation, notes } = body;

    const result = await sql`
      INSERT INTO referrals (referrer_id, referrer_cee_id, referrer_name, referred_name, referred_phone, preferred_location, notes)
      VALUES (${referrerId}, ${referrerCeeId}, ${referrerName}, ${referredName}, ${referredPhone}, ${preferredLocation}, ${notes || null})
      RETURNING *
    `;

    // Create notification for admin
    await sql`
      INSERT INTO notifications (type, title, message, related_id)
      VALUES (
        'referral',
        'New Rider Referral',
        ${`${referrerName} (${referrerCeeId}) referred ${referredName} for ${preferredLocation}`},
        ${result[0].id}
      )
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating referral:', error);
    return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    const result = await sql`
      UPDATE referrals 
      SET status = ${status}, processed_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating referral:', error);
    return NextResponse.json({ error: 'Failed to update referral' }, { status: 500 });
  }
}
