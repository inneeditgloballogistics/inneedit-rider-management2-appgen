import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { rider_id, date } = await request.json();

    if (!rider_id || !date) {
      return NextResponse.json(
        { error: "Missing rider_id or date" },
        { status: 400 }
      );
    }

    console.log("=== ENTRIES-BY-DATE API ===");
    console.log("Received rider_id:", rider_id);
    console.log("Received date:", date);
    console.log("Date type:", typeof date);

    // Convert date string to proper format for comparison
    const dateStr = date + '%'; // Add % for LIKE matching to handle timezone

    // Fetch entries from all tables for the specified date
    const [referrals, incentives, deductions, advances] = await Promise.all([
      // Fetch referrals
      sql`
        SELECT 
          'Referral' as type,
          id,
          referred_name as description,
          amount,
          created_at,
          status
        FROM referrals
        WHERE referrer_cee_id = ${rider_id}
        AND created_at::date = ${date}::date
        ORDER BY created_at DESC
      `,
      // Fetch incentives
      sql`
        SELECT 
          'Incentive' as type,
          id,
          CONCAT(incentive_type, ' - ', description) as description,
          amount,
          incentive_date as created_at,
          'completed' as status
        FROM incentives
        WHERE cee_id = ${rider_id}
        AND incentive_date::date = ${date}::date
        ORDER BY incentive_date DESC
      `,
      // Fetch deductions
      sql`
        SELECT 
          'Deduction' as type,
          id,
          CONCAT(deduction_type, ' - ', description) as description,
          amount,
          deduction_date as created_at,
          'completed' as status
        FROM deductions
        WHERE cee_id = ${rider_id}
        AND deduction_date::date = ${date}::date
        ORDER BY deduction_date DESC
      `,
      // Fetch advances
      sql`
        SELECT 
          'Advance' as type,
          id,
          CONCAT(reason, ' - ', COALESCE(admin_notes, '')) as description,
          amount,
          requested_at as created_at,
          status
        FROM advances
        WHERE cee_id = ${rider_id}
        AND requested_at::date = ${date}::date
        ORDER BY requested_at DESC
      `
    ]);

    console.log("Referrals count:", referrals.length);
    console.log("Incentives count:", incentives.length);
    console.log("Deductions count:", deductions.length);
    console.log("Advances count:", advances.length);

    // Combine and sort all entries by created_at
    const allEntries = [
      ...referrals,
      ...incentives,
      ...deductions,
      ...advances
    ].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // Latest first
    });

    return NextResponse.json({
      entries: allEntries,
      total: allEntries.length
    });
  } catch (error) {
    console.error("Error fetching entries by date:", error);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}
