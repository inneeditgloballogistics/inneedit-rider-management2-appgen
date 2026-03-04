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

    const payouts = await sql`
      SELECT * FROM payouts 
      WHERE rider_id = ${riderId}
      ORDER BY year DESC, month DESC, week_number DESC
    `;

    return NextResponse.json(payouts);
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { riderId, weekNumber, weekPeriod, month, year, ordersCount, basePayout, totalIncentives, totalDeductions, netPayout } = body;

    const result = await sql`
      INSERT INTO payouts (rider_id, week_number, week_period, month, year, orders_count, base_payout, total_incentives, total_deductions, net_payout)
      VALUES (${riderId}, ${weekNumber}, ${weekPeriod}, ${month}, ${year}, ${ordersCount}, ${basePayout}, ${totalIncentives}, ${totalDeductions}, ${netPayout})
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating payout:', error);
    return NextResponse.json({ error: 'Failed to create payout' }, { status: 500 });
  }
}
