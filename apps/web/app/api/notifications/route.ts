import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isRead = searchParams.get('isRead');
    const userId = searchParams.get('userId');
    const riderId = searchParams.get('riderId');
    const hubManagerId = searchParams.get('hubManagerId');
    const technicianId = searchParams.get('technicianId');

    console.log('[API] /notifications GET request:', { userId, riderId, hubManagerId, technicianId, isRead });

    let notifications;
    
    if (userId) {
      // For backwards compatibility - treat user_id as rider with user-based notifications
      notifications = await sql`
        SELECT * FROM notifications 
        WHERE user_id = ${userId} AND recipient_type IS NULL
        ORDER BY created_at DESC LIMIT 50
      `;
    } else if (riderId) {
      const riderIdInt = parseInt(riderId, 10);
      if (isNaN(riderIdInt)) {
        console.error('[API /notifications] Invalid rider ID:', riderId);
        return NextResponse.json({ notifications: [], unreadCount: 0 });
      }
      // Riders see notifications meant for them
      notifications = await sql`
        SELECT * FROM notifications 
        WHERE recipient_type = 'rider' AND recipient_id = ${riderIdInt}
        ORDER BY created_at DESC LIMIT 50
      `;
    } else if (hubManagerId) {
      const hubManagerIdInt = parseInt(hubManagerId, 10);
      console.log('[API /notifications] 🔍 Fetching notifications for hub manager:', { 
        raw_hubManagerId: hubManagerId, 
        parsedInt: hubManagerIdInt,
        isValid: !isNaN(hubManagerIdInt)
      });
      
      if (isNaN(hubManagerIdInt)) {
        console.error('[API /notifications] Invalid hub manager ID:', hubManagerId);
        return NextResponse.json({ notifications: [], unreadCount: 0 });
      }
      
      // Hub managers see notifications meant for them
      notifications = await sql`
        SELECT * FROM notifications 
        WHERE recipient_type = 'hub_manager' AND recipient_id = ${hubManagerIdInt}
        ORDER BY created_at DESC LIMIT 50
      `;
      console.log('[API /notifications] ✅ Found', notifications.length, 'notifications for hub manager', hubManagerIdInt);
    } else if (technicianId) {
      // Technicians see notifications meant for them
      const techIdInt = parseInt(technicianId, 10);
      if (isNaN(techIdInt)) {
        console.error('[API /notifications] Invalid technician ID:', technicianId);
        return NextResponse.json({ notifications: [], unreadCount: 0 });
      }
      notifications = await sql`
        SELECT * FROM notifications 
        WHERE recipient_type = 'technician' AND recipient_id = ${techIdInt}
        ORDER BY created_at DESC LIMIT 50
      `;
    } else {
      // Admin sees all
      notifications = await sql`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50`;
    }

    // Fetch unread count
    let unreadCountResult;
    
    if (userId) {
      unreadCountResult = await sql`
        SELECT COUNT(*) as count FROM notifications 
        WHERE user_id = ${userId} AND recipient_type IS NULL AND is_read = false
      `;
    } else if (riderId) {
      const riderIdInt = parseInt(riderId, 10);
      if (!isNaN(riderIdInt)) {
        unreadCountResult = await sql`
          SELECT COUNT(*) as count FROM notifications 
          WHERE recipient_type = 'rider' AND recipient_id = ${riderIdInt} AND is_read = false
        `;
      } else {
        unreadCountResult = [{ count: 0 }];
      }
    } else if (hubManagerId) {
      const hubManagerIdInt = parseInt(hubManagerId, 10);
      if (!isNaN(hubManagerIdInt)) {
        unreadCountResult = await sql`
          SELECT COUNT(*) as count FROM notifications 
          WHERE recipient_type = 'hub_manager' AND recipient_id = ${hubManagerIdInt} AND is_read = false
        `;
      } else {
        unreadCountResult = [{ count: 0 }];
      }
    } else if (technicianId) {
      const techIdInt = parseInt(technicianId, 10);
      if (!isNaN(techIdInt)) {
        unreadCountResult = await sql`
          SELECT COUNT(*) as count FROM notifications 
          WHERE recipient_type = 'technician' AND recipient_id = ${techIdInt} AND is_read = false
        `;
      } else {
        unreadCountResult = [{ count: 0 }];
      }
    } else {
      unreadCountResult = await sql`SELECT COUNT(*) as count FROM notifications WHERE is_read = false`;
    }

    console.log('[API /notifications] Notifications fetched:', notifications?.length || 0, 'records');

    return NextResponse.json({ 
      notifications: notifications || [],
      unreadCount: parseInt(unreadCountResult[0]?.count || 0) || 0
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 200 });
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
      await sql`UPDATE notifications SET is_read = true WHERE is_read = false`;
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
