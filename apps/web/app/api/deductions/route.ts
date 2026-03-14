import { NextRequest, NextResponse } from 'next/server';
import sql from '../utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const riderId = searchParams.get('riderId');

    if (!riderId) {
      return NextResponse.json({ error: 'Rider ID is required' }, { status: 400 });
    }

    // Resolve riderId to cee_id first
    const riderInfo = await sql`
      SELECT cee_id FROM riders 
      WHERE user_id = ${riderId} OR cee_id = ${riderId}
      LIMIT 1
    `;
    
    const ceeId = riderInfo.length > 0 ? riderInfo[0].cee_id : riderId;

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
    const { riderId, ceeId, deductionType, amount, description, deductionDate } = body;

    // Resolve to cee_id if not provided
    let resolvedCeeId = ceeId;
    if (!resolvedCeeId) {
      const riderInfo = await sql`
        SELECT cee_id FROM riders 
        WHERE user_id = ${riderId} OR cee_id = ${riderId}
        LIMIT 1
      `;
      resolvedCeeId = riderInfo.length > 0 ? riderInfo[0].cee_id : riderId;
    }

    const result = await sql`
      INSERT INTO deductions (cee_id, rider_id, deduction_type, amount, description, deduction_date)
      VALUES (${resolvedCeeId}, ${riderId}, ${deductionType}, ${amount}, ${description}, ${deductionDate})
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating deduction:', error);
    return NextResponse.json({ error: 'Failed to create deduction' }, { status: 500 });
  }
}
