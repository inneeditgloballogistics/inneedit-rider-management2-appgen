import { NextRequest, NextResponse } from 'next/server';
import sql from '../utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let ceeId = searchParams.get('ceeId') || searchParams.get('riderId'); // Support both ceeId and riderId for backward compatibility

    console.log('Payouts GET - Received parameters:', { ceeId });

    if (!ceeId || ceeId === 'undefined' || ceeId === '') {
      console.log('Payouts GET - CEE ID is empty, returning error');
      return NextResponse.json({ error: 'CEE ID is required' }, { status: 400 });
    }

    // Get the rider's user_id from cee_id to match with payouts table
    console.log('Payouts GET - Looking up rider with cee_id:', ceeId);
    const rider = await sql`
      SELECT user_id FROM riders WHERE cee_id = ${ceeId} LIMIT 1
    `;

    console.log('Payouts GET - Rider lookup result:', rider);

    if (rider.length === 0) {
      console.log('Payouts GET - Rider not found for cee_id:', ceeId);
      return NextResponse.json({ error: 'Rider not found', ceeId }, { status: 404 });
    }

    const userId = rider[0].user_id;
    console.log('Payouts GET - Found user_id:', userId);

    const payouts = await sql`
      SELECT * FROM payouts 
      WHERE rider_id = ${userId}
      ORDER BY year DESC, month DESC, week_number DESC
    `;

    console.log('Payouts GET - Payouts found:', payouts.length);
    return NextResponse.json(payouts);
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json({ error: 'Failed to fetch payouts', details: String(error) }, { status: 500 });
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
