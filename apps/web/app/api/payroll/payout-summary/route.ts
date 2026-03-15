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

    // Fetch payout entries with rider details
    let payouts = await sql`
      SELECT 
        pe.cee_id,
        pe.rider_name,
        pe.week,
        pe.base_payout,
        r.user_id as rider_id,
        r.vehicle_ownership,
        r.join_date,
        r.is_leader,
        r.leader_discount_percentage,
        r.ev_daily_rent,
        r.ev_type,
        COALESCE(
          (
            SELECT SUM(COALESCE(amount, 0))::numeric FROM additions 
            WHERE cee_id = pe.cee_id
            AND entry_date >= ${weekStart}::date
            AND entry_date <= ${weekEnd}::date
          ),
          0
        ) as total_additions,
        COALESCE(
          (
            SELECT SUM(COALESCE(amount, 0))::numeric FROM deductions 
            WHERE cee_id = pe.cee_id
            AND entry_date >= ${weekStart}::date
            AND entry_date <= ${weekEnd}::date
          ),
          0
        ) as total_deductions
      FROM payout_entries pe
      LEFT JOIN riders r ON r.cee_id = pe.cee_id
      WHERE pe.year = ${year} AND pe.month = ${month} AND pe.week = ${week}
      ORDER BY pe.cee_id ASC
    `;

    // Calculate vehicle rent for each rider based on current rider settings
    payouts = payouts.map((entry: any) => {
      let vehicleRent = 0;

      if (entry.vehicle_ownership === 'company_ev') {
        let baseDailyRent = 0;
        
        if (entry.ev_daily_rent && entry.ev_daily_rent > 0) {
          baseDailyRent = Number(entry.ev_daily_rent);
        } else if (entry.ev_type === 'sunmobility_swap') {
          baseDailyRent = 243;
        } else if (entry.ev_type === 'fixed_battery') {
          baseDailyRent = 215;
        }

        // Apply leader discount if applicable
        let dailyVehicleRentAmount = baseDailyRent;
        const isLeader = entry.is_leader || false;
        const leaderDiscountPercentage = entry.leader_discount_percentage || 0;
        
        if (isLeader && leaderDiscountPercentage > 0) {
          const discountAmount = baseDailyRent * (leaderDiscountPercentage / 100);
          dailyVehicleRentAmount = baseDailyRent - discountAmount;
        }

        // Count eligible days based on join_date
        let eligibleDays = 7; // Default to 7 days for the week
        if (entry.join_date) {
          const joinDate = new Date(entry.join_date);
          const joinDateUTC = new Date(Date.UTC(joinDate.getUTCFullYear(), joinDate.getUTCMonth(), joinDate.getUTCDate()));
          const weekStartDate = new Date(`${weekStart}T00:00:00Z`);
          
          if (joinDateUTC > weekStartDate) {
            // Rider joined during this week, count from join date
            const weekEndDate = new Date(`${weekEnd}T00:00:00Z`);
            const daysInWeek = Math.floor((weekEndDate.getTime() - joinDateUTC.getTime()) / (24 * 60 * 60 * 1000)) + 1;
            eligibleDays = Math.max(0, daysInWeek);
          }
        }

        vehicleRent = eligibleDays * dailyVehicleRentAmount;
      }
      
      entry.vehicle_rent = vehicleRent;
      return entry;
    });

    // Convert to required format
    console.log(`Payout summary query returned ${payouts.length} entries for week ${week}, month ${month}, year ${year}`);

    const result = payouts.map((entry: any) => {
      const allAdditions = parseFloat(entry.total_additions) || 0;
      const allDeductions = parseFloat(entry.total_deductions) || 0;
      const vehicleRent = entry.vehicle_rent !== undefined ? parseFloat(String(entry.vehicle_rent)) : 0;
      const finalAmount = allAdditions - allDeductions - vehicleRent;
      const basePayout = parseFloat(entry.base_payout) || 0;
      const finalPayout = basePayout + finalAmount;
      
      console.log(`Rider ${entry.cee_id}: Vehicle Rent = ${vehicleRent}, Additions = ${allAdditions}, Deductions = ${allDeductions}`);
      
      return {
        cee_id: entry.cee_id,
        rider_name: entry.rider_name,
        rider_id: entry.rider_id,
        week: entry.week,
        base_payout: basePayout,
        all_additions: allAdditions,
        all_deductions: allDeductions,
        vehicle_rent: vehicleRent,
        final_amount: finalAmount,
        final_payout: finalPayout
      };
    });

    console.log(`Returning ${result.length} processed payout entries`);
    return NextResponse.json({ payouts: result }, { status: 200 });
  } catch (error) {
    console.error("Error fetching payout summary:", error);
    return NextResponse.json({ message: "Error fetching payout summary", payouts: [] }, { status: 500 });
  }
}
