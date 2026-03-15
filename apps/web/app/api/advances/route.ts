import { NextRequest, NextResponse } from 'next/server';
import sql from '../utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ceeId = searchParams.get('ceeId');
    const status = searchParams.get('status');
    const action = searchParams.get('action');

    // If action is count, return only pending advances count
    if (action === 'count') {
      const countResult = await sql`
        SELECT COUNT(*) as count FROM deductions 
        WHERE status = 'pending' AND entry_type = 'advance'
      `;
      return NextResponse.json({ pendingCount: parseInt(countResult[0].count) });
    }

    let query;
    if (ceeId) {
      query = sql`
        SELECT * FROM deductions 
        WHERE cee_id = ${ceeId} AND entry_type = 'advance'
        ORDER BY created_at DESC
      `;
    } else if (status) {
      query = sql`
        SELECT * FROM deductions 
        WHERE status = ${status} AND entry_type = 'advance'
        ORDER BY created_at DESC
      `;
    } else {
      query = sql`
        SELECT * FROM deductions 
        WHERE entry_type = 'advance'
        ORDER BY created_at DESC
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
    const { ceeId, riderName, storeLocation, amount, reason } = body;

    if (!ceeId) {
      return NextResponse.json({ error: 'CEE ID is required' }, { status: 400 });
    }

    const description = `Advance request: ${reason} - Store: ${storeLocation}`;

    const result = await sql`
      INSERT INTO deductions (cee_id, amount, description, entry_date, entry_type, status)
      VALUES (${ceeId}, ${amount}, ${description}, CURRENT_DATE, 'advance', 'pending')
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
    const { id, status } = body;

    const result = await sql`
      UPDATE deductions 
      SET status = ${status}
      WHERE id = ${id} AND entry_type = 'advance'
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating advance:', error);
    return NextResponse.json({ error: 'Failed to update advance' }, { status: 500 });
  }
}
