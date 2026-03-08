import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      rider_id,
      type,
      amount,
      description,
      reason,
      deduction_date
    } = body;

    // Map type to deduction_type based on the type
    const deductionType = type === 'security' ? 'security_deposit' : type;

    const result = await sql`
      INSERT INTO deductions (
        rider_id,
        deduction_type,
        amount,
        description,
        deduction_date,
        created_at
      ) VALUES (
        ${rider_id},
        ${deductionType},
        ${parseFloat(amount)},
        ${description || reason || ''},
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
