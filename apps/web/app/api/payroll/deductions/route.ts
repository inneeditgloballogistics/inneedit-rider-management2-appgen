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

    if (type === 'advance') {
      const deductions = await sql`
        SELECT 
          d.*,
          r.full_name as rider_name,
          s.store_name as store_location
        FROM deductions d
        LEFT JOIN riders r ON d.cee_id = r.cee_id
        LEFT JOIN stores s ON r.store_id = s.id
        WHERE d.entry_type = 'advance' 
        ORDER BY d.created_at DESC
      `;
      return NextResponse.json(deductions);
    }

    const deductions = await sql`SELECT * FROM deductions ORDER BY created_at DESC`;
    return NextResponse.json(deductions);
  } catch (error) {
    console.error('Error fetching deductions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deductions', details: String(error) },
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
      entry_date,
      status = 'pending'
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
      INSERT INTO deductions (
        cee_id,
        entry_type,
        amount,
        description,
        entry_date,
        status,
        created_at
      ) VALUES (
        ${resolvedCeeId},
        ${entry_type},
        ${parseFloat(amount)},
        ${description || ''},
        ${dateToStore}::DATE,
        ${status},
        CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
      )
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      deduction: result[0]
    });
  } catch (error) {
    console.error('Error creating deduction:', error);
    return NextResponse.json(
      { error: 'Failed to create deduction', details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    const result = await sql`
      UPDATE deductions 
      SET status = ${status}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Deduction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deduction: result[0]
    });
  } catch (error) {
    console.error('Error updating deduction:', error);
    return NextResponse.json(
      { error: 'Failed to update deduction', details: String(error) },
      { status: 500 }
    );
  }
}
