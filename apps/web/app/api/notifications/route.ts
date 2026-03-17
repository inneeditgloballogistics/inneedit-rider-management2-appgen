import { NextRequest, NextResponse } from 'next/server';
import sql from '../utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isRead = searchParams.get('isRead');
    const userId = searchParams.get('userId');
    const riderId = searchParams.get('riderId');
    const hubManagerId = searchParams.get('hubManagerId');
    const type = searchParams.get('type'); // 'rider' to filter for rider-specific notifications

    let notifications;
    
    // Filter by user role
    if (userId) {
      // Get notifications for authenticated user (admin)
      if (isRead !== null) {
        const readValue = isRead === 'true';
        notifications = await sql`
          SELECT * FROM notifications 
          WHERE (user_id = ${userId} OR rider_id IN (
            SELECT id FROM riders WHERE user_id = ${userId}
          ))
          AND is_read = ${readValue}
          ORDER BY created_at DESC
        `;
      } else {
        notifications = await sql`
          SELECT * FROM notifications 
          WHERE (user_id = ${userId} OR rider_id IN (
            SELECT id FROM riders WHERE user_id = ${userId}
          ))
          ORDER BY created_at DESC LIMIT 50
        `;
      }
    } else if (riderId) {
      // Get notifications for a rider - only show rider-specific notification types
      // Exclude admin-only notification types like 'new_advance_request'
      const riderRiderIdInt = parseInt(riderId);
      if (type === 'rider') {
        // Only show these notification types for riders
        notifications = await sql`
          SELECT * FROM notifications 
          WHERE rider_id = ${riderRiderIdInt}
          AND type IN ('rider_assignment', 'vehicle_handover_complete', 'referral_approved')
          ORDER BY created_at DESC LIMIT 50
        `;
      } else {
        notifications = await sql`
          SELECT * FROM notifications 
          WHERE rider_id = ${riderRiderIdInt}
          ORDER BY created_at DESC LIMIT 50
        `;
      }
    } else if (hubManagerId) {
      // Get notifications for hub manager
      notifications = await sql`
        SELECT * FROM notifications 
        WHERE hub_manager_id = ${parseInt(hubManagerId)}
        ORDER BY created_at DESC LIMIT 50
      `;
    } else {
      // Default: get all notifications (for admin)
      if (isRead !== null) {
        const readValue = isRead === 'true';
        notifications = await sql`SELECT * FROM notifications WHERE is_read = ${readValue} ORDER BY created_at DESC`;
      } else {
        notifications = await sql`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50`;
      }
    }

    // Calculate unread count based on filter
    let unreadCountQuery;
    if (userId) {
      unreadCountQuery = await sql`
        SELECT COUNT(*) as count FROM notifications 
        WHERE (user_id = ${userId} OR rider_id IN (
          SELECT id FROM riders WHERE user_id = ${userId}
        ))
        AND is_read = false
      `;
    } else if (riderId) {
      const riderRiderIdInt = parseInt(riderId);
      if (type === 'rider') {
        unreadCountQuery = await sql`
          SELECT COUNT(*) as count FROM notifications 
          WHERE rider_id = ${riderRiderIdInt}
          AND type IN ('rider_assignment', 'vehicle_handover_complete', 'referral_approved')
          AND is_read = false
        `;
      } else {
        unreadCountQuery = await sql`
          SELECT COUNT(*) as count FROM notifications 
          WHERE rider_id = ${riderRiderIdInt}
          AND is_read = false
        `;
      }
    } else if (hubManagerId) {
      unreadCountQuery = await sql`
        SELECT COUNT(*) as count FROM notifications 
        WHERE hub_manager_id = ${parseInt(hubManagerId)}
        AND is_read = false
      `;
    } else {
      unreadCountQuery = await sql`SELECT COUNT(*) as count FROM notifications WHERE is_read = false`;
    }

    return NextResponse.json({ 
      notifications,
      unreadCount: parseInt(unreadCountQuery[0].count) || 0
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
