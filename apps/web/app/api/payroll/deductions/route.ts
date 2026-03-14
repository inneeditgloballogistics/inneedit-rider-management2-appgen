import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

// IST timezone offset: UTC+5:30
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

function getTodayIST(): string {
  const now = new Date();
  const istTime = new Date(now.getTime() + IST_OFFSET);
  return istTime.toISOString().split('T')[0];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      rider_id,
      cee_id,
      deduction_type,
      amount,
      description,
      deduction_date
    } = body;

    // Store the date as YYYY-MM-DD (DATE type in database, no timezone conversion)
    // deduction_date comes as YYYY-MM-DD in IST
    const dateToStore = deduction_date || getTodayIST();

    // Resolve rider_id to cee_id first
    let resolvedCeeId = cee_id;
    if (!resolvedCeeId) {
      try {
        const riderInfo = await sql`
          SELECT cee_id FROM riders 
          WHERE user_id = ${rider_id} OR cee_id = ${rider_id}
          LIMIT 1
        `;
        if (riderInfo.length > 0) {
          resolvedCeeId = riderInfo[0].cee_id;
        } else {
          resolvedCeeId = rider_id;
        }
      } catch (e) {
        console.log('Could not resolve cee_id, using rider_id as-is');
        resolvedCeeId = rider_id;
      }
    }

    const result = await sql`
      INSERT INTO deductions (
        cee_id,
        rider_id,
        deduction_type,
        amount,
        description,
        deduction_date,
        created_at
      ) VALUES (
        ${resolvedCeeId},
        ${rider_id || resolvedCeeId},
        ${deduction_type},
        ${parseFloat(amount)},
        ${description || ''},
        ${dateToStore}::DATE,
        CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
      )
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      deduction: result[0]
    });
  } catch (error) {
    console.error('Error creating deduction:', error);
    return NextResponse.json(
      { error: 'Failed to create deduction', details: String(error) },
      { status: 500 }
    );
  }
}
