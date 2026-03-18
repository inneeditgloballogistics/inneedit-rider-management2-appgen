import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const hubId = searchParams.get('hubId');
    const technicianId = searchParams.get('technicianId');
    const ceeId = searchParams.get('ceeId');

    // Get all tickets for a hub manager
    if (action === 'hub-manager' && hubId) {
      const tickets = await sql`
        SELECT 
          st.*,
          r.full_name as rider_name,
          r.cee_id as rider_cee_id,
          r.phone as rider_phone,
          v.vehicle_number,
          v.vehicle_type,
          t.name as technician_name
        FROM service_tickets st
        LEFT JOIN riders r ON st.cee_id = r.cee_id
        LEFT JOIN vehicles v ON st.vehicle_id = v.id
        LEFT JOIN technicians t ON st.technician_id = t.user_id
        WHERE st.assigned_hub_id = ${parseInt(hubId)}
        ORDER BY st.created_at DESC
      `;
      return NextResponse.json(tickets);
    }

    // Get tickets for a technician
    if (action === 'technician' && technicianId) {
      const tickets = await sql`
        SELECT 
          st.*,
          r.full_name as rider_name,
          r.cee_id as rider_cee_id,
          r.phone as rider_phone,
          v.vehicle_number,
          v.vehicle_type
        FROM service_tickets st
        LEFT JOIN riders r ON st.cee_id = r.cee_id
        LEFT JOIN vehicles v ON st.vehicle_id = v.id
        WHERE st.technician_id = ${technicianId}
        ORDER BY st.created_at DESC
      `;
      return NextResponse.json(tickets);
    }

    // Get tickets for a rider
    if (action === 'rider' && ceeId) {
      const tickets = await sql`
        SELECT 
          st.*,
          h.hub_name,
          h.hub_code,
          v.vehicle_number,
          v.vehicle_type,
          t.name as technician_name
        FROM service_tickets st
        LEFT JOIN hubs h ON st.assigned_hub_id = h.id
        LEFT JOIN vehicles v ON st.vehicle_id = v.id
        LEFT JOIN technicians t ON st.technician_id = t.user_id
        WHERE st.cee_id = ${ceeId}
        ORDER BY st.created_at DESC
      `;
      return NextResponse.json(tickets);
    }

    // Get single ticket details
    if (action === 'details') {
      const ticketId = searchParams.get('id');
      const ticket = await sql`
        SELECT 
          st.*,
          r.full_name as rider_name,
          r.cee_id as rider_cee_id,
          r.phone as rider_phone,
          v.vehicle_number,
          v.vehicle_type,
          h.hub_name,
          h.hub_code,
          h.location as hub_location,
          t.name as technician_name
        FROM service_tickets st
        LEFT JOIN riders r ON st.cee_id = r.cee_id
        LEFT JOIN vehicles v ON st.vehicle_id = v.id
        LEFT JOIN hubs h ON st.assigned_hub_id = h.id
        LEFT JOIN technicians t ON st.technician_id = t.user_id
        WHERE st.id = ${parseInt(ticketId)}
      `;
      return NextResponse.json(ticket[0]);
    }

    // Get all tickets (admin)
    const tickets = await sql`
      SELECT 
        st.*,
        r.full_name as rider_name,
        r.cee_id as rider_cee_id,
        v.vehicle_number,
        h.hub_name,
        t.name as technician_name
      FROM service_tickets st
      LEFT JOIN riders r ON st.cee_id = r.cee_id
      LEFT JOIN vehicles v ON st.vehicle_id = v.id
      LEFT JOIN hubs h ON st.assigned_hub_id = h.id
      LEFT JOIN technicians t ON st.technician_id = t.user_id
      ORDER BY st.created_at DESC LIMIT 100
    `;
    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error fetching service tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ceeId,
      hubId,
      vehicleId,
      issueCategory,
      issueDescription,
      priority = 'Medium'
    } = body;

    console.log('POST /api/service-tickets - Body:', body);
    
    // Validate required fields
    if (!ceeId) {
      return NextResponse.json({ error: 'Missing ceeId' }, { status: 400 });
    }
    if (!hubId) {
      return NextResponse.json({ error: 'Missing hubId' }, { status: 400 });
    }
    if (!issueCategory) {
      return NextResponse.json({ error: 'Missing issueCategory' }, { status: 400 });
    }

    // Generate ticket number
    const ticketNumber = `TKT-${Date.now()}`;

    // Get rider's assigned vehicle if not provided
    let finalVehicleId = vehicleId;
    if (!finalVehicleId) {
      const riderVehicle = await sql`
        SELECT assigned_vehicle_id FROM riders WHERE cee_id = ${ceeId}
      `;
      if (riderVehicle.length > 0) {
        finalVehicleId = riderVehicle[0].assigned_vehicle_id;
      }
    }

    // Create the service ticket
    const result = await sql`
      INSERT INTO service_tickets (
        ticket_number,
        cee_id,
        vehicle_id,
        assigned_hub_id,
        issue_description,
        priority,
        status,
        created_at,
        updated_at
      ) VALUES (
        ${ticketNumber},
        ${ceeId},
        ${finalVehicleId ? parseInt(finalVehicleId) : null},
        ${parseInt(hubId)},
        ${`${issueCategory}${issueDescription ? ': ' + issueDescription : ''}`},
        ${priority},
        'Open',
        NOW(),
        NOW()
      ) RETURNING *
    `;

    const ticket = result[0];

    // Get rider details for notification
    const riderInfo = await sql`
      SELECT id, full_name, user_id FROM riders WHERE cee_id = ${ceeId}
    `;

    // Get hub manager for notification
    const hubManager = await sql`
      SELECT id FROM hub_managers WHERE hub_id = ${parseInt(hubId)} AND status = 'active' LIMIT 1
    `;

    // Create notification for hub manager
    if (hubManager.length > 0) {
      await sql`
        INSERT INTO notifications (
          type,
          title,
          message,
          related_id,
          hub_manager_id,
          is_read,
          created_at
        ) VALUES (
          'service_ticket_raised',
          'New Service Ticket - ' + ${issueCategory},
          ${`Rider ${riderInfo[0]?.full_name || 'Unknown'} (${ceeId}) raised a ticket: ${issueCategory}`},
          ${ticket.id},
          ${hubManager[0].id},
          false,
          NOW()
        )
      `;
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error creating service ticket:', errorMessage, error);
    return NextResponse.json({ 
      error: `Failed to create ticket: ${errorMessage}`,
      details: errorMessage 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, status, technicianId, resolution_notes } = body;

    const updateData: any = { status, updated_at: new Date() };
    if (technicianId) updateData.technician_id = technicianId;
    if (resolution_notes) updateData.technician_notes = resolution_notes;

    const result = await sql`
      UPDATE service_tickets
      SET 
        status = ${status},
        technician_id = ${technicianId || null},
        technician_notes = ${resolution_notes || null},
        updated_at = NOW()
      WHERE id = ${parseInt(ticketId)}
      RETURNING *
    `;

    // If assigning to technician, create notification
    if (technicianId && status === 'Assigned') {
      const ticket = result[0];
      const riderInfo = await sql`
        SELECT full_name, cee_id, phone FROM riders WHERE cee_id = ${ticket.cee_id}
      `;

      await sql`
        INSERT INTO notifications (
          type,
          title,
          message,
          related_id,
          user_id,
          is_read,
          created_at
        ) VALUES (
          'ticket_assigned_to_technician',
          'New Service Ticket Assigned',
          ${`You have been assigned a service ticket from ${riderInfo[0]?.full_name || 'a rider'}. Ticket #${ticket.ticket_number}`},
          ${ticket.id},
          ${technicianId},
          false,
          NOW()
        )
      `;
    }

    // If ticket resolved, notify rider
    if (status === 'Resolved' || status === 'Closed') {
      const ticket = result[0];
      const rider = await sql`
        SELECT user_id FROM riders WHERE cee_id = ${ticket.cee_id}
      `;

      if (rider.length > 0) {
        await sql`
          INSERT INTO notifications (
            type,
            title,
            message,
            related_id,
            user_id,
            is_read,
            created_at
          ) VALUES (
            'ticket_resolved',
            'Service Ticket Resolved',
            ${`Your service ticket #${ticket.ticket_number} has been resolved.`},
            ${ticket.id},
            ${rider[0].user_id},
            false,
            NOW()
          )
        `;
      }
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating service ticket:', error);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('id');

    await sql`DELETE FROM service_tickets WHERE id = ${parseInt(ticketId)}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service ticket:', error);
    return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 });
  }
}
