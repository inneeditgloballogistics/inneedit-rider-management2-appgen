import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { year, month, type, search } = await request.json();

    let entries: any[] = [];

    if (type === 'all' || type === 'referral') {
      const referrals = await sql`
        SELECT 
          id,
          referrer_id as rider_id,
          referrer_name as rider_name,
          'referral' as entry_type,
          1000 as amount,
          CONCAT(referred_name, ' (', referred_phone, ')') as description,
          'approved' as status,
          created_at as entry_date,
          created_at
        FROM referrals
        WHERE EXTRACT(YEAR FROM created_at) = ${year}
        AND EXTRACT(MONTH FROM created_at) = ${month}
        AND approval_status = 'approved'
        ${search ? sql`AND (referrer_name ILIKE ${'%' + search + '%'} OR referrer_id ILIKE ${'%' + search + '%'})` : sql``}
        ORDER BY created_at DESC
      `;
      entries = [...entries, ...referrals];
    }

    if (type === 'all' || type === 'incentive') {
      const incentives = await sql`
        SELECT 
          id,
          rider_id,
          '${type === 'incentive' ? 'Incentive Rider' : 'Unknown'}' as rider_name,
          'incentive' as entry_type,
          amount,
          CONCAT(incentive_type, ': ', description) as description,
          'approved' as status,
          created_at as entry_date,
          created_at
        FROM incentives
        WHERE EXTRACT(YEAR FROM created_at) = ${year}
        AND EXTRACT(MONTH FROM created_at) = ${month}
        ${search ? sql`AND (rider_id ILIKE ${'%' + search + '%'})` : sql``}
        ORDER BY created_at DESC
      `;
      entries = [...entries, ...incentives];
    }

    if (type === 'all' || type === 'advance') {
      const advances = await sql`
        SELECT 
          id,
          rider_id,
          rider_name,
          'advance' as entry_type,
          amount,
          CONCAT('Reason: ', reason) as description,
          'approved' as status,
          requested_at as entry_date,
          requested_at as created_at
        FROM advances
        WHERE EXTRACT(YEAR FROM requested_at) = ${year}
        AND EXTRACT(MONTH FROM requested_at) = ${month}
        AND status = 'approved'
        ${search ? sql`AND (rider_name ILIKE ${'%' + search + '%'} OR rider_id ILIKE ${'%' + search + '%'})` : sql``}
        ORDER BY requested_at DESC
      `;
      entries = [...entries, ...advances];
    }

    if (type === 'all' || type === 'security_deposit' || type === 'damage' || type === 'challan') {
      const deductions = await sql`
        SELECT 
          id,
          rider_id,
          'Deduction Rider' as rider_name,
          deduction_type as entry_type,
          amount,
          description,
          'approved' as status,
          created_at as entry_date,
          created_at
        FROM deductions
        WHERE EXTRACT(YEAR FROM created_at) = ${year}
        AND EXTRACT(MONTH FROM created_at) = ${month}
        ${type !== 'all' ? sql`AND deduction_type = ${type}` : sql``}
        ${search ? sql`AND (rider_id ILIKE ${'%' + search + '%'})` : sql``}
        ORDER BY created_at DESC
      `;
      
      // Fetch rider names for deductions
      for (let i = 0; i < deductions.length; i++) {
        const rider = await sql`SELECT full_name FROM riders WHERE cee_id = ${deductions[i].rider_id}`;
        if (rider.length > 0) {
          deductions[i].rider_name = rider[0].full_name;
        }
      }
      
      entries = [...entries, ...deductions];
    }

    // Sort by date descending
    entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error fetching entries:', error);
    return NextResponse.json({ entries: [] });
  }
}
