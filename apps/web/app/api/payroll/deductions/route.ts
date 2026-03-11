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

    // Ensure deduction_date is stored correctly (as a date, not timestamp with timezone shift)
    // The deduction_date column is DATE type, so convert YYYY-MM-DD string properly
    const dateToStore = deduction_date || new Date().toISOString().split('T')[0];

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
        ${dateToStore}::DATE,
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
