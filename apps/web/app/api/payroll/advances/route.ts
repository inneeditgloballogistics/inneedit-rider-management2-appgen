import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      rider_id,
      rider_name,
      amount,
      reason,
      admin_notes,
      deduction_date
    } = body;

    // Store the date as ISO string in IST timezone
    // deduction_date comes as YYYY-MM-DD string (in IST)
    // Parse it properly without timezone shifts
    let dateToStore: string;
    if (deduction_date) {
      const [year, month, day] = deduction_date.split('-').map(Number);
      // Create UTC date, then convert to IST ISO string
      const utcDate = new Date(Date.UTC(year, month - 1, day));
      dateToStore = utcDate.toISOString();
    } else {
      // Use IST time - database is configured for IST
      const now = new Date();
      const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
      dateToStore = istTime.toISOString();
    }

    // Resolve rider_id to cee_id first
    let resolvedCeeId = rider_id;
    try {
      const riderInfo = await sql`
        SELECT cee_id FROM riders 
        WHERE user_id = ${rider_id} OR cee_id = ${rider_id}
        LIMIT 1
      `;
      if (riderInfo.length > 0) {
        resolvedCeeId = riderInfo[0].cee_id;
      }
    } catch (e) {
      console.log('Could not resolve cee_id, using rider_id as-is');
    }

    const result = await sql`
      INSERT INTO advances (
        cee_id,
        rider_id,
        rider_name,
        amount,
        reason,
        admin_notes,
        status,
        requested_at
      ) VALUES (
        ${resolvedCeeId},
        ${rider_id},
        ${rider_name},
        ${parseFloat(amount)},
        ${reason},
        ${admin_notes},
        'approved',
        ${dateToStore}
      )
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      advance: result[0]
    });
  } catch (error) {
    console.error('Error creating advance:', error);
    return NextResponse.json(
      { error: 'Failed to create advance', details: String(error) },
      { status: 500 }
    );
  }
}
