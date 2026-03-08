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
          0 as amount,
          CONCAT(referred_name, ' (', referred_phone, ')') as description,
          status,
          created_at as entry_date,
          created_at
        FROM referrals
        WHERE EXTRACT(YEAR FROM created_at) = ${year}
        AND EXTRACT(MONTH FROM created_at) = ${month}
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
          'completed' as status,
          incentive_date as entry_date,
          created_at
        FROM incentives
        WHERE EXTRACT(YEAR FROM incentive_date) = ${year}
        AND EXTRACT(MONTH FROM incentive_date) = ${month}
        ${search ? sql`AND (rider_id ILIKE ${'%' + search + '%'})` : sql``}
        ORDER BY incentive_date DESC
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
          status,
          requested_at as entry_date,
          requested_at as created_at
        FROM advances
        WHERE EXTRACT(YEAR FROM requested_at) = ${year}
        AND EXTRACT(MONTH FROM requested_at) = ${month}
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
          'completed' as status,
          deduction_date as entry_date,
          created_at
        FROM deductions
        WHERE EXTRACT(YEAR FROM deduction_date) = ${year}
        AND EXTRACT(MONTH FROM deduction_date) = ${month}
        ${type !== 'all' ? sql`AND deduction_type = ${type}` : sql``}
        ${search ? sql`AND (rider_id ILIKE ${'%' + search + '%'})` : sql``}
        ORDER BY deduction_date DESC
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
