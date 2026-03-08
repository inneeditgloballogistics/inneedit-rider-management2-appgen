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
        ${incentive_date},
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
