import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

// IST timezone offset: UTC+5:30
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

function getTodayIST(): string {
  const now = new Date();
  const istTime = new Date(now.getTime() + IST_OFFSET);
  return istTime.toISOString().split('T')[0];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      referrer_cee_id,
      rider_name,
      referred_name,
      referred_phone,
      preferred_location,
      notes,
      amount,
      approval_status,
      entry_date,
      created_at
    } = body;

    // Use entry_date if provided (IST date as YYYY-MM-DD), otherwise use today
    const dateToStore = entry_date || created_at || getTodayIST();

    // For payroll entries (when adding via admin panel), insert into additions table with entry_type = 'referral'
    // This way it will show in the payroll entries view
    if (entry_date || referrer_cee_id) {
      const result = await sql`
        INSERT INTO additions (
          cee_id,
          entry_type,
          amount,
          description,
          entry_date,
          created_at
        ) VALUES (
          ${referrer_cee_id},
          'referral',
          ${parseFloat(amount || '0')},
          ${referred_name || referred_phone || 'Referral Entry'},
          ${dateToStore}::DATE,
          CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
        )
        RETURNING *
      `;

      return NextResponse.json({
        success: true,
        referral: result[0]
      });
    }

    // Original behavior: store in referrals table (for non-payroll referral tracking)
    const result = await sql`
      INSERT INTO referrals (
        referrer_cee_id,
        referrer_name,
        referred_name,
        referred_phone,
        preferred_location,
        notes,
        amount,
        approval_status,
        created_at
      ) VALUES (
        ${referrer_cee_id},
        ${rider_name},
        ${referred_name},
        ${referred_phone},
        ${preferred_location},
        ${notes},
        ${amount || 0},
        ${approval_status || 'approved'},
        ${dateToStore}::DATE
      )
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      referral: result[0]
    });
  } catch (error) {
    console.error('Error creating referral:', error);
    return NextResponse.json(
      { error: 'Failed to create referral', details: String(error) },
      { status: 500 }
    );
  }
}
