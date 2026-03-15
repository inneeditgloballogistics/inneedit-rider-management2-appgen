import { NextRequest, NextResponse } from 'next/server';
import sql from '../utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ceeId = searchParams.get('ceeId');

    if (!ceeId) {
      return NextResponse.json({ error: 'CEE ID is required' }, { status: 400 });
    }

    const orders = await sql`
      SELECT * FROM orders 
      WHERE cee_id = ${ceeId}
      ORDER BY order_date DESC
    `;

    const stats = await sql`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(payout_amount), 0) as total_payout
      FROM orders 
      WHERE cee_id = ${ceeId}
    `;

    return NextResponse.json({ 
      orders,
      stats: stats[0]
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ceeId, orderNumber, orderDate, pickupLocation, dropLocation, payoutAmount } = body;

    if (!ceeId) {
      return NextResponse.json({ error: 'CEE ID is required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO orders (cee_id, order_number, order_date, pickup_location, drop_location, payout_amount)
      VALUES (${ceeId}, ${orderNumber}, ${orderDate}, ${pickupLocation}, ${dropLocation}, ${payoutAmount})
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
