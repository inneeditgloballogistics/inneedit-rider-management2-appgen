import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { week, month, year } = await request.json();

    if (!week || !month || !year) {
      return NextResponse.json(
        { message: "Missing required fields: week, month, year" },
        { status: 400 }
      );
    }

    // Get all payout entries for this week
    const payoutEntries = await sql`
      SELECT DISTINCT cee_id, base_payout FROM payout_entries
      WHERE year = ${year}
      AND month = ${month}
      AND week = ${week}
    `;

    if (payoutEntries.length === 0) {
      return NextResponse.json(
        { message: "No payout entries found for this week. Please upload invoice first." },
        { status: 404 }
      );
    }

    // Calculate week date range
    let startDate: Date, endDate: Date;

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
      endDate = new Date(year, month, 0);
    } else {
      return NextResponse.json(
        { message: "Invalid week number. Must be 1-4" },
        { status: 400 }
      );
    }

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    let finalizedCount = 0;
    let errors: string[] = [];

    // Process each rider
    for (const entry of payoutEntries) {
      try {
        const cee_id = entry.cee_id;
        const basePayout = parseFloat(entry.base_payout) || 0;

        // Get rider info - ONLY match by cee_id, no fallback to name
        const riderInfo = await sql`
          SELECT user_id, vehicle_ownership, ev_daily_rent, ev_type, join_date 
          FROM riders
          WHERE cee_id = ${cee_id}
          LIMIT 1
        `;

        if (riderInfo.length === 0) {
          errors.push(`Rider not found for CEE ID: ${cee_id}. Please ensure the CEE ID in the invoice matches exactly with the CEE ID in the system.`);
          continue;
        }

        const rider_id = riderInfo[0].user_id;
        const vehicleOwnership = riderInfo[0].vehicle_ownership || null;

        // Fetch referral bonuses
        const referralData = await sql`
          SELECT COALESCE(SUM(amount), 0) as total FROM referrals 
          WHERE referrer_cee_id = ${cee_id}
          AND approval_status = 'approved'
          AND created_at >= ${startDateStr}::date
          AND created_at <= ${endDateStr}::date
        `;

        // Fetch incentives
        const incentiveData = await sql`
          SELECT COALESCE(SUM(amount), 0) as total FROM incentives 
          WHERE cee_id = ${cee_id}
          AND incentive_date >= ${startDateStr}::date
          AND incentive_date <= ${endDateStr}::date
        `;

        // Fetch approved advances
        const advanceData = await sql`
          SELECT COALESCE(SUM(amount), 0) as total FROM advances 
          WHERE cee_id = ${cee_id}
          AND status = 'approved'
          AND requested_at >= ${startDateStr}::date
          AND requested_at <= ${endDateStr}::date
        `;

        // Fetch deductions
        const deductionData = await sql`
          SELECT COALESCE(SUM(amount), 0) as total FROM deductions 
          WHERE cee_id = ${cee_id}
          AND deduction_date >= ${startDateStr}::date
          AND deduction_date <= ${endDateStr}::date
        `;

        const totalReferrals = parseFloat(referralData[0]?.total || 0);
        const totalIncentives = parseFloat(incentiveData[0]?.total || 0);
        const totalAdvances = parseFloat(advanceData[0]?.total || 0);
        const totalDeductions = parseFloat(deductionData[0]?.total || 0);

        // NEW FORMULA:
        // Final Amount = All Additions - All Deductions - Vehicle Rent
        // Final Payout = Base Payout + Final Amount
        
        const allAdditions = totalReferrals + totalIncentives;
        const allDeductions = totalAdvances + totalDeductions;
        
        // Calculate vehicle rent dynamically
        let vehicleRent = 0;
        if (vehicleOwnership === 'company_ev') {
          let riderJoinDate: Date | null = null;
          if (riderInfo[0]?.join_date) {
            const dateObj = new Date(riderInfo[0].join_date);
            if (!isNaN(dateObj.getTime())) {
              const y = dateObj.getUTCFullYear();
              const m = dateObj.getUTCMonth() + 1;
              const d = dateObj.getUTCDate();
              riderJoinDate = new Date(Date.UTC(y, m - 1, d));
            }
          }
          
          let dailyRent = 0;
          const evDailyRent = riderInfo[0]?.ev_daily_rent || null;
          const evType = riderInfo[0]?.ev_type;
          
          if (evDailyRent && evDailyRent > 0) {
            dailyRent = Number(evDailyRent);
          } else if (evType === 'sunmobility_swap') {
            dailyRent = 243;
          } else if (evType === 'fixed_battery') {
            dailyRent = 215;
          }
          
          if (dailyRent > 0) {
            const startDate = new Date(`${startDateStr}T00:00:00Z`);
            const endDate = new Date(`${endDateStr}T00:00:00Z`);
            let currentDate = new Date(startDate);
            let daysCount = 0;
            
            while (currentDate <= endDate) {
              if (!riderJoinDate || currentDate >= riderJoinDate) {
                daysCount++;
              }
              currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            }
            
            vehicleRent = dailyRent * daysCount;
          }
        }
        
        const finalAmount = allAdditions - allDeductions - vehicleRent;
        const finalPayout = basePayout + finalAmount;

        // Check if payout exists
        const existingPayout = await sql`
          SELECT id FROM payouts
          WHERE rider_id = ${rider_id}
          AND week_number = ${week}
          AND month = ${month}
          AND year = ${year}
          LIMIT 1
        `;

        if (existingPayout.length > 0) {
          // Update existing with new formula
          await sql`
            UPDATE payouts
            SET 
              base_payout = ${basePayout},
              total_incentives = ${allAdditions},
              total_deductions = ${allDeductions},
              net_payout = ${finalPayout},
              final_amount = ${finalAmount},
              final_payout = ${finalPayout},
              status = 'finalized'
            WHERE id = ${existingPayout[0].id}
          `;
        } else {
          // Insert new with new formula
          await sql`
            INSERT INTO payouts (
              rider_id,
              week_number,
              week_period,
              month,
              year,
              base_payout,
              total_incentives,
              total_deductions,
              net_payout,
              final_amount,
              final_payout,
              status,
              created_at
            )
            VALUES (
              ${rider_id},
              ${week},
              ${'Week ' + week},
              ${month},
              ${year},
              ${basePayout},
              ${allAdditions},
              ${allDeductions},
              ${finalPayout},
              ${finalAmount},
              ${finalPayout},
              'finalized',
              NOW()
            )
          `;
        }

        finalizedCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Error processing ${entry.cee_id}: ${msg}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Payouts finalized for ${finalizedCount} rider(s)`,
      count: finalizedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Error finalizing payouts", error: String(error) },
      { status: 500 }
    );
  }
}
