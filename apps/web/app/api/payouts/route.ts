import { NextRequest, NextResponse } from 'next/server';
import sql from '../utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let ceeId = searchParams.get('ceeId');

    console.log('Payouts GET - Received parameters:', { ceeId });

    if (!ceeId || ceeId === 'undefined' || ceeId === '') {
      console.log('Payouts GET - CEE ID is empty, returning error');
      return NextResponse.json({ error: 'CEE ID is required' }, { status: 400 });
    }

    console.log('Payouts GET - Looking up payouts with cee_id:', ceeId);

    const payouts = await sql`
      SELECT * FROM payouts 
      WHERE cee_id = ${ceeId}
      ORDER BY year DESC, month DESC, week_number DESC
    `;

    console.log('Payouts GET - Payouts found:', payouts.length);
    
    // For each payout, if final_payout is not set (old records), calculate it using the new formula
    const processedPayouts = payouts.map((payout: any) => {
      // If final_payout doesn't exist or is null, calculate it using final_amount if available
      if (!payout.final_payout && payout.final_amount !== undefined && payout.final_amount !== null) {
        // Calculate final payout using new formula
        const basePayout = parseFloat(payout.base_payout) || 0;
        const finalAmount = parseFloat(payout.final_amount) || 0;
        payout.final_payout = basePayout + finalAmount;
        
        // For display, use final_payout in net_payout if it hasn't been updated
        payout.net_payout = payout.final_payout;
      }
      // If final_payout exists, use it
      else if (payout.final_payout !== undefined && payout.final_payout !== null) {
        payout.net_payout = payout.final_payout;
      }
      return payout;
    });

    return NextResponse.json(processedPayouts);
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json({ error: 'Failed to fetch payouts', details: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ceeId, weekNumber, weekPeriod, month, year, ordersCount, basePayout, totalIncentives, totalDeductions, netPayout } = body;

    const result = await sql`
      INSERT INTO payouts (cee_id, week_number, week_period, month, year, orders_count, base_payout, total_incentives, total_deductions, net_payout)
      VALUES (${ceeId}, ${weekNumber}, ${weekPeriod}, ${month}, ${year}, ${ordersCount}, ${basePayout}, ${totalIncentives}, ${totalDeductions}, ${netPayout})
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating payout:', error);
    return NextResponse.json({ error: 'Failed to create payout' }, { status: 500 });
  }
}
