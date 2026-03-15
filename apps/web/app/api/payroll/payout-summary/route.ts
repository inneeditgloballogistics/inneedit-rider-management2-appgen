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
    const payouts = await sql`
      SELECT 
        pe.cee_id,
        pe.rider_name,
        pe.week,
        pe.base_payout,
        r.user_id as rider_id,
        r.vehicle_ownership,
        r.join_date,
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
        ) as total_deductions,
        COALESCE(
          (
            SELECT SUM(daily_rent_amount) FROM vehicle_rent 
            WHERE cee_id = pe.cee_id
            AND rent_date >= ${weekStart}::date
            AND rent_date <= ${weekEnd}::date
            AND (r.join_date IS NULL OR rent_date >= CAST(r.join_date AS date))
          ),
          0
        ) as vehicle_rent
      FROM payout_entries pe
      LEFT JOIN riders r ON r.cee_id = pe.cee_id
      WHERE pe.year = ${year} AND pe.month = ${month} AND pe.week = ${week}
      ORDER BY pe.cee_id ASC
    `;

    // Convert to required format
    console.log(`Payout summary query returned ${payouts.length} entries for week ${week}, month ${month}, year ${year}`);

    const result = payouts.map((entry: any) => {
      const allAdditions = parseFloat(entry.total_additions) || 0;
      const allDeductions = parseFloat(entry.total_deductions) || 0;
      const vehicleRent = parseFloat(entry.vehicle_rent) || 0;
      const finalAmount = allAdditions - allDeductions - vehicleRent;
      const basePayout = parseFloat(entry.base_payout) || 0;
      const finalPayout = basePayout + finalAmount;
      
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
