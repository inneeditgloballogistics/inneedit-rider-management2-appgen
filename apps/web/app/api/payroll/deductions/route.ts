import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

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

    const result = await sql`
      INSERT INTO deductions (
        rider_id,
        deduction_type,
        amount,
        description,
        deduction_date,
        created_at
      ) VALUES (
        ${rider_id || cee_id},
        ${deduction_type},
        ${parseFloat(amount)},
        ${description || ''},
        ${deduction_date},
        NOW()
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
