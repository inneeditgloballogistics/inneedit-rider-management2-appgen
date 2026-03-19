import { NextRequest, NextResponse } from 'next/server';
import sql from '../utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isRead = searchParams.get('isRead');
    const userId = searchParams.get('userId');
    const riderId = searchParams.get('riderId');
    const hubManagerId = searchParams.get('hubManagerId');
    const technicianId = searchParams.get('technicianId');
    const type = searchParams.get('type');

    console.log('[API] /notifications GET request:', { userId, riderId, hubManagerId, technicianId, type, isRead });

    let notifications;
    
    if (userId) {
      if (isRead !== null) {
        const readValue = isRead === 'true';
        notifications = await sql`
          SELECT * FROM notifications 
          WHERE user_id = ${userId}
          AND is_read = ${readValue}
          ORDER BY created_at DESC
        `;
      } else {
        notifications = await sql`
          SELECT * FROM notifications 
          WHERE user_id = ${userId}
          ORDER BY created_at DESC LIMIT 50
        `;
      }
    } else if (riderId) {
      const riderRiderIdInt = parseInt(riderId);
      if (type === 'rider') {
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
      const hubManagerIdInt = parseInt(hubManagerId);
      console.log('[API /notifications] 🔍 Fetching notifications for hub manager:', { 
        raw_hubManagerId: hubManagerId, 
        parsedInt: hubManagerIdInt,
        type: typeof hubManagerIdInt 
      });
      
      const allNotifications = await sql`
        SELECT id, hub_manager_id, type, title, is_read, created_at FROM notifications 
        WHERE hub_manager_id = ${hubManagerIdInt}
        ORDER BY created_at DESC LIMIT 100
      `;
      console.log('[API /notifications] ℹ️ Total notifications for this hub manager:', allNotifications?.length || 0);
      if (allNotifications.length > 0) {
        console.log('[API /notifications] Sample notifications:', allNotifications.slice(0, 3).map(n => ({ id: n.id, type: n.type, hub_manager_id: n.hub_manager_id, created_at: n.created_at })));
      }
      
      notifications = await sql`
        SELECT * FROM notifications 
        WHERE hub_manager_id = ${hubManagerIdInt}
        AND type IN ('service_ticket_raised', 'swap_request_pending', 'new_rider_onboarding')
        ORDER BY created_at DESC LIMIT 50
      `;
      console.log('[API /notifications] ✅ Filtered notifications (by type):', notifications?.length || 0, 'records');
    } else if (technicianId) {
      notifications = await sql`
        SELECT * FROM notifications 
        WHERE technician_id = ${technicianId}
        AND type IN ('ticket_assigned_to_technician', 'swap_approved')
        ORDER BY created_at DESC LIMIT 50
      `;
    } else {
      if (isRead !== null) {
        const readValue = isRead === 'true';
        notifications = await sql`SELECT * FROM notifications WHERE is_read = ${readValue} ORDER BY created_at DESC`;
      } else {
        notifications = await sql`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50`;
      }
    }

    let unreadCountQuery;
    if (userId) {
      unreadCountQuery = await sql`
        SELECT COUNT(*) as count FROM notifications 
        WHERE user_id = ${userId}
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
        AND type IN ('service_ticket_raised', 'swap_request_pending', 'new_rider_onboarding')
        AND is_read = false
      `;
    } else if (technicianId) {
      unreadCountQuery = await sql`
        SELECT COUNT(*) as count FROM notifications 
        WHERE technician_id = ${technicianId}
        AND type IN ('ticket_assigned_to_technician', 'swap_approved')
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
      await sql`UPDATE notifications SET is_read = true WHERE is_read = false`;
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
