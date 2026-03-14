import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { year, month, week } = await request.json();

    // Calculate week start and end dates using PostgreSQL syntax
    const weekDates = {
      1: { start: `${year}-${String(month).padStart(2, '0')}-01`, end: `${year}-${String(month).padStart(2, '0')}-07` },
      2: { start: `${year}-${String(month).padStart(2, '0')}-08`, end: `${year}-${String(month).padStart(2, '0')}-14` },
      3: { start: `${year}-${String(month).padStart(2, '0')}-15`, end: `${year}-${String(month).padStart(2, '0')}-21` },
      4: { start: `${year}-${String(month).padStart(2, '0')}-22`, end: `${year}-${String(month).padStart(2, '0')}-31` }
    };

    const weekStart = weekDates[week as keyof typeof weekDates].start;
    const weekEnd = weekDates[week as keyof typeof weekDates].end;

    // Fetch payout entries with rider details for vehicle rent calculation
    const payouts = await sql`
      SELECT 
        pe.cee_id,
        pe.rider_name,
        pe.week,
        pe.base_payout,
        r.user_id as rider_id,
        r.vehicle_ownership,
        r.ev_daily_rent,
        r.ev_type,
        r.join_date,
        COALESCE(
          (
            SELECT SUM(COALESCE(amount, 0))::numeric FROM incentives 
            WHERE (rider_id = pe.cee_id OR rider_id = r.user_id)
            AND incentive_date >= ${weekStart}::date
            AND incentive_date <= ${weekEnd}::date
          ),
          0
        ) as total_incentives,
        COALESCE(
          (
            SELECT SUM(COALESCE(amount, 0))::numeric FROM referrals 
            WHERE referrer_cee_id = pe.cee_id
            AND CAST(created_at AS DATE) >= ${weekStart}::date
            AND CAST(created_at AS DATE) <= ${weekEnd}::date
            AND approval_status = 'approved'
          ),
          0
        ) as total_referrals,
        COALESCE(
          (
            SELECT SUM(COALESCE(amount, 0))::numeric FROM advances 
            WHERE (cee_id = pe.cee_id OR rider_id = r.user_id)
            AND CAST(requested_at AS DATE) >= ${weekStart}::date
            AND CAST(requested_at AS DATE) <= ${weekEnd}::date
            AND status = 'approved'
          ),
          0
        ) as total_advances,
        COALESCE(
          (
            SELECT SUM(COALESCE(amount, 0))::numeric FROM deductions 
            WHERE (rider_id = pe.cee_id OR rider_id = r.user_id)
            AND deduction_date >= ${weekStart}::date
            AND deduction_date <= ${weekEnd}::date
          ),
          0
        ) as total_deductions
      FROM payout_entries pe
      LEFT JOIN riders r ON r.cee_id = pe.cee_id
      WHERE pe.year = ${year} AND pe.month = ${month} AND pe.week = ${week}
      ORDER BY pe.cee_id ASC
    `;

    // Convert to required format and calculate vehicle rent dynamically
    const result = payouts.map((entry: any) => {
      // Calculate vehicle rent based on rider's vehicle type
      let vehicleRent = 0;
      
      if (entry.vehicle_ownership === 'company_ev') {
        // Parse dates for comparison
        const startDate = new Date(`${weekStart}T00:00:00Z`);
        const endDate = new Date(`${weekEnd}T00:00:00Z`);
        
        // Determine daily rent
        let dailyRent = 0;
        if (entry.ev_daily_rent && entry.ev_daily_rent > 0) {
          dailyRent = Number(entry.ev_daily_rent);
        } else if (entry.ev_type === 'sunmobility_swap') {
          dailyRent = 243;
        } else if (entry.ev_type === 'fixed_battery') {
          dailyRent = 215;
        }

        if (dailyRent > 0) {
          // Calculate number of days in the week for which the rider is eligible
          let daysCount = 0;
          let currentDate = new Date(startDate);
          
          // Parse rider join date if exists
          let riderJoinDate: Date | null = null;
          if (entry.join_date) {
            riderJoinDate = new Date(entry.join_date);
          }

          while (currentDate <= endDate) {
            // Only count if rider has joined
            if (!riderJoinDate || currentDate >= riderJoinDate) {
              daysCount++;
            }
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
          }

          vehicleRent = dailyRent * daysCount;
        }
      }

      const totalAdditions = parseFloat(entry.total_incentives) + parseFloat(entry.total_referrals);
      const totalDeductions = parseFloat(entry.total_advances) + parseFloat(entry.total_deductions);
      const finalAmount = totalAdditions - totalDeductions - vehicleRent;
      
      return {
        cee_id: entry.cee_id,
        rider_name: entry.rider_name,
        rider_id: entry.rider_id,
        week: entry.week,
        base_payout: parseFloat(entry.base_payout) || 0,
        final_amount: finalAmount,
        final_payout: parseFloat(entry.base_payout) + finalAmount
      };
    });

    return NextResponse.json({ payouts: result }, { status: 200 });
  } catch (error) {
    console.error("Error fetching payout summary:", error);
    return NextResponse.json({ message: "Error fetching payout summary", payouts: [] }, { status: 500 });
  }
}
