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

    // Process each rider using ONLY cee_id
    for (const entry of payoutEntries) {
      try {
        const cee_id = entry.cee_id;
        const basePayout = parseFloat(entry.base_payout) || 0;

        // Get rider info - ONLY match by cee_id
        const riderInfo = await sql`
          SELECT vehicle_ownership, ev_daily_rent, ev_type, join_date, is_leader, leader_discount_percentage
          FROM riders
          WHERE cee_id = ${cee_id}
          LIMIT 1
        `;

        if (riderInfo.length === 0) {
          errors.push(`Rider not found for CEE ID: ${cee_id}. Please ensure the CEE ID in the invoice matches exactly with the CEE ID in the system.`);
          continue;
        }

        const vehicleOwnership = riderInfo[0].vehicle_ownership || null;

        // Fetch all additions (referrals, incentives, bonuses, etc.)
        const additionsData = await sql`
          SELECT COALESCE(SUM(amount), 0) as total FROM additions 
          WHERE cee_id = ${cee_id}
          AND entry_date >= ${startDateStr}::date
          AND entry_date <= ${endDateStr}::date
        `;

        // Fetch all deductions (advances, damages, challans, etc.) - ONLY approved ones
        const deductionsData = await sql`
          SELECT COALESCE(SUM(amount), 0) as total FROM deductions 
          WHERE cee_id = ${cee_id}
          AND status = 'approved'
          AND entry_date >= ${startDateStr}::date
          AND entry_date <= ${endDateStr}::date
        `;

        const allAdditions = parseFloat(additionsData[0]?.total || 0);
        const allDeductions = parseFloat(deductionsData[0]?.total || 0);
        
        // OPTION 1: Calculate FINAL vehicle rent amount and store it (NOT the base + discount separately)
        let totalVehicleRent = 0;
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
          
          // Get base daily rent
          let baseDailyRent = 0;
          const evDailyRent = riderInfo[0]?.ev_daily_rent || null;
          const evType = riderInfo[0]?.ev_type;
          
          if (evDailyRent && evDailyRent > 0) {
            baseDailyRent = Number(evDailyRent);
          } else if (evType === 'sunmobility_swap') {
            baseDailyRent = 243;
          } else if (evType === 'fixed_battery') {
            baseDailyRent = 215;
          }
          
          // Apply leader discount if applicable to get FINAL amount
          const isLeader = riderInfo[0]?.is_leader || false;
          const leaderDiscountPercentage = riderInfo[0]?.leader_discount_percentage || 0;
          let finalDailyVehicleRentAmount = baseDailyRent;  // Start with base
          
          if (isLeader && leaderDiscountPercentage > 0) {
            const discountAmount = baseDailyRent * (leaderDiscountPercentage / 100);
            finalDailyVehicleRentAmount = baseDailyRent - discountAmount;
          }
          
          // Delete existing vehicle rent entries for this week first
          await sql`
            DELETE FROM vehicle_rent
            WHERE cee_id = ${cee_id}
            AND rent_date >= ${startDateStr}::date
            AND rent_date <= ${endDateStr}::date
          `;
          
          // Now insert DAILY records with the FINAL amount (no base_daily_rent or discount stored)
          const startDateObj = new Date(`${startDateStr}T00:00:00Z`);
          const endDateObj = new Date(`${endDateStr}T00:00:00Z`);
          let currentDate = new Date(startDateObj);
          
          while (currentDate <= endDateObj) {
            if (!riderJoinDate || currentDate >= riderJoinDate) {
              const dateStr = currentDate.toISOString().split('T')[0];
              
              // OPTION 1: Store ONLY the final calculated amount
              await sql`
                INSERT INTO vehicle_rent (
                  cee_id,
                  rent_date,
                  daily_rent_amount,
                  description,
                  status,
                  created_at
                ) VALUES (
                  ${cee_id},
                  ${dateStr}::date,
                  ${finalDailyVehicleRentAmount},
                  'Auto-deducted vehicle rent',
                  'AUTO DEDUCTED',
                  NOW()
                )
              `;
              
              totalVehicleRent += finalDailyVehicleRentAmount;
            }
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
          }
        }
        
        const finalAmount = allAdditions - allDeductions - totalVehicleRent;
        const finalPayout = basePayout + finalAmount;

        // Check if payout exists
        const existingPayout = await sql`
          SELECT id FROM payouts
          WHERE cee_id = ${cee_id}
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
              cee_id,
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
              ${cee_id},
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
