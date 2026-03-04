import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const riderId = searchParams.get('riderId');
    const weekNumber = searchParams.get('weekNumber');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');

    if (action === 'calculate') {
      // Calculate payout for a rider based on week/month
      const riderIdParam = searchParams.get('riderId');
      const basePayout = parseFloat(searchParams.get('basePayout') || '0');
      const ordersCount = parseInt(searchParams.get('ordersCount') || '0');
      const weekNumberParam = searchParams.get('weekNumber');
      const monthParam = searchParams.get('month');
      const yearParam = searchParams.get('year');

      if (!riderIdParam) {
        return NextResponse.json({ error: 'Rider ID required' }, { status: 400 });
      }

      // Fetch rider details
      const riders = await sql`
        SELECT r.*, s.setting_value as ev_monthly_rent 
        FROM riders r
        LEFT JOIN settings s ON s.setting_key = 'ev_monthly_rent'
        WHERE r.cee_id = ${riderIdParam}
      `;

      if (riders.length === 0) {
        return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
      }

      const rider = riders[0];

      // Calculate EV rent (if applicable)
      let evRent = 0;
      if (rider.vehicle_ownership === 'company_ev') {
        const monthlyRent = parseFloat(rider.monthly_rent || '0');
        const weeklyRent = parseFloat(rider.weekly_rent || '0');
        const leaderDiscount = parseFloat(rider.leader_discount_percentage || '0');
        
        // Use weekly rent if provided, otherwise calculate from monthly
        const baseRent = weeklyRent > 0 ? weeklyRent : (monthlyRent / 4);
        evRent = baseRent - (baseRent * leaderDiscount / 100);
      }

      // Fetch incentives for the period
      const incentives = await sql`
        SELECT COALESCE(SUM(amount), 0) as total_incentives
        FROM incentives
        WHERE rider_id = ${riderIdParam}
        AND EXTRACT(YEAR FROM incentive_date) = ${yearParam}
        AND EXTRACT(MONTH FROM incentive_date) = ${monthParam}
      `;

      // Fetch deductions for the period
      const deductions = await sql`
        SELECT COALESCE(SUM(amount), 0) as total_deductions
        FROM deductions
        WHERE rider_id = ${riderIdParam}
        AND EXTRACT(YEAR FROM deduction_date) = ${yearParam}
        AND EXTRACT(MONTH FROM deduction_date) = ${monthParam}
      `;

      // Fetch pending advances
      const advances = await sql`
        SELECT COALESCE(SUM(amount), 0) as total_advances
        FROM advances
        WHERE rider_id = ${riderIdParam}
        AND status = 'approved'
      `;

      const totalIncentives = parseFloat(incentives[0]?.total_incentives || '0');
      const totalDeductions = parseFloat(deductions[0]?.total_deductions || '0');
      const totalAdvances = parseFloat(advances[0]?.total_advances || '0');

      const netPayout = basePayout + totalIncentives - evRent - totalDeductions - totalAdvances;

      return NextResponse.json({
        riderId: riderIdParam,
        riderName: rider.full_name,
        basePayout,
        ordersCount,
        incentives: totalIncentives,
        evRent,
        deductions: totalDeductions,
        advances: totalAdvances,
        netPayout,
        breakdown: {
          basePayout,
          incentives: totalIncentives,
          evRent: -evRent,
          deductions: -totalDeductions,
          advances: -totalAdvances,
        }
      });
    }

    if (action === 'history') {
      // Get payout history
      let query = `
        SELECT p.*, r.full_name, r.cee_id
        FROM payouts p
        LEFT JOIN riders r ON r.cee_id = p.rider_id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (riderId) {
        query += ` AND p.rider_id = $${paramIndex}`;
        params.push(riderId);
        paramIndex++;
      }

      if (weekNumber) {
        query += ` AND p.week_number = $${paramIndex}`;
        params.push(weekNumber);
        paramIndex++;
      }

      if (month) {
        query += ` AND p.month = $${paramIndex}`;
        params.push(month);
        paramIndex++;
      }

      if (year) {
        query += ` AND p.year = $${paramIndex}`;
        params.push(year);
        paramIndex++;
      }

      if (status) {
        query += ` AND p.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      query += ` ORDER BY p.created_at DESC`;

      const payouts = await sql(query, params);
      return NextResponse.json(payouts);
    }

    if (action === 'pending') {
      // Get all pending payouts
      const payouts = await sql`
        SELECT p.*, r.full_name, r.cee_id
        FROM payouts p
        LEFT JOIN riders r ON r.cee_id = p.rider_id
        WHERE p.status = 'pending'
        ORDER BY p.created_at DESC
      `;
      return NextResponse.json(payouts);
    }

    // Default: return all payouts
    const payouts = await sql`
      SELECT p.*, r.full_name, r.cee_id
      FROM payouts p
      LEFT JOIN riders r ON r.cee_id = p.rider_id
      ORDER BY p.created_at DESC
      LIMIT 100
    `;
    return NextResponse.json(payouts);

  } catch (error: any) {
    console.error('Error fetching payroll data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (action === 'create') {
      // Create single payout entry
      const {
        riderId,
        weekNumber,
        weekPeriod,
        month,
        year,
        ordersCount,
        basePayout,
        totalIncentives,
        totalDeductions,
        netPayout
      } = data;

      const result = await sql`
        INSERT INTO payouts (
          rider_id, week_number, week_period, month, year,
          orders_count, base_payout, total_incentives, total_deductions,
          net_payout, status, created_at
        ) VALUES (
          ${riderId}, ${weekNumber}, ${weekPeriod}, ${month}, ${year},
          ${ordersCount}, ${basePayout}, ${totalIncentives}, ${totalDeductions},
          ${netPayout}, 'pending', NOW()
        )
        RETURNING *
      `;

      return NextResponse.json(result[0]);
    }

    if (action === 'bulk_create') {
      // Create multiple payout entries
      const { payouts } = data;
      const results = [];

      for (const payout of payouts) {
        const result = await sql`
          INSERT INTO payouts (
            rider_id, week_number, week_period, month, year,
            orders_count, base_payout, total_incentives, total_deductions,
            net_payout, status, created_at
          ) VALUES (
            ${payout.riderId}, ${payout.weekNumber}, ${payout.weekPeriod},
            ${payout.month}, ${payout.year}, ${payout.ordersCount},
            ${payout.basePayout}, ${payout.totalIncentives},
            ${payout.totalDeductions}, ${payout.netPayout}, 'pending', NOW()
          )
          RETURNING *
        `;
        results.push(result[0]);
      }

      return NextResponse.json({ success: true, count: results.length, payouts: results });
    }

    if (action === 'parse_invoice') {
      // AI Invoice parsing - this would integrate with OpenAI API
      const { file, fileType } = data;
      
      // For now, return a mock response - in production, this would call OpenAI Vision API
      // to extract data from the invoice
      return NextResponse.json({
        success: true,
        message: 'Invoice parsing will be implemented with OpenAI API',
        extractedData: []
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Error creating payroll data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (action === 'approve') {
      // Approve single payout
      const { id } = data;
      
      const result = await sql`
        UPDATE payouts
        SET status = 'approved', payment_date = CURRENT_DATE
        WHERE id = ${id}
        RETURNING *
      `;

      return NextResponse.json(result[0]);
    }

    if (action === 'bulk_approve') {
      // Approve multiple payouts
      const { ids } = data;
      
      const result = await sql`
        UPDATE payouts
        SET status = 'approved', payment_date = CURRENT_DATE
        WHERE id = ANY(${ids})
        RETURNING *
      `;

      return NextResponse.json({ success: true, count: result.length });
    }

    if (action === 'mark_paid') {
      // Mark as paid
      const { id } = data;
      
      const result = await sql`
        UPDATE payouts
        SET status = 'paid', payment_date = CURRENT_DATE
        WHERE id = ${id}
        RETURNING *
      `;

      // Clear associated advances
      const payout = result[0];
      if (payout) {
        await sql`
          UPDATE advances
          SET status = 'paid'
          WHERE rider_id = ${payout.rider_id}
          AND status = 'approved'
        `;
      }

      return NextResponse.json(result[0]);
    }

    if (action === 'bulk_mark_paid') {
      // Mark multiple as paid
      const { ids } = data;
      
      const result = await sql`
        UPDATE payouts
        SET status = 'paid', payment_date = CURRENT_DATE
        WHERE id = ANY(${ids})
        RETURNING *
      `;

      // Clear advances for all paid riders
      for (const payout of result) {
        await sql`
          UPDATE advances
          SET status = 'paid'
          WHERE rider_id = ${payout.rider_id}
          AND status = 'approved'
        `;
      }

      return NextResponse.json({ success: true, count: result.length });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Error updating payroll data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Payout ID required' }, { status: 400 });
    }

    await sql`DELETE FROM payouts WHERE id = ${id}`;
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error deleting payout:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
