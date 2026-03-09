import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { year, month, week } = await request.json();

    // Fetch payout entries for the given period
    const payoutEntries = await sql`
      SELECT 
        cee_id,
        rider_name,
        week,
        base_payout
      FROM payout_entries
      WHERE year = ${year} AND month = ${month} AND week = ${week}
      ORDER BY cee_id ASC
    `;

    // For each rider, calculate final amount from payroll entries
    const payouts = await Promise.all(
      payoutEntries.map(async (entry: any) => {
        // Get week date range
        let startDate, endDate;
        const monthDate = new Date(year, month - 1);
        
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

        // Fetch all payroll entries (referrals, incentives, advances, deductions)
        const referralData = await sql`
          SELECT COALESCE(SUM(amount), 0) as total FROM referrals 
          WHERE referrer_id = ${entry.cee_id} 
          AND created_at >= ${startDate?.toISOString().split('T')[0]}
          AND created_at <= ${endDate?.toISOString().split('T')[0]}
        `;

        const incentiveData = await sql`
          SELECT COALESCE(SUM(amount), 0) as total FROM incentives 
          WHERE rider_id = ${entry.cee_id} 
          AND incentive_date >= ${startDate?.toISOString().split('T')[0]}
          AND incentive_date <= ${endDate?.toISOString().split('T')[0]}
        `;

        const advanceData = await sql`
          SELECT COALESCE(SUM(amount), 0) as total FROM advances 
          WHERE rider_id = ${entry.cee_id} 
          AND requested_at >= ${startDate?.toISOString().split('T')[0]}
          AND requested_at <= ${endDate?.toISOString().split('T')[0]}
        `;

        const deductionData = await sql`
          SELECT COALESCE(SUM(amount), 0) as total FROM deductions 
          WHERE rider_id = ${entry.cee_id} 
          AND deduction_date >= ${startDate?.toISOString().split('T')[0]}
          AND deduction_date <= ${endDate?.toISOString().split('T')[0]}
        `;

        const totalReferrals = parseFloat(referralData[0]?.total || 0);
        const totalIncentives = parseFloat(incentiveData[0]?.total || 0);
        const totalAdvances = parseFloat(advanceData[0]?.total || 0);
        const totalDeductions = parseFloat(deductionData[0]?.total || 0);

        // Final Amount = Referrals + Incentives - Advances - Deductions
        const finalAmount = totalReferrals + totalIncentives - totalAdvances - totalDeductions;
        
        // Convert base_payout to number
        const basePayout = parseFloat(entry.base_payout) || 0;
        
        // Final Payout = Base Payout + Final Amount (Final Amount is already signed)
        const finalPayout = basePayout + finalAmount;

        return {
          cee_id: entry.cee_id,
          rider_name: entry.rider_name,
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
