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
          WHERE referrer_id = ${rider_id}
          AND approval_status = 'approved'
          AND created_at >= ${startDateStr}::date
          AND created_at <= ${endDateStr}::date
        `;

        // Fetch incentives
        const incentiveData = await sql`
          SELECT COALESCE(SUM(amount), 0) as total FROM incentives 
          WHERE rider_id = ${rider_id}
          AND incentive_date >= ${startDateStr}::date
          AND incentive_date <= ${endDateStr}::date
        `;

        // Fetch approved advances
        const advanceData = await sql`
          SELECT COALESCE(SUM(amount), 0) as total FROM advances 
          WHERE rider_id = ${rider_id}
          AND status = 'approved'
          AND requested_at >= ${startDateStr}::date
          AND requested_at <= ${endDateStr}::date
        `;

        // Fetch deductions
        const deductionData = await sql`
          SELECT COALESCE(SUM(amount), 0) as total FROM deductions 
          WHERE rider_id = ${rider_id}
          AND deduction_date >= ${startDateStr}::date
          AND deduction_date <= ${endDateStr}::date
        `;

        const totalReferrals = parseFloat(referralData[0]?.total || 0);
        const totalIncentives = parseFloat(incentiveData[0]?.total || 0);
        const totalAdvances = parseFloat(advanceData[0]?.total || 0);
        const totalDeductions = parseFloat(deductionData[0]?.total || 0);

        // Calculate vehicle rent
        let totalVehicleRent = 0;
        if (vehicleOwnership === "company_ev") {
          const dailyRent = riderInfo[0]?.ev_daily_rent || 
                           (riderInfo[0]?.ev_type === "sunmobility_swap" ? 243 : 215);
          
          let riderJoinDate: Date | null = null;
          if (riderInfo[0]?.join_date) {
            riderJoinDate = new Date(riderInfo[0].join_date);
          }

          let currentDate = new Date(startDate);
          let daysCount = 0;
          while (currentDate <= endDate) {
            if (!riderJoinDate || currentDate >= riderJoinDate) {
              daysCount++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }

          totalVehicleRent = dailyRent * daysCount;
        }

        // Calculate final amounts
        const totalAdditions = totalReferrals + totalIncentives;
        const finalAmount = totalAdditions - totalAdvances - totalDeductions - totalVehicleRent;
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
          // Update existing
          await sql`
            UPDATE payouts
            SET 
              base_payout = ${basePayout},
              total_incentives = ${totalAdditions},
              total_deductions = ${totalAdvances + totalDeductions + totalVehicleRent},
              net_payout = ${finalPayout},
              status = 'finalized'
            WHERE id = ${existingPayout[0].id}
          `;
        } else {
          // Insert new
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
              ${totalAdditions},
              ${totalAdvances + totalDeductions + totalVehicleRent},
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
