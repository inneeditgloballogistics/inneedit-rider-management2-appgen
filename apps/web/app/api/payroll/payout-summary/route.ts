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

    // Fetch payout entries with final_amount calculated using new formula:
    // All Additions (Incentives + Referrals) - All Deductions (Advances + Deductions) - Vehicle Rent (day-wise actual from table) = Final Amount
    const payouts = await sql`
      SELECT 
        pe.cee_id,
        pe.rider_name,
        pe.week,
        pe.base_payout,
        r.user_id as rider_id,
        (
          COALESCE(
            (
              SELECT SUM(COALESCE(amount, 0)) FROM incentives 
              WHERE rider_id = pe.cee_id 
              AND incentive_date >= ${weekStart}::date
              AND incentive_date <= ${weekEnd}::date
            ),
            0
          ) +
          COALESCE(
            (
              SELECT SUM(COALESCE(amount, 0)) FROM referrals 
              WHERE referrer_cee_id = pe.cee_id 
              AND created_at >= ${weekStart}::date
              AND created_at <= ${weekEnd}::date
              AND approval_status = 'approved'
            ),
            0
          )
        ) -
        (
          COALESCE(
            (
              SELECT SUM(COALESCE(amount, 0)) FROM advances 
              WHERE rider_id = pe.cee_id
              AND requested_at >= ${weekStart}::date
              AND requested_at <= ${weekEnd}::date
              AND status = 'approved'
            ),
            0
          ) +
          COALESCE(
            (
              SELECT SUM(COALESCE(amount, 0)) FROM deductions 
              WHERE rider_id = pe.cee_id 
              AND deduction_date >= ${weekStart}::date
              AND deduction_date <= ${weekEnd}::date
            ),
            0
          )
        ) -
        COALESCE(
          (
            SELECT SUM(COALESCE(daily_rent_amount, 0)) FROM vehicle_rent 
            WHERE rider_id = pe.cee_id
            AND rent_date >= ${weekStart}::date
            AND rent_date <= ${weekEnd}::date
          ),
          0
        ) as final_amount
      FROM payout_entries pe
      LEFT JOIN riders r ON r.cee_id = pe.cee_id
      WHERE pe.year = ${year} AND pe.month = ${month} AND pe.week = ${week}
      ORDER BY pe.cee_id ASC
    `;

    // Convert to required format
    const result = payouts.map((entry: any) => ({
      cee_id: entry.cee_id,
      rider_name: entry.rider_name,
      rider_id: entry.rider_id,
      week: entry.week,
      base_payout: parseFloat(entry.base_payout) || 0,
      final_amount: parseFloat(entry.final_amount) || 0,
      final_payout: parseFloat(entry.base_payout) + parseFloat(entry.final_amount) || 0
    }));

    return NextResponse.json({ payouts: result }, { status: 200 });
  } catch (error) {
    console.error("Error fetching payout summary:", error);
    return NextResponse.json({ message: "Error fetching payout summary", payouts: [] }, { status: 500 });
  }
}
