import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const hubId = searchParams.get('hubId');
    const technicianId = searchParams.get('technicianId');
    const status = searchParams.get('status');

    // Get swap requests for hub manager
    if (action === 'hub-manager' && hubId) {
      let query = sql`
        SELECT 
          sr.*,
          r.full_name as rider_name,
          r.cee_id as rider_cee_id,
          r.phone as rider_phone,
          v.vehicle_number as current_vehicle_number,
          v.vehicle_type as current_vehicle_type,
          rv.vehicle_number as replacement_vehicle_number,
          rv.vehicle_type as replacement_vehicle_type,
          st.ticket_number,
          st.issue_description,
          h.hub_name,
          t.name as technician_name
        FROM swap_requests sr
        LEFT JOIN riders r ON sr.rider_id = r.id
        LEFT JOIN vehicles v ON sr.vehicle_id = v.id
        LEFT JOIN vehicles rv ON sr.replacement_vehicle_id = rv.id
        LEFT JOIN service_tickets st ON sr.ticket_id = st.id
        LEFT JOIN hubs h ON sr.hub_id = h.id
        LEFT JOIN technicians t ON sr.technician_id = t.user_id
        WHERE sr.hub_id = ${parseInt(hubId)}
      `;

      if (status) {
        query = sql`${query} AND sr.status = ${status}`;
      }

      query = sql`${query} ORDER BY sr.created_at DESC`;

      const requests = await query;
      return NextResponse.json(requests);
    }

    // Get swap requests for technician
    if (action === 'technician' && technicianId) {
      const requests = await sql`
        SELECT 
          sr.*,
          r.full_name as rider_name,
          r.cee_id as rider_cee_id,
          v.vehicle_number as current_vehicle_number,
          st.ticket_number,
          st.issue_description,
          h.hub_name
        FROM swap_requests sr
        LEFT JOIN riders r ON sr.rider_id = r.id
        LEFT JOIN vehicles v ON sr.vehicle_id = v.id
        LEFT JOIN service_tickets st ON sr.ticket_id = st.id
        LEFT JOIN hubs h ON sr.hub_id = h.id
        WHERE sr.technician_id = ${technicianId}
        ORDER BY sr.created_at DESC
      `;
      return NextResponse.json(requests);
    }

    // Get all swap requests (admin)
    const requests = await sql`
      SELECT 
        sr.*,
        r.full_name as rider_name,
        v.vehicle_number as current_vehicle_number,
        st.ticket_number,
        t.name as technician_name
      FROM swap_requests sr
      LEFT JOIN riders r ON sr.rider_id = r.id
      LEFT JOIN vehicles v ON sr.vehicle_id = v.id
      LEFT JOIN service_tickets st ON sr.ticket_id = st.id
      LEFT JOIN technicians t ON sr.technician_id = t.user_id
      ORDER BY sr.created_at DESC LIMIT 100
    `;

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching swap requests:', error);
    return NextResponse.json({ error: 'Failed to fetch swap requests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ticketId, technicianId, issueReason, notes } = body;

    if (action === 'request-swap') {
      // Validate input
      if (!ticketId || !technicianId || !issueReason) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Get ticket details
      const ticket = await sql`
        SELECT * FROM service_tickets WHERE id = ${parseInt(ticketId)}
      `;

      if (ticket.length === 0) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }

      const ticketData = ticket[0];

      // Get rider details
      const rider = await sql`
        SELECT id, full_name, cee_id FROM riders WHERE cee_id = ${ticketData.cee_id}
      `;

      if (rider.length === 0) {
        return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
      }

      const riderId = rider[0].id;

      // Create swap request
      const result = await sql`
        INSERT INTO swap_requests (
          ticket_id,
          rider_id,
          vehicle_id,
          hub_id,
          technician_id,
          technician_notes,
          issue_reason,
          status
        ) VALUES (
          ${parseInt(ticketId)},
          ${riderId},
          ${ticketData.vehicle_id},
          ${ticketData.assigned_hub_id},
          ${technicianId},
          ${notes || ''},
          ${issueReason},
          'pending'
        ) RETURNING *
      `;

      const swapRequest = result[0];

      // Get hub manager
      const hubManager = await sql`
        SELECT id FROM hub_managers WHERE hub_id = ${ticketData.assigned_hub_id} AND status = 'active' LIMIT 1
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
            'swap_request_pending',
            'Vehicle Swap Request',
            ${`Technician has requested vehicle swap for rider ${rider[0].full_name} (${rider[0].cee_id}). Reason: ${issueReason}`},
            ${swapRequest.id},
            ${hubManager[0].id},
            false,
            NOW()
          )
        `;
      }

      // Update ticket status to indicate swap pending
      await sql`
        UPDATE service_tickets
        SET status = 'Awaiting Swap'
        WHERE id = ${parseInt(ticketId)}
      `;

      return NextResponse.json({ 
        success: true, 
        message: 'Swap request created successfully',
        swapRequest 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error creating swap request:', error);
    return NextResponse.json({
      error: error?.message || 'Failed to create swap request'
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, swapRequestId, hubManagerId, replacementVehicleId, repairCost } = body;

    if (action === 'approve') {
      // Validate input
      if (!swapRequestId || !hubManagerId || !replacementVehicleId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Get swap request
      const swapRequest = await sql`
        SELECT * FROM swap_requests WHERE id = ${parseInt(swapRequestId)}
      `;

      if (swapRequest.length === 0) {
        return NextResponse.json({ error: 'Swap request not found' }, { status: 404 });
      }

      const request_data = swapRequest[0];

      // Update swap request to approved
      const result = await sql`
        UPDATE swap_requests
        SET 
          status = 'approved',
          replacement_vehicle_id = ${parseInt(replacementVehicleId)},
          hub_manager_id = ${hubManagerId},
          repair_cost = ${repairCost || 0},
          approved_at = NOW(),
          updated_at = NOW()
        WHERE id = ${parseInt(swapRequestId)}
        RETURNING *
      `;

      const updatedRequest = result[0];

      // Get rider and vehicle info
      const rider = await sql`
        SELECT id, full_name, cee_id FROM riders WHERE id = ${request_data.rider_id}
      `;

      const oldVehicle = await sql`
        SELECT vehicle_number FROM vehicles WHERE id = ${request_data.vehicle_id}
      `;

      const newVehicle = await sql`
        SELECT vehicle_number FROM vehicles WHERE id = ${parseInt(replacementVehicleId)}
      `;

      // Create notification for rider
      if (rider.length > 0) {
        await sql`
          INSERT INTO notifications (
            type,
            title,
            message,
            related_id,
            rider_id,
            is_read,
            created_at
          ) VALUES (
            'swap_approved',
            'Vehicle Swap Approved',
            ${`Your vehicle swap has been approved. Please report to the hub to collect your replacement vehicle. Current vehicle: ${oldVehicle[0]?.vehicle_number}, New vehicle: ${newVehicle[0]?.vehicle_number}`},
            ${request_data.rider_id},
            ${request_data.rider_id},
            false,
            NOW()
          )
        `;
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Swap request approved',
        swapRequest: updatedRequest 
      });
    }

    if (action === 'complete') {
      // Complete the swap - actual vehicle swap execution
      if (!swapRequestId) {
        return NextResponse.json({ error: 'Missing swapRequestId' }, { status: 400 });
      }

      // Get swap request
      const swapRequest = await sql`
        SELECT * FROM swap_requests WHERE id = ${parseInt(swapRequestId)}
      `;

      if (swapRequest.length === 0) {
        return NextResponse.json({ error: 'Swap request not found' }, { status: 404 });
      }

      const request_data = swapRequest[0];

      // Mark old vehicle as in_maintenance
      await sql`
        UPDATE vehicles
        SET status = 'in_maintenance', assigned_rider_id = NULL
        WHERE id = ${request_data.vehicle_id}
      `;

      // Assign new vehicle to rider
      const rider = await sql`
        SELECT cee_id FROM riders WHERE id = ${request_data.rider_id}
      `;

      await sql`
        UPDATE vehicles
        SET status = 'assigned', assigned_rider_id = ${rider[0].cee_id}
        WHERE id = ${request_data.replacement_vehicle_id}
      `;

      // Update rider's assigned vehicle
      await sql`
        UPDATE riders
        SET assigned_vehicle_id = ${request_data.replacement_vehicle_id}
        WHERE id = ${request_data.rider_id}
      `;

      // Mark service ticket as completed
      await sql`
        UPDATE service_tickets
        SET status = 'Completed'
        WHERE id = ${request_data.ticket_id}
      `;

      // Add repair cost as deduction if applicable
      if (request_data.repair_cost && request_data.repair_cost > 0) {
        const riderData = await sql`
          SELECT cee_id FROM riders WHERE id = ${request_data.rider_id}
        `;

        await sql`
          INSERT INTO deductions (
            cee_id,
            amount,
            description,
            entry_date,
            status,
            entry_type,
            created_at
          ) VALUES (
            ${riderData[0].cee_id},
            ${request_data.repair_cost},
            ${'Vehicle repair cost - ' + (request_data.issue_reason || 'Vehicle maintenance')},
            CURRENT_DATE,
            'approved',
            'vehicle_repair',
            NOW()
          )
        `;
      }

      // Update swap request status
      const result = await sql`
        UPDATE swap_requests
        SET 
          status = 'completed',
          completed_at = NOW(),
          updated_at = NOW()
        WHERE id = ${parseInt(swapRequestId)}
        RETURNING *
      `;

      // Create completion notification for hub manager
      const hubManager = await sql`
        SELECT id FROM hub_managers WHERE id = ${request_data.hub_manager_id}
      `;

      if (hubManager.length > 0) {
        const riderInfo = await sql`
          SELECT full_name, cee_id FROM riders WHERE id = ${request_data.rider_id}
        `;

        const oldVehicle = await sql`
          SELECT vehicle_number FROM vehicles WHERE id = ${request_data.vehicle_id}
        `;

        const newVehicle = await sql`
          SELECT vehicle_number FROM vehicles WHERE id = ${request_data.replacement_vehicle_id}
        `;

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
            'swap_completed',
            'Vehicle Swap Completed',
            ${`Vehicle swap completed for ${riderInfo[0]?.full_name}. Old: ${oldVehicle[0]?.vehicle_number}, New: ${newVehicle[0]?.vehicle_number}`},
            ${parseInt(swapRequestId)},
            ${hubManager[0].id},
            false,
            NOW()
          )
        `;
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Swap completed successfully',
        swapRequest: result[0] 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating swap request:', error);
    return NextResponse.json({
      error: error?.message || 'Failed to update swap request'
    }, { status: 500 });
  }
}
