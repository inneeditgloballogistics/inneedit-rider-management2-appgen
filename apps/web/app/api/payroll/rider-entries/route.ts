import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { rider_id } = await request.json();

    if (!rider_id) {
      return NextResponse.json({ entries: [] });
    }

    // Get rider's cee_id and full_name first
    const riderInfo = await sql`
      SELECT cee_id, full_name FROM riders WHERE user_id = ${rider_id} LIMIT 1
    `;
    const cee_id = riderInfo?.[0]?.cee_id || rider_id;
    const full_name = riderInfo?.[0]?.full_name || '';

    let entries: any[] = [];

    // Fetch referrals
    const referrals = await sql`
      SELECT 
        id,
        referrer_id as rider_id,
        referrer_name as full_name,
        '${cee_id}' as cee_id,
        'referral' as entry_type,
        0 as amount,
        CONCAT(referred_name, ' (', referred_phone, ')') as description,
        status,
        created_at as entry_date,
        created_at
      FROM referrals
      WHERE referrer_id = ${rider_id}
      ORDER BY created_at DESC
    `;
    entries = [...entries, ...referrals];

    // Fetch incentives
    const incentives = await sql`
      SELECT 
        id,
        rider_id,
        '${full_name}' as full_name,
        '${cee_id}' as cee_id,
        'incentive' as entry_type,
        amount,
        CONCAT(incentive_type, ': ', description) as description,
        'completed' as status,
        incentive_date as entry_date,
        created_at
      FROM incentives
      WHERE rider_id = ${rider_id}
      ORDER BY incentive_date DESC
    `;
    entries = [...entries, ...incentives];

    // Fetch advances
    const advances = await sql`
      SELECT 
        id,
        rider_id,
        rider_name as full_name,
        '${cee_id}' as cee_id,
        'advance' as entry_type,
        amount,
        CONCAT('Reason: ', reason) as description,
        status,
        requested_at as entry_date,
        requested_at as created_at
      FROM advances
      WHERE rider_id = ${rider_id}
      ORDER BY requested_at DESC
    `;
    entries = [...entries, ...advances];

    // Fetch deductions
    const deductions = await sql`
      SELECT 
        id,
        rider_id,
        '${full_name}' as full_name,
        '${cee_id}' as cee_id,
        deduction_type as entry_type,
        amount,
        description,
        'completed' as status,
        deduction_date as entry_date,
        created_at
      FROM deductions
      WHERE rider_id = ${rider_id}
      ORDER BY deduction_date DESC
    `;
    entries = [...entries, ...deductions];

    // Sort by date descending
    entries.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error fetching rider entries:', error);
    return NextResponse.json({ entries: [] });
  }
}
