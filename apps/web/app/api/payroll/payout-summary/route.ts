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

        // Get rider info for vehicle rent calculation
        const riderInfo = await sql`
          SELECT vehicle_ownership, ev_daily_rent, ev_type, join_date FROM riders
          WHERE cee_id = ${entry.cee_id}
          LIMIT 1
        `;
        
        const totalReferrals = parseFloat(referralData[0]?.total || 0);
        const totalIncentives = parseFloat(incentiveData[0]?.total || 0);
        const totalAdvances = parseFloat(advanceData[0]?.total || 0);
        const totalDeductions = parseFloat(deductionData[0]?.total || 0);

        // Calculate vehicle rent
        let totalVehicleRent = 0;
        if (riderInfo && riderInfo[0]?.vehicle_ownership === 'company_ev') {
          const dailyRent = riderInfo[0]?.ev_daily_rent || 
                           (riderInfo[0]?.ev_type === 'sunmobility_swap' ? 243 : 215);
          
          // Parse join_date
          let riderJoinDate: Date | null = null;
          if (riderInfo[0]?.join_date) {
            const joinDateStr = riderInfo[0].join_date;
            const dateObj = new Date(joinDateStr);
            if (!isNaN(dateObj.getTime())) {
              const year = dateObj.getUTCFullYear();
              const month = dateObj.getUTCMonth() + 1;
              const day = dateObj.getUTCDate();
              riderJoinDate = new Date(Date.UTC(year, month - 1, day));
            }
          }
          
          // Count days in week, considering join_date
          let currentDate = new Date(startDate);
          let daysCount = 0;
          while (currentDate <= endDate) {
            // Only count if rider has joined
            if (!riderJoinDate || currentDate >= riderJoinDate) {
              daysCount++;
            }
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
          }
          
          totalVehicleRent = dailyRent * daysCount;
        }

        // Final Amount = Referrals + Incentives - Advances - Deductions - Vehicle Rent
        const finalAmount = totalReferrals + totalIncentives - totalAdvances - totalDeductions - totalVehicleRent;
        
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
