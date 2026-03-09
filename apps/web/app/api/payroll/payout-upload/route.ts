import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { entries } = await request.json();

    if (!entries || entries.length === 0) {
      return NextResponse.json({ message: "No entries provided" }, { status: 400 });
    }

    let uploadCount = 0;

    for (const entry of entries) {
      const { year, month, week, cee_id, rider_name, orders_delivered, attendance, base_payout, cod } = entry;

      // Validate required fields
      if (!cee_id || !rider_name || base_payout === undefined) {
        continue; // Skip invalid entries
      }

      try {
        // Check if rider exists
        const riderCheck = await sql`
          SELECT id FROM riders WHERE cee_id = ${cee_id}
        `;

        if (riderCheck.length === 0) {
          console.warn(`Rider not found: ${cee_id}`);
          continue; // Skip if rider doesn't exist
        }

        // Insert into a payout entries table (we'll create this)
        await sql`
          INSERT INTO payout_entries (year, month, week, cee_id, rider_name, orders_delivered, attendance, base_payout, cod, created_at)
          VALUES (${year}, ${month}, ${week}, ${cee_id}, ${rider_name}, ${orders_delivered}, ${attendance}, ${base_payout}, ${cod || 0}, NOW())
          ON CONFLICT (year, month, week, cee_id) DO UPDATE SET
            orders_delivered = EXCLUDED.orders_delivered,
            attendance = EXCLUDED.attendance,
            base_payout = EXCLUDED.base_payout,
            cod = EXCLUDED.cod,
            created_at = NOW()
        `;

        uploadCount++;
      } catch (error) {
        console.error(`Error inserting entry for ${cee_id}:`, error);
        // Continue with next entry
      }
    }

    return NextResponse.json({ 
      message: `Successfully uploaded ${uploadCount} entries`,
      count: uploadCount 
    }, { status: 200 });
  } catch (error) {
    console.error("Error in payout upload:", error);
    return NextResponse.json({ message: "Error processing upload" }, { status: 500 });
  }
}
