import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const riderId = searchParams.get('riderId');

    if (!riderId) {
      return NextResponse.json({ error: 'Rider ID is required' }, { status: 400 });
    }

    const incentives = await sql`
      SELECT * FROM incentives 
      WHERE rider_id = ${riderId}
      ORDER BY incentive_date DESC
    `;

    const summary = await sql`
      SELECT 
        incentive_type,
        COALESCE(SUM(amount), 0) as total_amount
      FROM incentives 
      WHERE rider_id = ${riderId}
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
    const { riderId, incentiveType, amount, description, incentiveDate } = body;

    const result = await sql`
      INSERT INTO incentives (rider_id, incentive_type, amount, description, incentive_date)
      VALUES (${riderId}, ${incentiveType}, ${amount}, ${description}, ${incentiveDate})
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating incentive:', error);
    return NextResponse.json({ error: 'Failed to create incentive' }, { status: 500 });
  }
}
