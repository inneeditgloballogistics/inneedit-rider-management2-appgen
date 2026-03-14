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
    const { riderId, ceeId, incentiveType, amount, description, incentiveDate } = body;

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
      INSERT INTO incentives (cee_id, rider_id, incentive_type, amount, description, incentive_date)
      VALUES (${resolvedCeeId}, ${riderId}, ${incentiveType}, ${amount}, ${description}, ${incentiveDate})
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating incentive:', error);
    return NextResponse.json({ error: 'Failed to create incentive' }, { status: 500 });
  }
}
