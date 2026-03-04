import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const riderId = searchParams.get('riderId');
    const status = searchParams.get('status');
    const action = searchParams.get('action');

    // If action is count, return only pending advances count
    if (action === 'count') {
      const countResult = await sql`
        SELECT COUNT(*) as count FROM advances 
        WHERE status = 'pending'
      `;
      return NextResponse.json({ pendingCount: parseInt(countResult[0].count) });
    }

    let query;
    if (riderId) {
      query = sql`
        SELECT * FROM advances 
        WHERE rider_id = ${riderId}
        ORDER BY requested_at DESC
      `;
    } else if (status) {
      query = sql`
        SELECT * FROM advances 
        WHERE status = ${status}
        ORDER BY requested_at DESC
      `;
    } else {
      query = sql`
        SELECT * FROM advances 
        ORDER BY requested_at DESC
      `;
    }

    const advances = await query;
    return NextResponse.json(advances);
  } catch (error) {
    console.error('Error fetching advances:', error);
    return NextResponse.json({ error: 'Failed to fetch advances' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { riderId, ceeId, riderName, storeLocation, amount, reason } = body;

    const result = await sql`
      INSERT INTO advances (rider_id, cee_id, rider_name, store_location, amount, reason)
      VALUES (${riderId}, ${ceeId}, ${riderName}, ${storeLocation}, ${amount}, ${reason})
      RETURNING *
    `;

    // Create notification for admin
    await sql`
      INSERT INTO notifications (type, title, message, related_id)
      VALUES (
        'advance',
        'New Advance Request',
        ${`${riderName} (${ceeId}) from ${storeLocation} requested ₹${amount}`},
        ${result[0].id}
      )
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating advance request:', error);
    return NextResponse.json({ error: 'Failed to create advance request' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, processedBy, adminNotes } = body;

    const result = await sql`
      UPDATE advances 
      SET status = ${status}, 
          processed_at = CURRENT_TIMESTAMP,
          processed_by = ${processedBy || null},
          admin_notes = ${adminNotes || null}
      WHERE id = ${id}
      RETURNING *
    `;

    // If approved, create deduction record
    if (status === 'approved') {
      await sql`
        INSERT INTO deductions (rider_id, deduction_type, amount, description, deduction_date)
        VALUES (
          ${result[0].rider_id},
          'advance',
          ${result[0].amount},
          ${`Advance approved: ${result[0].reason}`},
          CURRENT_DATE
        )
      `;
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating advance:', error);
    return NextResponse.json({ error: 'Failed to update advance' }, { status: 500 });
  }
}
