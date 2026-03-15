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

        // Check if entry already exists for this week
        const existingEntry = await sql`
          SELECT id FROM payout_entries 
          WHERE year = ${year} AND month = ${month} AND week = ${week} AND cee_id = ${cee_id}
        `;

        if (existingEntry.length > 0) {
          // Update existing entry
          await sql`
            UPDATE payout_entries
            SET rider_name = ${rider_name},
                orders_delivered = ${orders_delivered || 0},
                attendance = ${attendance || 0},
                base_payout = ${base_payout},
                cod = ${cod || 0},
                updated_at = NOW()
            WHERE year = ${year} AND month = ${month} AND week = ${week} AND cee_id = ${cee_id}
          `;
        } else {
          // Insert new entry
          await sql`
            INSERT INTO payout_entries (year, month, week, cee_id, rider_name, orders_delivered, attendance, base_payout, cod, created_at, updated_at)
            VALUES (${year}, ${month}, ${week}, ${cee_id}, ${rider_name}, ${orders_delivered || 0}, ${attendance || 0}, ${base_payout}, ${cod || 0}, NOW(), NOW())
          `;
        }

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
