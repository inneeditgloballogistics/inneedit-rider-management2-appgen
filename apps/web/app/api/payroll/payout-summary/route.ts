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
          endDate = new Date(year, month + 1, 0); // Last day of month\n        }\n\n        // Fetch all payroll entries (referrals, incentives, advances, deductions)\n        const referralData = await sql`\n          SELECT COALESCE(SUM(amount), 0) as total FROM referrals \n          WHERE referrer_id = ${entry.cee_id} \n          AND created_at >= ${startDate.toISOString().split('T')[0]}\n          AND created_at <= ${endDate.toISOString().split('T')[0]}\n        `;\n\n        const incentiveData = await sql`\n          SELECT COALESCE(SUM(amount), 0) as total FROM incentives \n          WHERE rider_id = ${entry.cee_id} \n          AND incentive_date >= ${startDate.toISOString().split('T')[0]}\n          AND incentive_date <= ${endDate.toISOString().split('T')[0]}\n        `;\n\n        const advanceData = await sql`\n          SELECT COALESCE(SUM(amount), 0) as total FROM advances \n          WHERE rider_id = ${entry.cee_id} \n          AND requested_at >= ${startDate.toISOString().split('T')[0]}\n          AND requested_at <= ${endDate.toISOString().split('T')[0]}\n        `;\n\n        const deductionData = await sql`\n          SELECT COALESCE(SUM(amount), 0) as total FROM deductions \n          WHERE rider_id = ${entry.cee_id} \n          AND deduction_date >= ${startDate.toISOString().split('T')[0]}\n          AND deduction_date <= ${endDate.toISOString().split('T')[0]}\n        `;\n\n        const totalReferrals = parseFloat(referralData[0]?.total || 0);\n        const totalIncentives = parseFloat(incentiveData[0]?.total || 0);\n        const totalAdvances = parseFloat(advanceData[0]?.total || 0);\n        const totalDeductions = parseFloat(deductionData[0]?.total || 0);\n\n        // Final Amount = Referrals + Incentives - Advances - Deductions\n        const finalAmount = totalReferrals + totalIncentives - totalAdvances - totalDeductions;\n        \n        // Final Payout = Base Payout - Final Amount\n        const finalPayout = entry.base_payout - finalAmount;\n\n        return {\n          cee_id: entry.cee_id,\n          rider_name: entry.rider_name,\n          week: entry.week,\n          base_payout: parseFloat(entry.base_payout),\n          final_amount: finalAmount,\n          final_payout: finalPayout\n        };\n      })\n    );\n\n    return NextResponse.json({ payouts }, { status: 200 });\n  } catch (error) {\n    console.error(\"Error fetching payout summary:\", error);\n    return NextResponse.json({ message: \"Error fetching payout summary\", payouts: [] }, { status: 500 });\n  }\n}
