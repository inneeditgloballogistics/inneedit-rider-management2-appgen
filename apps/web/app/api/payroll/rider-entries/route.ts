import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { rider_id, start_date, end_date } = await request.json();

    if (!rider_id) {
      return NextResponse.json({ entries: [] });
    }

    let entries: any[] = [];
    const whereClause = start_date && end_date ? `AND DATE(${'{date_field}'}) BETWEEN ${`'${start_date}'`} AND ${`'${end_date}'`}` : '';

    // Fetch referrals with rider details joined
    const referrals = await sql`
      SELECT 
        r.id,
        r.referrer_id as rider_id,
        COALESCE(rid.cee_id, r.referrer_cee_id) as cee_id,
        COALESCE(rid.full_name, r.referrer_name) as full_name,
        'referral' as entry_type,
        0 as amount,
        CONCAT(r.referred_name, ' (', r.referred_phone, ')') as description,
        r.status,
        r.created_at as entry_date,
        r.created_at
      FROM referrals r
      LEFT JOIN riders rid ON r.referrer_id = rid.user_id
      WHERE r.referrer_id = ${rider_id}
      ${start_date && end_date ? sql`AND DATE(r.created_at) BETWEEN ${start_date} AND ${end_date}` : sql``}
      ORDER BY r.created_at DESC
    `;
    entries = [...entries, ...referrals];

    // Fetch incentives with rider details joined
    const incentives = await sql`
      SELECT 
        i.id,
        i.rider_id,
        rid.cee_id,
        rid.full_name,
        'incentive' as entry_type,
        i.amount,
        CONCAT(i.incentive_type, ': ', i.description) as description,
        'completed' as status,
        i.incentive_date as entry_date,
        i.created_at
      FROM incentives i
      LEFT JOIN riders rid ON i.rider_id = rid.user_id
      WHERE i.rider_id = ${rider_id}
      ${start_date && end_date ? sql`AND DATE(i.incentive_date) BETWEEN ${start_date} AND ${end_date}` : sql``}
      ORDER BY i.incentive_date DESC
    `;
    entries = [...entries, ...incentives];

    // Fetch advances with rider details joined
    const advances = await sql`
      SELECT 
        a.id,
        a.rider_id,
        rid.cee_id,
        rid.full_name,
        'advance' as entry_type,
        a.amount,
        CONCAT('Reason: ', a.reason) as description,
        a.status,
        a.requested_at as entry_date,
        a.requested_at as created_at
      FROM advances a
      LEFT JOIN riders rid ON a.rider_id = rid.user_id
      WHERE a.rider_id = ${rider_id}
      ${start_date && end_date ? sql`AND DATE(a.requested_at) BETWEEN ${start_date} AND ${end_date}` : sql``}
      ORDER BY a.requested_at DESC
    `;
    entries = [...entries, ...advances];

    // Fetch deductions with rider details joined
    const deductions = await sql`
      SELECT 
        d.id,
        d.rider_id,
        rid.cee_id,
        rid.full_name,
        d.deduction_type as entry_type,
        d.amount,
        d.description,
        'completed' as status,
        d.deduction_date as entry_date,
        d.created_at
      FROM deductions d
      LEFT JOIN riders rid ON d.rider_id = rid.user_id
      WHERE d.rider_id = ${rider_id}
      ${start_date && end_date ? sql`AND DATE(d.deduction_date) BETWEEN ${start_date} AND ${end_date}` : sql``}
      ORDER BY d.deduction_date DESC
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
