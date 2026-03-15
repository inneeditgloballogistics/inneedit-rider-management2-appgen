import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { rider_id, week_number, month, year } = await request.json();

    if (!rider_id || !week_number || !month || !year) {
      return NextResponse.json({ 
        error: "Missing required fields",
        allAdditions: 0,
        allDeductions: 0,
        vehicleRent: 0,
        finalAmount: 0
      });
    }

    // First, resolve rider_id to cee_id
    let cee_id = rider_id;
    try {
      const riderResolve = await sql`
        SELECT cee_id FROM riders 
        WHERE user_id = ${rider_id} OR cee_id = ${rider_id}
        LIMIT 1
      `;
      if (riderResolve?.[0]?.cee_id) {
        cee_id = riderResolve[0].cee_id;
      }
    } catch (e) {
      console.log("Could not resolve cee_id, using rider_id as-is");
    }

    // FIRST: Try to get the finalized payout from the payouts table
    // This contains the actual values that were calculated during finalization
    const payoutRecord = await sql`
      SELECT 
        total_incentives,
        total_deductions,
        final_amount,
        net_payout
      FROM payouts
      WHERE cee_id = ${cee_id}
      AND week_number = ${week_number}
      AND month = ${month}
      AND year = ${year}
      AND status = 'finalized'
      LIMIT 1
    `;

    if (payoutRecord && payoutRecord.length > 0) {
      const record = payoutRecord[0];
      const allAdditions = parseFloat(record.total_incentives) || 0;
      const allDeductions = parseFloat(record.total_deductions) || 0;
      
      // Calculate vehicle rent from the final_amount
      // final_amount = allAdditions - allDeductions - vehicleRent
      // So: vehicleRent = allAdditions - allDeductions - final_amount
      const finalAmount = parseFloat(record.final_amount) || 0;
      const vehicleRent = allAdditions - allDeductions - finalAmount;

      console.log('Using finalized payout values:', {
        allAdditions,
        allDeductions,
        vehicleRent: vehicleRent >= 0 ? vehicleRent : 0,
        finalAmount
      });

      return NextResponse.json({
        allAdditions: parseFloat(allAdditions.toFixed(2)),
        allDeductions: parseFloat(allDeductions.toFixed(2)),
        vehicleRent: parseFloat(Math.max(0, vehicleRent).toFixed(2)),
        finalAmount: parseFloat(finalAmount.toFixed(2))
      });
    }

    // FALLBACK: If no finalized payout exists, return zeros
    // (Payout not yet finalized)
    return NextResponse.json({
      allAdditions: 0,
      allDeductions: 0,
      vehicleRent: 0,
      finalAmount: 0
    });

  } catch (error) {
    console.error('Error fetching payout details:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch payout details',
      allAdditions: 0,
      allDeductions: 0,
      vehicleRent: 0,
      finalAmount: 0
    });
  }
}
