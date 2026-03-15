import { NextRequest, NextResponse } from 'next/server';
import sql from '../utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ceeId = searchParams.get('ceeId');

    if (!ceeId) {
      return NextResponse.json({ error: 'CEE ID is required' }, { status: 400 });
    }

    const incentives = await sql`
      SELECT * FROM incentives 
      WHERE cee_id = ${ceeId}
      ORDER BY incentive_date DESC
    `;

    const summary = await sql`
      SELECT 
        incentive_type,
        COALESCE(SUM(amount), 0) as total_amount
      FROM incentives 
      WHERE cee_id = ${ceeId}
      GROUP BY incentive_type
    `;

    return NextResponse.json({ 
      incentives,
      summary
    });
  } catch (error) {
    console.error('Error fetching incentives:', error);
    return NextResponse.json({ error: 'Failed to fetch incentives' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ceeId, incentiveType, amount, description, incentiveDate } = body;

    if (!ceeId) {
      return NextResponse.json({ error: 'CEE ID is required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO incentives (cee_id, incentive_type, amount, description, incentive_date)
      VALUES (${ceeId}, ${incentiveType}, ${amount}, ${description}, ${incentiveDate})
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating incentive:', error);
    return NextResponse.json({ error: 'Failed to create incentive' }, { status: 500 });
  }
}
