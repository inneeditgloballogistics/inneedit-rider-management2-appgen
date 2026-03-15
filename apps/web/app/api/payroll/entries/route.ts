import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { year, month, type, search } = await request.json();

    let entries: any[] = [];

    // Fetch additions (referrals, incentives, bonuses, etc.)
    if (type === 'all' || type === 'referral' || type === 'incentive' || type === 'bonus') {
      const additions = await sql`
        SELECT 
          id,
          cee_id as rider_id,
          (SELECT full_name FROM riders WHERE cee_id = additions.cee_id LIMIT 1) as rider_name,
          entry_type,
          amount,
          description,
          'approved' as status,
          entry_date as entry_date,
          created_at
        FROM additions
        WHERE EXTRACT(YEAR FROM entry_date) = ${year}
        AND EXTRACT(MONTH FROM entry_date) = ${month}
        ${type !== 'all' ? sql`AND entry_type = ${type}` : sql``}
        ${search ? sql`AND (cee_id ILIKE ${'%' + search + '%'})` : sql``}
        ORDER BY entry_date DESC
      `;
      entries = [...entries, ...additions];
    }

    // Fetch deductions (advances, damages, challans, security deposits)
    if (type === 'all' || type === 'advance' || type === 'damage' || type === 'challan' || type === 'security_deposit') {
      const deductions = await sql`
        SELECT 
          id,
          cee_id as rider_id,
          (SELECT full_name FROM riders WHERE cee_id = deductions.cee_id LIMIT 1) as rider_name,
          entry_type,
          amount,
          description,
          status,
          entry_date as entry_date,
          created_at
        FROM deductions
        WHERE EXTRACT(YEAR FROM entry_date) = ${year}
        AND EXTRACT(MONTH FROM entry_date) = ${month}
        ${type !== 'all' ? sql`AND entry_type = ${type}` : sql``}
        ${search ? sql`AND (cee_id ILIKE ${'%' + search + '%'})` : sql``}
        ORDER BY entry_date DESC
      `;
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
