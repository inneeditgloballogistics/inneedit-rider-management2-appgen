import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const hubId = searchParams.get('hubId');

    // Get vehicles in maintenance with resolved tickets OR vehicles with repair_completed status
    if (action === 'ready-for-inspection' && hubId) {
      const vehicles = await sql`
        SELECT DISTINCT ON (v.id)
          v.*,
          st.id as latest_ticket_id,
          st.ticket_number,
          st.issue_description,
          st.status as ticket_status,
          st.completion_date,
          st.updated_at,
          st.technician_notes,
          t.name as technician_name,
          r.full_name as rider_name,
          r.cee_id as rider_cee_id
        FROM vehicles v
        LEFT JOIN service_tickets st ON v.id = st.vehicle_id
        LEFT JOIN technicians t ON st.technician_id = t.user_id
        LEFT JOIN riders r ON v.assigned_rider_id = r.cee_id
        WHERE v.hub_id = ${parseInt(hubId)}
        AND (
          (v.status = 'in_maintenance' AND st.status = 'Completed')
          OR v.status = 'repair_completed'
        )
        ORDER BY v.id, st.updated_at DESC
      `;
      return NextResponse.json(vehicles);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching inspection vehicles:', error);
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, vehicleId, hubManagerId } = body;

    if (action === 'confirm-ready') {
      // Validate input
      if (!vehicleId || !hubManagerId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Get vehicle details
      const vehicle = await sql`
        SELECT * FROM vehicles WHERE id = ${parseInt(vehicleId)}
      `;

      if (vehicle.length === 0) {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      }

      const vehicleData = vehicle[0];

      // Update vehicle status to available
      const result = await sql`
        UPDATE vehicles
        SET status = 'available'
        WHERE id = ${parseInt(vehicleId)}
        RETURNING *
      `;

      // Get the rider assigned to this vehicle (if any)
      let riderId = null;
      if (vehicleData.assigned_rider_id) {
        const rider = await sql`
          SELECT id FROM riders WHERE user_id = ${vehicleData.assigned_rider_id}
        `;
        if (rider.length > 0) {
          riderId = rider[0].id;
        }
      }

      // Create notification for rider if assigned
      if (riderId) {
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
            'vehicle_maintenance_complete',
            'Vehicle Maintenance Complete',
            ${`Your vehicle ${vehicleData.vehicle_number} has completed maintenance and is ready for use.`},
            ${vehicleId},
            'rider',
            ${riderId},
            false,
            NOW()
          )
        `;
      }

      return NextResponse.json({
        success: true,
        message: 'Vehicle confirmed as ready',
        vehicle: result[0]
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json({
      error: error?.message || 'Failed to update vehicle'
    }, { status: 500 });
  }
}
