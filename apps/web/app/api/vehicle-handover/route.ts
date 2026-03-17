import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const hubId = searchParams.get('hubId');

    // Get new riders for hub (riders assigned but not yet handed over)
    if (action === 'new-riders') {
      const riders = await sql`
        SELECT 
          r.id,
          r.cee_id,
          r.full_name,
          r.phone,
          r.email,
          r.assigned_vehicle_id,
          r.assigned_hub_id,
          v.vehicle_number,
          v.id as vehicle_id,
          h.hub_name,
          h.hub_code
        FROM riders r
        LEFT JOIN vehicles v ON r.assigned_vehicle_id = v.id
        LEFT JOIN hubs h ON r.assigned_hub_id = h.id
        WHERE r.assigned_hub_id = ${parseInt(hubId || '0')}
        AND r.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM vehicle_handovers vh 
          WHERE vh.rider_id = r.id AND vh.status = 'completed'
        )
        ORDER BY r.created_at DESC
      `;
      return NextResponse.json(riders);
    }

    // Get handover details for a specific rider
    const riderId = searchParams.get('riderId');
    if (riderId) {
      const handovers = await sql`
        SELECT * FROM vehicle_handovers
        WHERE rider_id = ${parseInt(riderId)}
        ORDER BY created_at DESC
      `;
      return NextResponse.json(handovers);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching handover data:', error);
    return NextResponse.json({ error: 'Failed to fetch handover data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { riderId, hubManagerId, vehicleId, hubId, vehiclePhotos, riderSignature, odometerReading, fuelLevel, notes } = body;

    // Create handover record
    const handoverResult = await sql`
      INSERT INTO vehicle_handovers (
        rider_id,
        hub_manager_id,
        vehicle_id,
        hub_id,
        vehicle_photos,
        rider_signature_url,
        odometer_reading,
        fuel_level,
        notes,
        status
      ) VALUES (
        ${riderId},
        ${hubManagerId},
        ${vehicleId},
        ${hubId},
        ${vehiclePhotos ? JSON.stringify(vehiclePhotos) : null},
        ${riderSignature},
        ${odometerReading},
        ${fuelLevel},
        ${notes},
        'completed'
      )
      RETURNING *
    `;

    const handover = handoverResult[0];

    // Get rider and hub details for notification
    const riderDetails = await sql`
      SELECT full_name, cee_id, user_id FROM riders WHERE id = ${riderId}
    `;

    const rider = riderDetails[0];

    // Get store assigned to rider
    const storeDetails = await sql`
      SELECT * FROM riders WHERE id = ${riderId}
    `;

    const riderStore = storeDetails[0];

    // Create notification for rider
    if (rider.user_id) {
      await sql`
        INSERT INTO notifications (
          type,
          title,
          message,
          user_id,
          rider_id,
          related_id,
          is_read,
          created_at
        ) VALUES (
          'vehicle_handover_complete',
          'Vehicle Handed Over Successfully! 🎉',
          ${'Congratulations! Your vehicle ' + (handover.vehicle_id) + ' has been handed over. You are all set to start delivering. Welcome to the team! Head to your assigned store and begin working. Best of luck!'},
          ${rider.user_id},
          ${riderId},
          ${handover.id},
          false,
          NOW()
        )
      `;
    }

    return NextResponse.json({
      success: true,
      handover,
      message: 'Vehicle handover completed successfully'
    });
  } catch (error: any) {
    console.error('Error completing handover:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to complete handover' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { handoverId, status } = body;

    const result = await sql`
      UPDATE vehicle_handovers
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${handoverId}
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating handover:', error);
    return NextResponse.json({ error: 'Failed to update handover' }, { status: 500 });
  }
}
