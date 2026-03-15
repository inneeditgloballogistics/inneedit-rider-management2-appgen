import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'count') {
      const result = await sql`SELECT COUNT(*) as count FROM riders`;
      return NextResponse.json({ count: parseInt(result[0].count) });
    }

    // Get all riders
    const result = await sql`
      SELECT 
        r.*,
        u.name as user_name,
        u.email as user_email,
        h.hub_name
      FROM riders r
      LEFT JOIN "user" u ON r.user_id = u.id
      LEFT JOIN hubs h ON r.assigned_hub_id = h.id
      ORDER BY r.created_at DESC
    `;
    
    return NextResponse.json({ riders: result });
  } catch (error) {
    console.error('Error fetching riders:', error);
    return NextResponse.json({ error: 'Failed to fetch riders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Generate a unique user_id for the rider (required for payroll finalization and dashboard access)
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Use the provided CEE ID or generate if empty
    const ceeId = body.ceeId || `CEE-${Math.floor(10000 + Math.random() * 90000)}`;
    
    // Parse assignedHub - need to handle both numeric strings and select option values
    let hubId = null;
    if (body.assignedHub) {
      const hubMap: { [key: string]: number } = {
        'koramangala': 1,
        'whitefield': 2,
        'hsr': 3,
        'indiranagar': 4
      };
      hubId = hubMap[body.assignedHub] || (isNaN(Number(body.assignedHub)) ? null : Number(body.assignedHub));
    }
    
    // Determine EV type - use provided value or default based on vehicle ownership
    const evType = body.vehicleOwnership === 'company_ev' ? (body.evType || 'fixed_battery') : null;
    const evDailyRent = body.vehicleOwnership === 'company_ev' ? (body.evDailyRent || 215) : null;
    
    // Insert rider into database
    const result = await sql`
      INSERT INTO riders (
        user_id,
        cee_id,
        full_name,
        phone,
        email,
        date_of_birth,
        join_date,
        address,
        client,
        assigned_hub_id,
        assigned_vehicle_id,
        account_number,
        ifsc_code,
        driving_license_url,
        aadhar_url,
        vehicle_ownership,
        ev_daily_rent,
        ev_type,
        is_leader,
        leader_discount_percentage,
        status
      ) VALUES (
        ${userId}, ${ceeId}, ${body.fullName || ''}, ${body.mobile || ''}, ${body.email || null}, ${body.dob || null}, 
        ${body.joinDate || null}, ${body.address || null}, ${body.client || ''}, ${hubId}, ${body.assignedVehicleId || null}, 
        ${body.bankAccount || null}, ${body.ifscCode || null}, ${body.dlUrl || null}, ${body.aadharUrl || null},
        ${body.vehicleOwnership || 'company_ev'}, ${evDailyRent},
        ${evType}, ${body.isLeader || false}, ${body.leaderDiscountPercentage || 0}, 'active'
      )
      RETURNING *
    `;
    
    const newRider = result[0];

    // If a vehicle was assigned, update the vehicle record
    if (body.assignedVehicleId) {
      await sql`UPDATE vehicles SET assigned_rider_id = ${ceeId}, status = 'assigned' WHERE id = ${body.assignedVehicleId}`;
      console.log('Vehicle assigned to rider:', body.assignedVehicleId, ceeId);
    }

    // Create notification for hub manager if hub is assigned
    if (hubId) {
      try {
        // Fetch hub details
        const hubDetails = await sql`SELECT * FROM hubs WHERE id = ${hubId}`;
        const hub = hubDetails[0];

        // Create notification for hub manager
        await sql`
          INSERT INTO notifications (type, title, message, related_id, is_read, created_at)
          VALUES (
            'new_rider_onboarding',
            'New Rider Registered - On Way to Hub',
            ${`${body.fullName} (CEE ID: ${ceeId}) assigned to Client: ${body.client} - On the way to collect vehicle`},
            ${newRider.id},
            false,
            NOW()
          )
        `;

        console.log('Hub manager notification created for hub:', hubId);
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Continue even if notification fails
      }
    }
    
    return NextResponse.json({ success: true, rider: newRider, ceeId, userId });
  } catch (error: any) {
    console.error('Error creating rider:', error);
    
    // More detailed error reporting
    const errorDetails = {
      message: error?.message || 'Unknown error',
      code: error?.code,
      detail: error?.detail,
      hint: error?.hint,
      stack: error?.stack
    };
    
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to create rider',
      details: JSON.stringify(errorDetails, null, 2)
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, assigned_vehicle_id, onboarding_completed, ...otherFields } = body;

    // Get the current rider data to find previous vehicle assignment
    const currentRider = await sql`
      SELECT assigned_vehicle_id FROM riders WHERE id = ${id}
    `;

    // If vehicle assignment changed, update both old and new vehicles
    if (currentRider.length > 0) {
      const oldVehicleId = currentRider[0].assigned_vehicle_id;
      
      // Free up old vehicle if it exists
      if (oldVehicleId && oldVehicleId !== assigned_vehicle_id) {
        await sql`UPDATE vehicles SET assigned_rider_id = NULL, status = 'available' WHERE id = ${oldVehicleId}`;
      }
      
      // Assign new vehicle if provided
      if (assigned_vehicle_id) {
        const riderCeeId = await sql`
          SELECT cee_id FROM riders WHERE id = ${id}
        `;
        if (riderCeeId.length > 0) {
          await sql`UPDATE vehicles SET assigned_rider_id = ${riderCeeId[0].cee_id}, status = 'assigned' WHERE id = ${assigned_vehicle_id}`;
        }
      }
    }

    // Update rider record with all available fields
    const result = await sql`
      UPDATE riders 
      SET 
        full_name = ${otherFields.full_name || null},
        phone = ${otherFields.phone || null},
        email = ${otherFields.email || null},
        date_of_birth = ${otherFields.date_of_birth || null},
        gender = ${otherFields.gender || null},
        address = ${otherFields.address || null},
        city = ${otherFields.city || null},
        state = ${otherFields.state || null},
        pincode = ${otherFields.pincode || null},
        emergency_contact_name = ${otherFields.emergency_contact_name || null},
        emergency_contact_phone = ${otherFields.emergency_contact_phone || null},
        client = ${otherFields.client || null},
        driving_license_number = ${otherFields.driving_license_number || null},
        driving_license_expiry = ${otherFields.driving_license_expiry || null},
        driving_license_url = ${otherFields.driving_license_url || null},
        aadhar_number = ${otherFields.aadhar_number || null},
        aadhar_url = ${otherFields.aadhar_url || null},
        bank_name = ${otherFields.bank_name || null},
        account_number = ${otherFields.account_number || null},
        ifsc_code = ${otherFields.ifsc_code || null},
        vehicle_type = ${otherFields.vehicle_type || null},
        assigned_hub_id = ${otherFields.assigned_hub_id || null},
        assigned_vehicle_id = ${assigned_vehicle_id || null},
        store_id = ${otherFields.store_id || null},
        vehicle_ownership = ${otherFields.vehicle_ownership || null},
        ev_daily_rent = ${otherFields.ev_daily_rent || null},
        ev_type = ${otherFields.ev_type || null},
        is_leader = ${otherFields.is_leader || false},
        leader_discount_percentage = ${otherFields.leader_discount_percentage || 0},
        status = ${otherFields.status || 'active'},
        onboarding_completed = ${onboarding_completed !== undefined ? onboarding_completed : null}
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating rider:', error);
    return NextResponse.json({ error: 'Failed to update rider' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, bank_name, account_number, ifsc_code } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get rider details
    const riderResult = await sql`
      SELECT id, cee_id, full_name FROM riders WHERE user_id = ${user_id}
    `;

    if (riderResult.length === 0) {
      return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
    }

    const rider = riderResult[0];

    // Update bank details
    const updatedRider = await sql`
      UPDATE riders 
      SET 
        bank_name = ${bank_name},
        account_number = ${account_number},
        ifsc_code = ${ifsc_code}
      WHERE user_id = ${user_id}
      RETURNING *
    `;

    // Create notification for admin
    await sql`
      INSERT INTO notifications (type, title, message, related_id, is_read, created_at)
      VALUES ('bank_update', 'Rider Bank Details Updated', 
        ${''}${rider.full_name} (CEE ID: ${rider.cee_id}) has updated their bank details. Please verify: ${bank_name}, Account: ${account_number}, IFSC: ${ifsc_code}, 
        ${rider.id}, false, NOW())
    `;

    return NextResponse.json({ 
      success: true, 
      rider: updatedRider[0],
      message: 'Bank details updated and admin notified' 
    });
  } catch (error: any) {
    console.error('Error updating bank details:', error);
    return NextResponse.json({ 
      error: error?.message || 'Failed to update bank details' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Rider ID is required' }, { status: 400 });
    }

    // Get rider details before deletion
    const rider = await sql`
      SELECT cee_id, assigned_vehicle_id FROM riders WHERE id = ${id}
    `;
    
    if (rider.length === 0) {
      return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
    }

    const riderData = rider[0];

    // Check if rider is assigned to a vehicle
    if (riderData.assigned_vehicle_id) {
      const vehicle = await sql`
        SELECT vehicle_number FROM vehicles WHERE id = ${riderData.assigned_vehicle_id}
      `;
      
      if (vehicle.length > 0) {
        return NextResponse.json({ 
          error: `Cannot delete rider because they are assigned to vehicle ${vehicle[0].vehicle_number}. Please unassign the vehicle first.`,
          vehicleNumber: vehicle[0].vehicle_number
        }, { status: 400 });
      }
    }

    // Check if rider has related records
    const [orders, advances, referrals, deductions, incentives, payouts] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM orders WHERE rider_id = ${riderData.cee_id}`,
      sql`SELECT COUNT(*) as count FROM advances WHERE rider_id = ${riderData.cee_id}`,
      sql`SELECT COUNT(*) as count FROM referrals WHERE referrer_cee_id = ${riderData.cee_id}`,
      sql`SELECT COUNT(*) as count FROM deductions WHERE rider_id = ${riderData.cee_id}`,
      sql`SELECT COUNT(*) as count FROM incentives WHERE rider_id = ${riderData.cee_id}`,
      sql`SELECT COUNT(*) as count FROM payouts WHERE rider_id = ${riderData.cee_id}`
    ]);

    const hasRelatedRecords = 
      parseInt(orders[0].count) > 0 ||
      parseInt(advances[0].count) > 0 ||
      parseInt(referrals[0].count) > 0 ||
      parseInt(deductions[0].count) > 0 ||
      parseInt(incentives[0].count) > 0 ||
      parseInt(payouts[0].count) > 0;

    if (hasRelatedRecords) {
      return NextResponse.json({ 
        error: 'Cannot delete rider with existing orders, advances, referrals, deductions, incentives, or payouts. Please remove or reassign these records first.' 
      }, { status: 400 });
    }

    // Delete the rider
    await sql`DELETE FROM riders WHERE id = ${id}`;

    return NextResponse.json({ success: true, message: 'Rider deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting rider:', error);
    return NextResponse.json({ 
      error: error?.message || 'Failed to delete rider' 
    }, { status: 500 });
  }
}
