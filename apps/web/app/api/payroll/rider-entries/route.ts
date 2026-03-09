import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { rider_id, start_date, end_date } = await request.json();

    if (!rider_id) {
      return NextResponse.json({ entries: [] });
    }

    let entries: any[] = [];

    // Fetch referrals - only include approved ones where rider is eligible
    try {
      let referrals: any[] = [];
      if (start_date && end_date) {
        referrals = await sql`
          SELECT 
            r.id,
            r.referrer_id as rider_id,
            COALESCE(r.referrer_cee_id, 'N/A') as cee_id,
            COALESCE(r.referrer_name, 'Unknown') as full_name,
            'referral' as entry_type,
            1000 as amount,
            CONCAT(r.referred_name, ' (', r.referred_phone, ')') as description,
            COALESCE(r.approval_status, 'pending') as status,
            r.approval_date as entry_date,
            r.approval_date as created_at
          FROM referrals r
          WHERE (r.referrer_id = ${rider_id} OR r.referrer_cee_id = ${rider_id})
          AND r.approval_status = 'approved'
          AND r.month_completion_date <= CURRENT_TIMESTAMP
          AND DATE(r.approval_date) BETWEEN ${start_date} AND ${end_date}
          ORDER BY r.approval_date DESC
        `;
      } else {
        referrals = await sql`
          SELECT 
            r.id,
            r.referrer_id as rider_id,
            COALESCE(r.referrer_cee_id, 'N/A') as cee_id,
            COALESCE(r.referrer_name, 'Unknown') as full_name,
            'referral' as entry_type,
            1000 as amount,
            CONCAT(r.referred_name, ' (', r.referred_phone, ')') as description,
            COALESCE(r.approval_status, 'pending') as status,
            r.approval_date as entry_date,
            r.approval_date as created_at
          FROM referrals r
          WHERE (r.referrer_id = ${rider_id} OR r.referrer_cee_id = ${rider_id})
          AND r.approval_status = 'approved'
          AND r.month_completion_date <= CURRENT_TIMESTAMP
          ORDER BY r.approval_date DESC
        `;
      }
      entries = [...entries, ...referrals];
    } catch (e) {
      console.log('Referrals query error (non-critical):', e);
    }

    // Fetch incentives
    try {
      let incentives: any[] = [];
      if (start_date && end_date) {
        incentives = await sql`
          SELECT 
            i.id,
            i.rider_id,
            COALESCE(r.cee_id, 'N/A') as cee_id,
            COALESCE(r.full_name, 'Unknown') as full_name,
            'incentive' as entry_type,
            COALESCE(i.amount, 0) as amount,
            CONCAT(COALESCE(i.incentive_type, 'Incentive'), ': ', COALESCE(i.description, '')) as description,
            'completed' as status,
            i.incentive_date as entry_date,
            i.created_at
          FROM incentives i
          LEFT JOIN riders r ON i.rider_id = r.user_id OR i.rider_id = r.cee_id
          WHERE (i.rider_id = ${rider_id})
          AND DATE(i.incentive_date) BETWEEN ${start_date} AND ${end_date}
          ORDER BY i.incentive_date DESC
        `;
      } else {
        incentives = await sql`
          SELECT 
            i.id,
            i.rider_id,
            COALESCE(r.cee_id, 'N/A') as cee_id,
            COALESCE(r.full_name, 'Unknown') as full_name,
            'incentive' as entry_type,
            COALESCE(i.amount, 0) as amount,
            CONCAT(COALESCE(i.incentive_type, 'Incentive'), ': ', COALESCE(i.description, '')) as description,
            'completed' as status,
            i.incentive_date as entry_date,
            i.created_at
          FROM incentives i
          LEFT JOIN riders r ON i.rider_id = r.user_id OR i.rider_id = r.cee_id
          WHERE (i.rider_id = ${rider_id})
          ORDER BY i.incentive_date DESC
        `;
      }
      entries = [...entries, ...incentives];
    } catch (e) {
      console.log('Incentives query error (non-critical):', e);
    }

    // Fetch advances
    try {
      let advances: any[] = [];
      if (start_date && end_date) {
        advances = await sql`
          SELECT 
            a.id,
            a.rider_id,
            COALESCE(a.cee_id, 'N/A') as cee_id,
            COALESCE(a.rider_name, 'Unknown') as full_name,
            'advance' as entry_type,
            COALESCE(a.amount, 0) as amount,
            CONCAT('Reason: ', COALESCE(a.reason, '')) as description,
            COALESCE(a.status, 'pending') as status,
            a.requested_at as entry_date,
            a.requested_at as created_at
          FROM advances a
          WHERE (a.rider_id = ${rider_id} OR a.cee_id = ${rider_id})
          AND DATE(a.requested_at) BETWEEN ${start_date} AND ${end_date}
          ORDER BY a.requested_at DESC
        `;
      } else {
        advances = await sql`
          SELECT 
            a.id,
            a.rider_id,
            COALESCE(a.cee_id, 'N/A') as cee_id,
            COALESCE(a.rider_name, 'Unknown') as full_name,
            'advance' as entry_type,
            COALESCE(a.amount, 0) as amount,
            CONCAT('Reason: ', COALESCE(a.reason, '')) as description,
            COALESCE(a.status, 'pending') as status,
            a.requested_at as entry_date,
            a.requested_at as created_at
          FROM advances a
          WHERE (a.rider_id = ${rider_id} OR a.cee_id = ${rider_id})
          ORDER BY a.requested_at DESC
        `;
      }
      entries = [...entries, ...advances];
    } catch (e) {
      console.log('Advances query error (non-critical):', e);
    }

    // Fetch deductions
    try {
      let deductions: any[] = [];
      if (start_date && end_date) {
        deductions = await sql`
          SELECT 
            d.id,
            d.rider_id,
            COALESCE(r.cee_id, 'N/A') as cee_id,
            COALESCE(r.full_name, 'Unknown') as full_name,
            d.deduction_type as entry_type,
            COALESCE(d.amount, 0) as amount,
            COALESCE(d.description, '') as description,
            'completed' as status,
            d.deduction_date as entry_date,
            d.created_at
          FROM deductions d
          LEFT JOIN riders r ON d.rider_id = r.user_id OR d.rider_id = r.cee_id
          WHERE (d.rider_id = ${rider_id})
          AND DATE(d.deduction_date) BETWEEN ${start_date} AND ${end_date}
          ORDER BY d.deduction_date DESC
        `;
      } else {
        deductions = await sql`
          SELECT 
            d.id,
            d.rider_id,
            COALESCE(r.cee_id, 'N/A') as cee_id,
            COALESCE(r.full_name, 'Unknown') as full_name,
            d.deduction_type as entry_type,
            COALESCE(d.amount, 0) as amount,
            COALESCE(d.description, '') as description,
            'completed' as status,
            d.deduction_date as entry_date,
            d.created_at
          FROM deductions d
          LEFT JOIN riders r ON d.rider_id = r.user_id OR d.rider_id = r.cee_id
          WHERE (d.rider_id = ${rider_id})
          ORDER BY d.deduction_date DESC
        `;
      }
      entries = [...entries, ...deductions];
    } catch (e) {
      console.log('Deductions query error (non-critical):', e);
    }

    // Sort by date descending
    entries.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error fetching rider entries:', error);
    return NextResponse.json({ entries: [] });
  }
}
