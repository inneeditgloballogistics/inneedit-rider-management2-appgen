import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { rider_id, date } = await request.json();

    if (!rider_id || !date) {
      return NextResponse.json(
        { error: "rider_id and date are required" },
        { status: 400 }
      );
    }

    // Fetch all additions (referrals and incentives) for this rider on this date
    // Use DATE() to ensure proper date comparison without timezone issues
    const additions = await sql`
      SELECT 
        COALESCE(
          CASE WHEN entry_type = 'referral' THEN 'Referral' ELSE 'Incentive' END,
          'Addition'
        ) as type,
        description,
        amount,
        entry_date
      FROM additions
      WHERE cee_id = ${rider_id} 
        AND DATE(entry_date) = ${date}::DATE
      ORDER BY created_at DESC
    `;

    // Fetch all deductions for this rider on this date
    // Use DATE() to ensure proper date comparison without timezone issues
    const deductions = await sql`
      SELECT 
        CASE 
          WHEN entry_type = 'advance' THEN 'Advance'
          ELSE 'Deduction'
        END as type,
        description,
        amount,
        entry_date
      FROM deductions
      WHERE cee_id = ${rider_id} 
        AND DATE(entry_date) = ${date}::DATE
      ORDER BY created_at DESC
    `;

    // Combine and sort by created_at
    const entries = [
      ...additions.map((a: any) => ({
        type: a.type,
        description: a.description,
        amount: a.amount,
        date: a.entry_date
      })),
      ...deductions.map((d: any) => ({
        type: d.type,
        description: d.description,
        amount: d.amount,
        date: d.entry_date
      }))
    ];

    return NextResponse.json({ 
      entries,
      success: true 
    });
  } catch (error: any) {
    console.error("Error fetching entries by date:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch entries" },
      { status: 500 }
    );
  }
}
