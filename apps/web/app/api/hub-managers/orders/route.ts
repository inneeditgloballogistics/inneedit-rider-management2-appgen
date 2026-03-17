import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hubId = searchParams.get('hubId');

    if (!hubId) {
      return NextResponse.json(
        { error: 'Hub ID is required' },
        { status: 400 }
      );
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Get orders for today at this hub
    const orders = await sql`
      SELECT COUNT(*) as count
      FROM orders
      WHERE DATE(created_at) = ${today}
      LIMIT 1
    `;

    // Get all time orders for this hub
    const allOrders = await sql`
      SELECT COUNT(*) as total
      FROM orders
      WHERE hub_id = ${parseInt(hubId)}
    `;

    return NextResponse.json({
      todayOrders: orders.length > 0 ? orders[0].count : 0,
      totalOrders: allOrders.length > 0 ? allOrders[0].total : 0,
    });
  } catch (error: any) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { 
        todayOrders: 0,
        totalOrders: 0,
      }
    );
  }
}
