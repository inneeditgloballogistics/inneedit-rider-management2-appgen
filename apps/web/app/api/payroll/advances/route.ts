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

    // Ensure we're storing the date as a proper timestamp (at start of day)
    // deduction_date comes as YYYY-MM-DD string, convert to timestamp
    const dateToStore = deduction_date 
      ? new Date(`${deduction_date}T00:00:00`).toISOString()
      : new Date().toISOString();

    const result = await sql`
      INSERT INTO advances (
        rider_id,
        cee_id,
        rider_name,
        amount,
        reason,
        admin_notes,
        status,
        requested_at
      ) VALUES (
        ${rider_id},
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
