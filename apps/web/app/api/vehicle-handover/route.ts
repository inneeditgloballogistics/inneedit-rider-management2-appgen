import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const hub_id = searchParams.get('hub_id') || searchParams.get('hubId'); // Accept both snake_case and camelCase

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
        WHERE r.assigned_hub_id = ${parseInt(hub_id || '0')}
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
    console.log('Handover request body keys:', Object.keys(body));
    
    const { riderId, hubManagerId, vehicleId, hub_id, vehiclePhotos, riderSignature, odometerReading, fuelLevel, notes } = body; // Use hub_id (snake_case)

    // Validate required fields
    if (!riderId || !vehicleId || !hub_id) {
      console.error('Missing required fields:', { riderId, vehicleId, hub_id });
      return NextResponse.json(
        { error: 'Missing required fields: riderId, vehicleId, hub_id' },
        { status: 400 }
      );
    }

    console.log('Creating handover record for rider:', riderId);

    // Create handover record (WITHOUT photos array)
    const handoverResult = await sql`
      INSERT INTO vehicle_handovers (
        rider_id,
        hub_manager_id,
        vehicle_id,
        hub_id,
        rider_signature_url,
        odometer_reading,
        fuel_level,
        notes,
        status,
        created_at,
        updated_at
      ) VALUES (
        ${riderId},
        ${hubManagerId || null},
        ${vehicleId},
        ${hub_id},
        ${riderSignature || null},
        ${odometerReading || ''},
        ${fuelLevel || 'full'},
        ${notes || ''},
        'completed',
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    const handover = handoverResult[0];
    console.log('Handover created:', handover.id);

    // Save photos separately if provided
    if (vehiclePhotos && Array.isArray(vehiclePhotos) && vehiclePhotos.length > 0) {
      console.log('Saving', vehiclePhotos.length, 'photos');
      for (let i = 0; i < vehiclePhotos.length; i++) {
        await sql`
          INSERT INTO handover_photos (
            handover_id,
            photo_data,
            photo_order,
            created_at
          ) VALUES (
            ${handover.id},
            ${vehiclePhotos[i]},
            ${i + 1},
            NOW()
          )
        `;
      }
      console.log('Photos saved successfully');
    }

    // Get rider and vehicle details for notification
    const riderDetails = await sql`
      SELECT r.full_name, r.cee_id, r.user_id, v.vehicle_number
      FROM riders r
      LEFT JOIN vehicles v ON r.assigned_vehicle_id = v.id
      WHERE r.id = ${riderId}
    `;

    const rider = riderDetails[0];
    console.log('Rider details retrieved:', rider?.cee_id);

    // Create notification for rider
    if (rider?.user_id) {
      console.log('Creating rider notification');
      await sql`
        INSERT INTO notifications (
          type,
          title,
          message,
          user_id,
          recipient_type,
          recipient_id,
          related_id,
          is_read,
          created_at
        ) VALUES (
          'vehicle_handover_complete',
          'Vehicle Handed Over Successfully! 🎉',
          ${'Your vehicle ' + (rider.vehicle_number || vehicleId) + ' is ready. Head to your assigned store and start working. All the best!'},
          ${rider.user_id},
          'rider',
          ${riderId},
          ${handover.id},
          false,
          NOW()
        )
      `;
      console.log('Rider notification created');
    }

    // Create notification for admin
    console.log('Creating admin notification');
    await sql`
      INSERT INTO notifications (
        type,
        title,
        message,
        related_id,
        is_read,
        created_at
      ) VALUES (
        'vehicle_handover_admin',
        'Vehicle Handed Over ✓',
        ${'Rider ' + (rider?.full_name || 'Unknown') + ' (CEE: ' + (rider?.cee_id || 'N/A') + ') handed over vehicle ' + (rider?.vehicle_number || vehicleId) + '. On the way to store to start working.'},
        ${handover.id},
        false,
        NOW()
      )
    `;
    console.log('Admin notification created');

    return NextResponse.json({
      success: true,
      handover,
      message: 'Vehicle handover completed successfully'
    });
  } catch (error: any) {
    console.error('Error completing handover:', error.message || error);
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
