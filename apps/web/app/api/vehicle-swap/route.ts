import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const hubId = searchParams.get('hubId');

    // Get vehicle status breakdown for admin dashboard
    if (action === 'status-breakdown' && hubId) {
      const result = await sql`
        SELECT 
          status,
          COUNT(*) as count
        FROM vehicles
        WHERE hub_id = ${parseInt(hubId)}
        GROUP BY status
      `;
      
      const breakdown = {
        available: 0,
        assigned: 0,
        in_maintenance: 0,
        total: 0
      };

      result.forEach((row: any) => {
        breakdown[row.status as keyof typeof breakdown] = parseInt(row.count);
      });
      
      breakdown.total = result.reduce((sum: number, row: any) => sum + parseInt(row.count), 0);

      return NextResponse.json(breakdown);
    }

    // Get available vehicles at a hub for swap
    if (action === 'available-for-swap' && hubId) {
      const vehicles = await sql`
        SELECT id, vehicle_number, vehicle_type, model, year, status
        FROM vehicles
        WHERE hub_id = ${parseInt(hubId)}
        AND status = 'available'
        AND (assigned_rider_id IS NULL OR assigned_rider_id = '')
        ORDER BY vehicle_number ASC
      `;
      return NextResponse.json(vehicles);
    }

    // Get vehicle details with current assignment
    if (action === 'details') {
      const vehicleId = searchParams.get('vehicleId');
      const vehicle = await sql`
        SELECT 
          v.*,
          r.full_name as assigned_rider_name,
          r.cee_id as assigned_rider_cee_id,
          r.phone as assigned_rider_phone
        FROM vehicles v
        LEFT JOIN riders r ON v.assigned_rider_id = r.cee_id
        WHERE v.id = ${parseInt(vehicleId || '0')}
      `;
      return NextResponse.json(vehicle[0] || null);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching vehicle swap data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, oldVehicleId, newVehicleId, riderCeeId, hubId, notes } = body;

    if (action === 'perform-swap') {
      // Validate input
      if (!oldVehicleId || !newVehicleId || !riderCeeId || !hubId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Get old vehicle details
      const oldVehicle = await sql`
        SELECT * FROM vehicles WHERE id = ${parseInt(oldVehicleId)}
      `;

      if (oldVehicle.length === 0) {
        return NextResponse.json({ error: 'Old vehicle not found' }, { status: 404 });
      }

      // Get new vehicle details
      const newVehicle = await sql`
        SELECT * FROM vehicles WHERE id = ${parseInt(newVehicleId)}
      `;

      if (newVehicle.length === 0) {
        return NextResponse.json({ error: 'New vehicle not found' }, { status: 404 });
      }

      // Get rider details
      const rider = await sql`
        SELECT id, full_name, cee_id FROM riders WHERE cee_id = ${riderCeeId}
      `;

      if (rider.length === 0) {
        return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
      }

      const riderId = rider[0].id;
      const riderName = rider[0].full_name;

      // Start transaction: update both vehicles
      // 1. Mark old vehicle as in_maintenance
      await sql`
        UPDATE vehicles
        SET status = 'in_maintenance', assigned_rider_id = NULL
        WHERE id = ${parseInt(oldVehicleId)}
      `;

      // 2. Assign new vehicle to rider
      await sql`
        UPDATE vehicles
        SET status = 'assigned', assigned_rider_id = ${riderCeeId}
        WHERE id = ${parseInt(newVehicleId)}
      `;

      // 3. Update rider's assigned vehicle
      await sql`
        UPDATE riders
        SET assigned_vehicle_id = ${parseInt(newVehicleId)}
        WHERE cee_id = ${riderCeeId}
      `;

      // 4. Create a service ticket for the old vehicle (for maintenance tracking)
      const ticketNumber = `SVC-${Date.now()}`;
      const ticketResult = await sql`
        INSERT INTO service_tickets (
          ticket_number,
          vehicle_id,
          assigned_hub_id,
          cee_id,
          issue_description,
          priority,
          status,
          created_at
        )
        VALUES (
          ${ticketNumber},
          ${parseInt(oldVehicleId)},
          ${parseInt(hubId)},
          ${riderCeeId},
          ${'Vehicle swap initiated - requires maintenance/repair. ' + (notes || '')},
          'High',
          'Open',
          NOW()
        )
        RETURNING *
      `;

      // 5. Create notifications
      // For rider
      await sql`
        INSERT INTO notifications (
          type,
          title,
          message,
          related_id,
          rider_id,
          is_read,
          created_at
        )
        VALUES (
          'vehicle_swap',
          'Vehicle Swap Complete',
          ${`Your vehicle ${oldVehicle[0].vehicle_number} has been swapped for ${newVehicle[0].vehicle_number}. Your new vehicle is ready for use. The old vehicle will be serviced and returned to active fleet soon.`},
          ${riderId},
          ${riderId},
          false,
          NOW()
        )
      `;

      // For hub manager
      const hubManager = await sql`
        SELECT id FROM hub_managers WHERE hub_id = ${parseInt(hubId)} AND status = 'active' LIMIT 1
      `;

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
          )
          VALUES (
            'vehicle_swap_completed',
            'Vehicle Swap Completed',
            ${`Vehicle swap completed for rider ${riderName} (${riderCeeId}). Old: ${oldVehicle[0].vehicle_number}, New: ${newVehicle[0].vehicle_number}. Maintenance ticket #${ticketNumber} created.`},
            ${ticketResult[0].id},
            ${hubManager[0].id},
            false,
            NOW()
          )
        `;
      }

      return NextResponse.json({
        success: true,
        message: 'Vehicle swap completed successfully',
        oldVehicle: oldVehicle[0],
        newVehicle: newVehicle[0],
        rider: rider[0],
        ticketNumber
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error performing vehicle swap:', error);
    return NextResponse.json({
      error: error?.message || 'Failed to perform vehicle swap'
    }, { status: 500 });
  }
}
