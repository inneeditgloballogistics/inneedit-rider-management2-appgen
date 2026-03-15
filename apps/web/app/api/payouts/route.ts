import { NextRequest, NextResponse } from 'next/server';
import sql from '../utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let ceeId = searchParams.get('ceeId');
    let id = searchParams.get('id');

    // Handle single payout lookup by ID
    if (id && !isNaN(Number(id))) {
      const payout = await sql`
        SELECT * FROM payouts 
        WHERE id = ${Number(id)}
      `;
      return NextResponse.json(payout.length > 0 ? payout[0] : {});
    }

    console.log('Payouts GET - Received parameters:', { ceeId });

    // If no ceeId provided, return empty array (payouts table is summary level, not per-rider)
    if (!ceeId || ceeId === 'undefined' || ceeId === '') {
      console.log('Payouts GET - No CEE ID provided, returning empty array for summary payouts');
      return NextResponse.json([]);
    }

    console.log('Payouts GET - Looking up payouts with cee_id:', ceeId);

    // Query payouts that belong to this rider
    // Since payouts table doesn't have cee_id column, we need to fetch from rider-specific summary
    // For now, get all payouts and filter by rider logic (this should be calculated from orders/entries)
    // The rider's payouts are calculated from their weekly entries
    const payouts = await sql`
      SELECT DISTINCT 
        p.id,
        p.week_number,
        p.week_period,
        p.month,
        p.year,
        p.orders_count,
        p.base_payout,
        p.total_incentives,
        p.total_deductions,
        p.net_payout,
        p.status,
        p.payment_date,
        p.created_at,
        p.final_amount,
        p.final_payout
      FROM payouts p
      ORDER BY p.year DESC, p.month DESC, p.week_number DESC
      LIMIT 12
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
