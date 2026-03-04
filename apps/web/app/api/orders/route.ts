import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const riderId = searchParams.get('riderId');

    if (!riderId) {
      return NextResponse.json({ error: 'Rider ID is required' }, { status: 400 });
    }

    const orders = await sql`
      SELECT * FROM orders 
      WHERE rider_id = ${riderId}
      ORDER BY order_date DESC
    `;

    const stats = await sql`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(payout_amount), 0) as total_payout
      FROM orders 
      WHERE rider_id = ${riderId}
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
    const { riderId, orderNumber, orderDate, pickupLocation, dropLocation, payoutAmount } = body;

    const result = await sql`
      INSERT INTO orders (rider_id, order_number, order_date, pickup_location, drop_location, payout_amount)
      VALUES (${riderId}, ${orderNumber}, ${orderDate}, ${pickupLocation}, ${dropLocation}, ${payoutAmount})
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
