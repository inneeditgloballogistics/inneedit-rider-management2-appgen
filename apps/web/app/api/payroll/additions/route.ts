import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

// IST timezone offset: UTC+5:30
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

function getTodayIST(): string {
  const now = new Date();
  const istTime = new Date(now.getTime() + IST_OFFSET);
  return istTime.toISOString().split('T')[0];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    if (type === 'referral') {
      const additions = await sql`
        SELECT * FROM additions 
        WHERE entry_type = 'referral' 
        ORDER BY created_at DESC
      `;
      return NextResponse.json(additions);
    }

    const additions = await sql`SELECT * FROM additions ORDER BY created_at DESC`;
    return NextResponse.json(additions);
  } catch (error) {
    console.error('Error fetching additions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch additions', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      rider_id,
      cee_id,
      entry_type,
      amount,
      description,
      entry_date
    } = body;

    // Store the date as YYYY-MM-DD (DATE type in database, no timezone conversion)
    // entry_date comes as YYYY-MM-DD in IST
    const dateToStore = entry_date || getTodayIST();

    // Resolve rider_id to cee_id first
    let resolvedCeeId = cee_id;
    if (!resolvedCeeId) {
      try {
        const riderInfo = await sql`
          SELECT cee_id FROM riders 
          WHERE user_id = ${rider_id} OR cee_id = ${rider_id}
          LIMIT 1
        `;
        if (riderInfo.length > 0) {
          resolvedCeeId = riderInfo[0].cee_id;
        } else {
          resolvedCeeId = rider_id;
        }
      } catch (e) {
        console.log('Could not resolve cee_id, using rider_id as-is');
        resolvedCeeId = rider_id;
      }
    }

    const result = await sql`
      INSERT INTO additions (
        cee_id,
        entry_type,
        amount,
        description,
        entry_date,
        created_at
      ) VALUES (
        ${resolvedCeeId},
        ${entry_type},
        ${parseFloat(amount)},
        ${description || ''},
        ${dateToStore}::DATE,
        CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
      )
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      addition: result[0]
    });
  } catch (error) {
    console.error('Error creating addition:', error);
    return NextResponse.json(
      { error: 'Failed to create addition', details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, approval_status } = body;

    const result = await sql`
      UPDATE additions 
      SET approval_status = ${approval_status}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Addition not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      addition: result[0]
    });
  } catch (error) {
    console.error('Error updating addition:', error);
    return NextResponse.json(
      { error: 'Failed to update addition', details: String(error) },
      { status: 500 }
    );
  }
}
