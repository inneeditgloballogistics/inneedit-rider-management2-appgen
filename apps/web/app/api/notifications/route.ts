import { NextRequest, NextResponse } from 'next/server';
import { sql } from '../utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isRead = searchParams.get('isRead');

    let notifications;
    if (isRead !== null) {
      const readValue = isRead === 'true';
      notifications = await sql`SELECT * FROM notifications WHERE is_read = ${readValue} ORDER BY created_at DESC`;
    } else {
      notifications = await sql`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50`;
    }

    const unreadCountResult = await sql`SELECT COUNT(*) as count FROM notifications WHERE is_read = false`;

    return NextResponse.json({ 
      notifications,
      unreadCount: parseInt(unreadCountResult[0].count) || 0
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isRead } = body;

    if (id) {
      const result = await sql`UPDATE notifications SET is_read = ${isRead} WHERE id = ${id} RETURNING *`;
      return NextResponse.json(result[0]);
    } else {
      // Mark all as read
      await sql`UPDATE notifications SET is_read = true WHERE is_read = false`;
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
