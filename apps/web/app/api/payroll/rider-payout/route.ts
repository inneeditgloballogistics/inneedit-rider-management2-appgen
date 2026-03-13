import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { rider_id, week, month, year } = await request.json();

    if (!rider_id || week === undefined || !month || !year) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch payout for the specific week
    const payout = await sql`
      SELECT * FROM payouts
      WHERE rider_id = ${rider_id}
      AND week_number = ${week}
      AND month = ${month}
      AND year = ${year}
      LIMIT 1
    `;

    if (payout.length === 0) {
      return NextResponse.json(
        { payout: null, message: "No payout data found for this week" },
        { status: 200 }
      );
    }

    return NextResponse.json({ payout: payout[0] }, { status: 200 });
  } catch (error) {
    console.error("Error fetching rider payout:", error);
    return NextResponse.json(
      { message: "Error fetching payout data" },
      { status: 500 }
    );
  }
}
