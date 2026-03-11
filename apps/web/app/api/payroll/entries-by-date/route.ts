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
          created_at,
          'completed' as status
        FROM incentives
        WHERE rider_id = ${rider_id}
        AND created_at::date = ${date}::date
        ORDER BY created_at DESC
      `,
      // Fetch deductions
      sql`
        SELECT 
          'Deduction' as type,
          id,
          CONCAT(deduction_type, ' - ', description) as description,
          amount,
          created_at,
          'completed' as status
        FROM deductions
        WHERE rider_id = ${rider_id}
        AND created_at::date = ${date}::date
        ORDER BY created_at DESC
      `,
      // Fetch advances
      sql`
        SELECT 
          'Advance' as type,
          id,
          CONCAT(reason, ' - ', admin_notes) as description,
          amount,
          created_at,
          status
        FROM advances
        WHERE cee_id = ${rider_id}
        AND created_at::date = ${date}::date
        ORDER BY created_at DESC
      `
    ]);

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
