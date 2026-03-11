import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      rider_id,
      incentive_type,
      amount,
      description,
      incentive_date
    } = body;

    // Ensure incentive_date is stored correctly (as a date, not timestamp with timezone shift)
    // The incentive_date column is DATE type, so convert YYYY-MM-DD string properly
    const dateToStore = incentive_date || new Date().toISOString().split('T')[0];

    const result = await sql`
      INSERT INTO incentives (
        rider_id,
        incentive_type,
        amount,
        description,
        incentive_date,
        created_at
      ) VALUES (
        ${rider_id},
        ${incentive_type},
        ${parseFloat(amount)},
        ${description},
        ${dateToStore}::DATE,
        NOW()
      )
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      incentive: result[0]
    });
  } catch (error) {
    console.error('Error creating incentive:', error);
    return NextResponse.json(
      { error: 'Failed to create incentive', details: String(error) },
      { status: 500 }
    );
  }
}
