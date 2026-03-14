import { NextRequest, NextResponse } from 'next/server';
import sql from '../utils/sql';

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
      // Resolve riderId to cee_id first
      const riderInfo = await sql`
        SELECT cee_id FROM riders 
        WHERE user_id = ${riderId} OR cee_id = ${riderId}
        LIMIT 1
      `;
      
      const ceeId = riderInfo.length > 0 ? riderInfo[0].cee_id : riderId;

      query = sql`
        SELECT * FROM advances 
        WHERE cee_id = ${ceeId}
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

    // Resolve to cee_id if not provided
    let resolvedCeeId = ceeId;
    if (!resolvedCeeId) {
      const riderInfo = await sql`
        SELECT cee_id FROM riders 
        WHERE user_id = ${riderId} OR cee_id = ${riderId}
        LIMIT 1
      `;
      resolvedCeeId = riderInfo.length > 0 ? riderInfo[0].cee_id : riderId;
    }

    const result = await sql`
      INSERT INTO advances (cee_id, rider_id, rider_name, store_location, amount, reason, requested_at)
      VALUES (${resolvedCeeId}, ${riderId}, ${riderName}, ${storeLocation}, ${amount}, ${reason}, CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
      RETURNING *
    `;

    // Create notification for admin
    await sql`
      INSERT INTO notifications (type, title, message, related_id)
      VALUES (
        'advance',
        'New Advance Request',
        ${`${riderName} (${resolvedCeeId}) from ${storeLocation} requested ₹${amount}`},
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
          processed_at = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata',
          processed_by = ${processedBy || null},
          admin_notes = ${adminNotes || null}
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating advance:', error);
    return NextResponse.json({ error: 'Failed to update advance' }, { status: 500 });
  }
}
