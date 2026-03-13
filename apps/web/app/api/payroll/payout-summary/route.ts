import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { year, month, week } = await request.json();

    // Fetch payout entries for the given period
    const payoutEntries = await sql`
      SELECT 
        pe.cee_id,
        pe.rider_name,
        pe.week,
        pe.base_payout,
        r.user_id as rider_id
      FROM payout_entries pe
      LEFT JOIN riders r ON r.cee_id = pe.cee_id
      WHERE pe.year = ${year} AND pe.month = ${month} AND pe.week = ${week}
      ORDER BY pe.cee_id ASC
    `;

    // For each rider, calculate final amount from payroll entries
    const payouts = await Promise.all(
      payoutEntries.map(async (entry: any) => {
        // Get week date range
        let startDate, endDate;
        
        if (week === 1) {
          startDate = new Date(year, month - 1, 1);
          endDate = new Date(year, month - 1, 7);
        } else if (week === 2) {
          startDate = new Date(year, month - 1, 8);
          endDate = new Date(year, month - 1, 14);
        } else if (week === 3) {
          startDate = new Date(year, month - 1, 15);
          endDate = new Date(year, month - 1, 21);
        } else if (week === 4) {
          startDate = new Date(year, month - 1, 22);
          endDate = new Date(year, month + 1, 0); // Last day of month
        }

        const startDateStr = startDate?.toISOString().split('T')[0];
        const endDateStr = endDate?.toISOString().split('T')[0];

        // Fetch all payroll entries (referrals, incentives, advances, deductions)
        const referralData = await sql`
          SELECT COALESCE(SUM(amount), 0) as total FROM referrals 
          WHERE referrer_id = ${entry.cee_id} 
          AND DATE(created_at) >= ${startDateStr}
          AND DATE(created_at) <= ${endDateStr}
        `;

        const incentiveData = await sql`
          SELECT COALESCE(SUM(amount), 0) as total FROM incentives 
          WHERE rider_id = ${entry.cee_id} 
          AND incentive_date >= ${startDateStr}
          AND incentive_date <= ${endDateStr}
        `;

        const advanceData = await sql`
          SELECT COALESCE(SUM(amount), 0) as total FROM advances 
          WHERE (rider_id = ${entry.cee_id} OR cee_id = ${entry.cee_id})
          AND DATE(requested_at) >= ${startDateStr}
          AND DATE(requested_at) <= ${endDateStr}
        `;

        const deductionData = await sql`
          SELECT COALESCE(SUM(amount), 0) as total FROM deductions 
          WHERE rider_id = ${entry.cee_id} 
          AND deduction_date >= ${startDateStr}
          AND deduction_date <= ${endDateStr}
        `;

        const totalReferrals = parseFloat(referralData[0]?.total || 0);
        const totalIncentives = parseFloat(incentiveData[0]?.total || 0);
        const totalAdvances = parseFloat(advanceData[0]?.total || 0);
        const totalDeductions = parseFloat(deductionData[0]?.total || 0);

        // Final Amount = Referrals + Incentives - Advances - Deductions
        // Note: Do NOT include vehicle rent here as it may already be in the deductions table
        const finalAmount = totalReferrals + totalIncentives - totalAdvances - totalDeductions;
        
        // Convert base_payout to number
        const basePayout = parseFloat(entry.base_payout) || 0;
        
        // Final Payout = Base Payout + Final Amount (Final Amount is already signed)
        const finalPayout = basePayout + finalAmount;

        return {
          cee_id: entry.cee_id,
          rider_name: entry.rider_name,
          rider_id: entry.rider_id,
          week: entry.week,
          base_payout: basePayout,
          final_amount: finalAmount,
          final_payout: Number(finalPayout.toFixed(2))
        };
      })
    );

    return NextResponse.json({ payouts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching payout summary:", error);
    return NextResponse.json({ message: "Error fetching payout summary", payouts: [] }, { status: 500 });
  }
}
