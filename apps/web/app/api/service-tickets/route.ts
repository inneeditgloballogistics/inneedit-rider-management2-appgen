import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';
import { getTodayIST } from '@/lib/timezone';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const hub_id = searchParams.get('hub_id'); // Use hub_id (snake_case)
    const technicianId = searchParams.get('technicianId');
    const ceeId = searchParams.get('ceeId');

    // Get all tickets for a hub manager - support both hub_id and hubId parameter names
    let hubManagerHubId = hub_id;
    if (!hubManagerHubId) {
      const hubIdParam = searchParams.get('hubId');
      hubManagerHubId = hubIdParam;
    }

    if (action === 'hub-manager' && hubManagerHubId) {
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
        WHERE st.assigned_hub_id = ${parseInt(hubManagerHubId)}
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
      hub_id, // Use hub_id (snake_case)
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
    if (!hub_id) {
      return NextResponse.json({ error: 'Missing hub_id' }, { status: 400 });
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
    const finalDescription = issueDescription 
      ? `${issueCategory}: ${issueDescription}` 
      : issueCategory;

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
        ${parseInt(hub_id)},
        ${finalDescription},
        ${priority},
        'Open',
        NOW(),
        NOW()
      ) RETURNING *
    `;

    // Update vehicle status to 'in_maintenance' when ticket is created
    if (finalVehicleId) {
      try {
        await sql`
          UPDATE vehicles
          SET status = 'in_maintenance'
          WHERE id = ${parseInt(finalVehicleId)}
        `;
        console.log('[POST service-tickets] Vehicle status updated to in_maintenance:', finalVehicleId);
      } catch (vehicleUpdateError) {
        console.error('[POST service-tickets] Error updating vehicle status:', vehicleUpdateError);
        // Don't fail the request if vehicle update fails
      }
    }

    const ticket = result[0];

    // Get rider details for notification
    const riderInfo = await sql`
      SELECT id, full_name, user_id FROM riders WHERE cee_id = ${ceeId}
    `;

    // Get ALL active hub managers for this hub (in case multiple managers handle one hub)
    const hubManagers = await sql`
      SELECT id FROM hub_managers WHERE hub_id = ${parseInt(hub_id)} AND status = 'active'
    `;

    console.log('[POST service-tickets] Found hub managers:', { count: hubManagers.length, hubId: hub_id, managers: hubManagers });

    // Create notification for all hub managers at this hub
    if (hubManagers.length > 0) {
      const notificationTitle = `New Service Ticket - ${issueCategory}`;
      const riderName = riderInfo[0]?.full_name || 'Unknown';
      const notificationMessage = `Rider ${riderName} (${ceeId}) raised a ticket: ${issueCategory}`;
      
      // Insert notification for each hub manager
      for (const manager of hubManagers) {
        console.log('[POST service-tickets] Creating notification for manager:', { managerId: manager.id, ticketId: ticket.id, type: 'service_ticket_raised' });
        const notifResult = await sql`
          INSERT INTO notifications (
            type,
            title,
            message,
            related_id,
            recipient_type,
            recipient_id,
            is_read,
            created_at
          ) VALUES (
            'service_ticket_raised',
            ${notificationTitle},
            ${notificationMessage},
            ${ticket.id},
            'hub_manager',
            ${manager.id},
            false,
            NOW()
          ) RETURNING id, recipient_id, type, created_at
        `;
        console.log('[POST service-tickets] Notification created:', notifResult[0]);
      }
    } else {
      console.log('[POST service-tickets] No active hub managers found for hub_id:', hub_id);
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
    const { ticketId, status, technicianId, resolution_notes, chargesAmount, chargesReason } = body;

    console.log('PATCH /api/service-tickets - Body:', body);

    if (!ticketId) {
      return NextResponse.json({ error: 'Missing ticketId' }, { status: 400 });
    }

    // Get current ticket first
    const currentTicket = await sql`
      SELECT * FROM service_tickets WHERE id = ${parseInt(ticketId)}
    `;

    if (currentTicket.length === 0) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Only update the fields that are provided
    const finalStatus = status || currentTicket[0].status;
    const finalTechnicianId = technicianId !== undefined ? technicianId : currentTicket[0].technician_id;
    const finalNotes = resolution_notes || currentTicket[0].technician_notes;

    const result = await sql`
      UPDATE service_tickets
      SET 
        status = ${finalStatus},
        technician_id = ${finalTechnicianId},
        technician_notes = ${finalNotes},
        updated_at = NOW()
      WHERE id = ${parseInt(ticketId)}
      RETURNING *
    `;

    // Update vehicle status based on ticket status
    if (currentTicket[0].vehicle_id) {
      try {
        if (status === 'In Progress' || finalStatus === 'In Progress') {
          // Ticket is in progress - vehicle in maintenance
          await sql`
            UPDATE vehicles
            SET status = 'in_maintenance'
            WHERE id = ${currentTicket[0].vehicle_id}
          `;
          console.log('[PATCH service-tickets] Vehicle status updated to in_maintenance:', currentTicket[0].vehicle_id);
        } else if (status === 'Resolved' || status === 'Completed' || finalStatus === 'Resolved' || finalStatus === 'Completed') {
          // Ticket is resolved - vehicle ready for inspection
          await sql`
            UPDATE vehicles
            SET status = 'repair_completed'
            WHERE id = ${currentTicket[0].vehicle_id}
          `;
          console.log('[PATCH service-tickets] Vehicle status updated to repair_completed:', currentTicket[0].vehicle_id);
        }
      } catch (vehicleUpdateError) {
        console.error('[PATCH service-tickets] Error updating vehicle status:', vehicleUpdateError);
        // Don't fail the request if vehicle update fails
      }
    }

    if (result.length === 0) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const ticket = result[0];
    console.log('Updated ticket:', ticket);

    // If ticket is being resolved with charges, create deduction entry
    if ((status === 'Resolved' || status === 'Completed') && chargesAmount && chargesAmount > 0) {
      try {
        const deductionDescription = `Service Charge: ${chargesReason || 'Technician Service'} (Ticket #${ticket.ticket_number})`;
        const todayIST = getTodayIST(); // Get today's date in IST (YYYY-MM-DD format)
        
        console.log('Creating deduction for rider:', { ceeId: ticket.cee_id, amount: chargesAmount, reason: chargesReason, entryDateIST: todayIST });

        // Use IST date instead of UTC
        const deductionResult = await sql`
          INSERT INTO deductions (
            cee_id,
            amount,
            description,
            entry_date,
            entry_type,
            status,
            created_at
          ) VALUES (
            ${ticket.cee_id},
            ${parseFloat(chargesAmount)},
            ${deductionDescription},
            ${todayIST}::date,
            'service_charge',
            'approved',
            NOW()
          ) RETURNING *
        `;

        console.log('Deduction created:', deductionResult[0]);
      } catch (deductionError) {
        console.error('Error creating deduction:', deductionError);
        // Don't fail the request if deduction creation fails
      }
    }

    // If assigning to technician, create notification
    if (technicianId && status === 'In Progress') {
      try {
        const riderInfo = await sql`
          SELECT full_name, cee_id, phone FROM riders WHERE cee_id = ${ticket.cee_id}
        `;

        // Get technician ID from user_id
        const technicianRecord = await sql`
          SELECT id FROM technicians WHERE user_id = ${technicianId}
        `;

        if (technicianRecord.length > 0) {
          const notificationMessage = `You have been assigned a service ticket from ${riderInfo[0]?.full_name || 'a rider'}. Ticket #${ticket.ticket_number}`;
          
          console.log('Creating notification for technician:', technicianId, notificationMessage);

          await sql`
            INSERT INTO notifications (
              type,
              title,
              message,
              related_id,
              recipient_type,
              recipient_id,
              is_read,
              created_at
            ) VALUES (
              'ticket_assigned_to_technician',
              'New Service Ticket Assigned',
              ${notificationMessage},
              ${ticket.id},
              'technician',
              ${technicianRecord[0].id},
              false,
              NOW()
            )
          `;
        }
      } catch (notificationError) {
        console.error('Error creating technician notification:', notificationError);
        // Don't fail the request if notification creation fails
      }
    }

    // If ticket resolved, notify rider and hub manager
    if (status === 'Resolved' || status === 'Completed' || status === 'Cancelled') {
      try {
        const rider = await sql`
          SELECT id, user_id FROM riders WHERE cee_id = ${ticket.cee_id}
        `;

        if (rider.length > 0) {
          let notificationMessage = `Your service ticket #${ticket.ticket_number} has been resolved.`;
          
          // Add charges info if applicable
          if (chargesAmount && chargesAmount > 0) {
            notificationMessage += ` Service charges: ₹${parseFloat(chargesAmount).toFixed(2)} (${chargesReason || 'Service charge'}).`;
          }

          await sql`
            INSERT INTO notifications (
              type,
              title,
              message,
              related_id,
              recipient_type,
              recipient_id,
              is_read,
              created_at
            ) VALUES (
              'ticket_resolved',
              'Service Ticket Resolved',
              ${notificationMessage},
              ${ticket.id},
              'rider',
              ${rider[0].id},
              false,
              NOW()
            )
          `;
        }

        // Also notify hub manager
        const hubManagers = await sql`
          SELECT id FROM hub_managers WHERE hub_id = ${ticket.assigned_hub_id} AND status = 'active'
        `;

        if (hubManagers.length > 0) {
          const riderInfo = await sql`
            SELECT full_name FROM riders WHERE cee_id = ${ticket.cee_id}
          `;

          let managerMessage = `Service ticket #${ticket.ticket_number} from ${riderInfo[0]?.full_name || 'rider'} has been resolved.`;
          if (chargesAmount && chargesAmount > 0) {
            managerMessage += ` Service charges applied: ₹${parseFloat(chargesAmount).toFixed(2)}.`;
          }

          for (const manager of hubManagers) {
            await sql`
              INSERT INTO notifications (
                type,
                title,
                message,
                related_id,
                recipient_type,
                recipient_id,
                is_read,
                created_at
              ) VALUES (
                'ticket_resolved',
                'Service Ticket Resolved',
                ${managerMessage},
                ${ticket.id},
                'hub_manager',
                ${manager.id},
                false,
                NOW()
              )
            `;
          }
        }
      } catch (notificationError) {
        console.error('Error creating rider/manager notification:', notificationError);
        // Don't fail the request if notification creation fails
      }
    }

    console.log('Returning updated ticket:', ticket);
    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error updating service ticket:', errorMessage, error);
    return NextResponse.json({ error: `Failed to update ticket: ${errorMessage}` }, { status: 500 });
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
