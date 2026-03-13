import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { rider_id, week, month, year } = await request.json();

    if (!rider_id || !week || !month || !year) {
      return NextResponse.json(
        { message: "Missing required fields: rider_id, week, month, year" },
        { status: 400 }
      );
    }

    // Get rider info
    const riderInfo = await sql`
      SELECT cee_id, full_name, vehicle_ownership, ev_daily_rent, ev_type, join_date 
      FROM riders
      WHERE user_id = ${rider_id} OR cee_id = ${rider_id}
      LIMIT 1
    `;

    if (riderInfo.length === 0) {
      return NextResponse.json(
        { message: "Rider not found" },
        { status: 404 }
      );
    }

    const cee_id = riderInfo[0].cee_id;
    const full_name = riderInfo[0].full_name;
    const vehicleOwnership = riderInfo[0].vehicle_ownership;

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
      endDate = new Date(year, month + 1, 0);
    }

    const startDateStr = startDate?.toISOString().split("T")[0];
    const endDateStr = endDate?.toISOString().split("T")[0];

    // Fetch all additions (referrals + incentives)
    const referralData = await sql`
      SELECT COALESCE(SUM(amount), 0) as total FROM referrals 
      WHERE referrer_id = ${rider_id}
      AND approval_status = 'approved'
      AND DATE(created_at) >= ${startDateStr}
      AND DATE(created_at) <= ${endDateStr}
    `;

    const incentiveData = await sql`
      SELECT COALESCE(SUM(amount), 0) as total FROM incentives 
      WHERE rider_id = ${rider_id}
      AND DATE(created_at) >= ${startDateStr}
      AND DATE(created_at) <= ${endDateStr}
    `;

    // Fetch all deductions (advances + other deductions)
    const advanceData = await sql`
      SELECT COALESCE(SUM(amount), 0) as total FROM advances 
      WHERE (rider_id = ${rider_id} OR cee_id = ${cee_id})
      AND status = 'approved'
      AND DATE(requested_at) >= ${startDateStr}
      AND DATE(requested_at) <= ${endDateStr}
    `;

    const deductionData = await sql`
      SELECT COALESCE(SUM(amount), 0) as total FROM deductions 
      WHERE rider_id = ${rider_id}
      AND DATE(deduction_date) >= ${startDateStr}
      AND DATE(deduction_date) <= ${endDateStr}
    `;

    // Get base payout from payout_entries
    const payoutEntryData = await sql`
      SELECT base_payout FROM payout_entries
      WHERE cee_id = ${cee_id}
      AND year = ${year}
      AND month = ${month}
      AND week = ${week}
      LIMIT 1
    `;

    if (payoutEntryData.length === 0) {
      return NextResponse.json(
        { message: "No payout entry found for this week. Please upload invoice first." },
        { status: 404 }
      );
    }

    const basePayout = parseFloat(payoutEntryData[0].base_payout) || 0;
    const totalReferrals = parseFloat(referralData[0]?.total || 0);
    const totalIncentives = parseFloat(incentiveData[0]?.total || 0);
    const totalAdvances = parseFloat(advanceData[0]?.total || 0);
    const totalDeductions = parseFloat(deductionData[0]?.total || 0);

    // Calculate vehicle rent
    let totalVehicleRent = 0;
    if (vehicleOwnership === "company_ev") {
      const dailyRent = riderInfo[0]?.ev_daily_rent || 
                       (riderInfo[0]?.ev_type === "sunmobility_swap" ? 243 : 215);
      
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

    // Calculate using the formula: Final Amount = Additions - Deductions - Vehicle Rent
    const totalAdditions = totalReferrals + totalIncentives;
    const finalAmount = totalAdditions - totalAdvances - totalDeductions - totalVehicleRent;

    // Final Payout = Base Payout + Final Amount
    const finalPayout = basePayout + finalAmount;

    // Update payouts table
    const existingPayout = await sql`
      SELECT id FROM payouts
      WHERE rider_id = ${rider_id}
      AND week_number = ${week}
      AND month = ${month}
      AND year = ${year}
      LIMIT 1
    `;

    let result;
    if (existingPayout.length > 0) {
      // Update existing payout
      result = await sql`
        UPDATE payouts
        SET 
          base_payout = ${basePayout},
          total_incentives = ${totalAdditions},
          total_deductions = ${totalAdvances + totalDeductions + totalVehicleRent},
          net_payout = ${finalPayout},
          status = 'finalized'
        WHERE id = ${existingPayout[0].id}
        RETURNING *
      `;
    } else {
      // Create new payout entry
      result = await sql`
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
          ${`Week ${week}`},
          ${month},
          ${year},
          ${basePayout},
          ${totalAdditions},
          ${totalAdvances + totalDeductions + totalVehicleRent},
          ${finalPayout},
          'finalized',
          NOW()
        )
        RETURNING *
      `;
    }

    return NextResponse.json({
      success: true,
      message: "Payout finalized successfully",
      payout: {
        rider_id,
        cee_id,
        week,
        month,
        year,
        basePayout,
        additions: {
          referrals: totalReferrals,
          incentives: totalIncentives,
          total: totalAdditions,
        },
        deductions: {
          advances: totalAdvances,
          otherDeductions: totalDeductions,
          vehicleRent: totalVehicleRent,
          total: totalAdvances + totalDeductions + totalVehicleRent,
        },
        finalAmount,
        finalPayout,
      },
    });
  } catch (error) {
    console.error("Error finalizing payout:", error);
    return NextResponse.json(
      { message: "Error finalizing payout", error: String(error) },
      { status: 500 }
    );
  }
}
