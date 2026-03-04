import { NextRequest, NextResponse } from 'next/server';
import pool from '../utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'count') {
      const result = await pool.query('SELECT COUNT(*) as count FROM riders');
      return NextResponse.json({ count: parseInt(result.rows[0].count) });
    }

    // Get all riders
    const result = await pool.query(`
      SELECT 
        r.*,
        u.name as user_name,
        u.email as user_email,
        h.hub_name
      FROM riders r
      LEFT JOIN "user" u ON r.user_id = u.id
      LEFT JOIN hubs h ON r.assigned_hub_id = h.id
      ORDER BY r.created_at DESC
    `);
    
    return NextResponse.json({ riders: result.rows });
  } catch (error) {
    console.error('Error fetching riders:', error);
    return NextResponse.json({ error: 'Failed to fetch riders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
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
    
    // Insert rider into database
    const result = await pool.query(
      `INSERT INTO riders (
        cee_id,
        full_name,
        phone,
        email,
        date_of_birth,
        address,
        client,
        assigned_hub_id,
        assigned_vehicle_id,
        account_number,
        ifsc_code,
        driving_license_url,
        aadhar_url,
        vehicle_ownership,
        ev_monthly_rent,
        ev_weekly_rent,
        is_leader,
        leader_discount_percentage,
        status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19
      )
      RETURNING *`,
      [
        ceeId,
        body.fullName || '',
        body.mobile || '',
        body.email || null,
        body.dob || null,
        body.address || null,
        body.client || '',
        hubId,
        body.assignedVehicleId || null,
        body.bankAccount || null,
        body.ifscCode || null,
        body.dlUrl || null,
        body.aadharUrl || null,
        body.vehicleOwnership || 'company_ev',
        body.evMonthlyRent || null,
        body.evWeeklyRent || null,
        body.isLeader || false,
        body.leaderDiscountPercentage || 0,
        'active'
      ]
    );
    
    const newRider = result.rows[0];

    // If a vehicle was assigned, update the vehicle record
    if (body.assignedVehicleId) {
      await pool.query(
        'UPDATE vehicles SET assigned_rider_id = $1, status = $2 WHERE id = $3',
        [ceeId, 'assigned', body.assignedVehicleId]
      );
      console.log('Vehicle assigned to rider:', body.assignedVehicleId, ceeId);
    }
    
    return NextResponse.json({ success: true, rider: newRider, ceeId });
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
    const { id, assigned_vehicle_id, ...otherFields } = body;

    // Get the current rider data to find previous vehicle assignment
    const currentRider = await pool.query(
      'SELECT assigned_vehicle_id FROM riders WHERE id = $1',
      [id]
    );

    // If vehicle assignment changed, update both old and new vehicles
    if (currentRider.rows.length > 0) {
      const oldVehicleId = currentRider.rows[0].assigned_vehicle_id;
      
      // Free up old vehicle if it exists
      if (oldVehicleId && oldVehicleId !== assigned_vehicle_id) {
        await pool.query(
          'UPDATE vehicles SET assigned_rider_id = NULL, status = $1 WHERE id = $2',
          ['available', oldVehicleId]
        );
      }
      
      // Assign new vehicle if provided
      if (assigned_vehicle_id) {
        const riderCeeId = await pool.query(
          'SELECT cee_id FROM riders WHERE id = $1',
          [id]
        );
        if (riderCeeId.rows.length > 0) {
          await pool.query(
            'UPDATE vehicles SET assigned_rider_id = $1, status = $2 WHERE id = $3',
            [riderCeeId.rows[0].cee_id, 'assigned', assigned_vehicle_id]
          );
        }
      }
    }

    // Update rider record
    const result = await pool.query(
      `UPDATE riders 
      SET 
        full_name = $1,
        phone = $2,
        email = $3,
        address = $4,
        city = $5,
        state = $6,
        pincode = $7,
        client = $8,
        assigned_hub_id = $9,
        assigned_vehicle_id = $10,
        store_id = $11,
        status = $12
      WHERE id = $13
      RETURNING *`,
      [
        otherFields.full_name,
        otherFields.phone,
        otherFields.email || null,
        otherFields.address || null,
        otherFields.city || null,
        otherFields.state || null,
        otherFields.pincode || null,
        otherFields.client || null,
        otherFields.assigned_hub_id || null,
        assigned_vehicle_id || null,
        otherFields.store_id || null,
        otherFields.status || 'active',
        id
      ]
    );

    return NextResponse.json(result.rows[0]);
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
    const riderResult = await pool.query(
      'SELECT id, cee_id, full_name FROM riders WHERE user_id = $1',
      [user_id]
    );

    if (riderResult.rows.length === 0) {
      return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
    }

    const rider = riderResult.rows[0];

    // Update bank details
    const updatedRider = await pool.query(
      `UPDATE riders 
      SET 
        bank_name = $1,
        account_number = $2,
        ifsc_code = $3
      WHERE user_id = $4
      RETURNING *`,
      [bank_name, account_number, ifsc_code, user_id]
    );

    // Create notification for admin
    await pool.query(
      `INSERT INTO notifications (type, title, message, related_id, is_read, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        'bank_update',
        'Rider Bank Details Updated',
        `${rider.full_name} (CEE ID: ${rider.cee_id}) has updated their bank details. Please verify: ${bank_name}, Account: ${account_number}, IFSC: ${ifsc_code}`,
        rider.id,
        false
      ]
    );

    return NextResponse.json({ 
      success: true, 
      rider: updatedRider.rows[0],
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
    const rider = await pool.query(
      'SELECT cee_id, assigned_vehicle_id FROM riders WHERE id = $1',
      [id]
    );
    
    if (rider.rows.length === 0) {
      return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
    }

    const riderData = rider.rows[0];

    // Check if rider has related records
    const [orders, advances, referrals, deductions, incentives, payouts] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM orders WHERE rider_id = $1', [riderData.cee_id]),
      pool.query('SELECT COUNT(*) as count FROM advances WHERE rider_id = $1', [riderData.cee_id]),
      pool.query('SELECT COUNT(*) as count FROM referrals WHERE referrer_id = $1', [riderData.cee_id]),
      pool.query('SELECT COUNT(*) as count FROM deductions WHERE rider_id = $1', [riderData.cee_id]),
      pool.query('SELECT COUNT(*) as count FROM incentives WHERE rider_id = $1', [riderData.cee_id]),
      pool.query('SELECT COUNT(*) as count FROM payouts WHERE rider_id = $1', [riderData.cee_id])
    ]);

    const hasRelatedRecords = 
      parseInt(orders.rows[0].count) > 0 ||
      parseInt(advances.rows[0].count) > 0 ||
      parseInt(referrals.rows[0].count) > 0 ||
      parseInt(deductions.rows[0].count) > 0 ||
      parseInt(incentives.rows[0].count) > 0 ||
      parseInt(payouts.rows[0].count) > 0;

    if (hasRelatedRecords) {
      return NextResponse.json({ 
        error: 'Cannot delete rider with existing orders, advances, referrals, deductions, incentives, or payouts. Please remove or reassign these records first.' 
      }, { status: 400 });
    }

    // Free up assigned vehicle if exists
    if (riderData.assigned_vehicle_id) {
      await pool.query(
        'UPDATE vehicles SET assigned_rider_id = NULL, status = $1 WHERE id = $2',
        ['available', riderData.assigned_vehicle_id]
      );
    }

    // Delete the rider
    await pool.query('DELETE FROM riders WHERE id = $1', [id]);

    return NextResponse.json({ success: true, message: 'Rider deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting rider:', error);
    return NextResponse.json({ 
      error: error?.message || 'Failed to delete rider' 
    }, { status: 500 });
  }
}
