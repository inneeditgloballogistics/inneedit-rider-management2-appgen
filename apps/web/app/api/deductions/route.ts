import { NextRequest, NextResponse } from 'next/server';
import sql from '../utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ceeId = searchParams.get('ceeId');

    if (!ceeId) {
      return NextResponse.json({ error: 'CEE ID is required' }, { status: 400 });
    }

    const deductions = await sql`
      SELECT * FROM deductions 
      WHERE cee_id = ${ceeId}
      ORDER BY deduction_date DESC
    `;

    const summary = await sql`
      SELECT 
        deduction_type,
        COALESCE(SUM(amount), 0) as total_amount
      FROM deductions 
      WHERE cee_id = ${ceeId}
      GROUP BY deduction_type
    `;

    return NextResponse.json({ 
      deductions,
      summary
    });
  } catch (error) {
    console.error('Error fetching deductions:', error);
    return NextResponse.json({ error: 'Failed to fetch deductions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ceeId, deductionType, amount, description, deductionDate } = body;

    if (!ceeId) {
      return NextResponse.json({ error: 'CEE ID is required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO deductions (cee_id, deduction_type, amount, description, deduction_date)
      VALUES (${ceeId}, ${deductionType}, ${amount}, ${description}, ${deductionDate})
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating deduction:', error);
    return NextResponse.json({ error: 'Failed to create deduction' }, { status: 500 });
  }
}
