import { NextRequest, NextResponse } from 'next/server';
import sql from '../utils/sql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ceeId = searchParams.get('ceeId');
    const status = searchParams.get('status');
    const includeAll = searchParams.get('includeAll'); // For admin to get all deductions

    if (includeAll === 'true') {
      // Admin getting all deductions
      const deductions = await sql`
        SELECT * FROM deductions 
        ORDER BY entry_date DESC
      `;
      return NextResponse.json(deductions);
    }

    if (!ceeId) {
      return NextResponse.json({ error: 'CEE ID is required' }, { status: 400 });
    }

    let query = `SELECT * FROM deductions WHERE cee_id = ${'${ceeId}'}`;
    if (status) {
      query += ` AND status = ${'${status}'}`;
    }
    query += ` ORDER BY entry_date DESC`;

    const deductions = await sql`
      SELECT * FROM deductions 
      WHERE cee_id = ${ceeId}
      ${status ? sql`AND status = ${status}` : sql``}
      ORDER BY entry_date DESC
    `;

    const summary = await sql`
      SELECT 
        entry_type,
        status,
        COALESCE(SUM(amount), 0) as total_amount
      FROM deductions 
      WHERE cee_id = ${ceeId}
      GROUP BY entry_type, status
    `;

    return NextResponse.json({ 
      deductions,
      summary
    });
  } catch (error) {
    console.error('Error fetching deductions:', error);
    return NextResponse.json({ error: 'Failed to fetch deductions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ceeId, deductionType, amount, description, deductionDate } = body;

    if (!ceeId) {
      return NextResponse.json({ error: 'CEE ID is required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO deductions (cee_id, amount, description, entry_date, status, entry_type, created_at)
      VALUES (${ceeId}, ${amount}, ${description}, ${deductionDate}, 'pending', ${deductionType}, NOW())
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating deduction:', error);
    return NextResponse.json({ error: 'Failed to create deduction' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
    }

    // Get current deduction details
    const currentDeduction = await sql`
      SELECT * FROM deductions WHERE id = ${id}
    `;

    if (currentDeduction.length === 0) {
      return NextResponse.json({ error: 'Deduction not found' }, { status: 404 });
    }

    const deduction = currentDeduction[0];

    // Update deduction status
    const result = await sql`
      UPDATE deductions
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    const updatedDeduction = result[0];

    // Get rider info for notifications
    const riderInfo = await sql`
      SELECT id, user_id, full_name FROM riders WHERE cee_id = ${deduction.cee_id}
    `;

    const rider = riderInfo.length > 0 ? riderInfo[0] : null;

    // If rejecting a parts deduction, return the parts to inventory
    if (status === 'rejected' && deduction.entry_type === 'parts_deduction') {
      // Extract ticket number from description (e.g., "Parts used in service ticket #123")
      const ticketNumberMatch = deduction.description.match(/#(\d+)/);
      if (ticketNumberMatch) {
        const ticketId = parseInt(ticketNumberMatch[1]);
        
        // Get parts usage for this ticket
        const partsUsage = await sql`
          SELECT pu.id, pu.part_id, pu.quantity_used
          FROM parts_usage pu
          WHERE pu.service_ticket_id = ${ticketId}
        `;

        // Return parts to inventory
        for (const usage of partsUsage) {
          const partData = await sql`
            SELECT quantity_in_stock, minimum_stock_level FROM parts_inventory WHERE id = ${usage.part_id}
          `;

          if (partData.length > 0) {
            const newQuantity = partData[0].quantity_in_stock + usage.quantity_used;
            await sql`
              UPDATE parts_inventory
              SET 
                quantity_in_stock = ${newQuantity},
                status = CASE 
                  WHEN ${newQuantity} = 0 THEN 'Out of Stock'
                  WHEN ${newQuantity} <= minimum_stock_level THEN 'Low Stock'
                  ELSE 'In Stock'
                END,
                updated_at = NOW()
              WHERE id = ${usage.part_id}
            `;
          }
        }
      }
    }

    // Create notification for rider
    if (rider) {
      const notificationTitle = status === 'approved' 
        ? 'Deduction Approved' 
        : 'Deduction Rejected';
      
      const notificationMessage = status === 'approved'
        ? `Deduction of ₹${deduction.amount} has been approved. This will be deducted from your next payout.`
        : `Your deduction of ₹${deduction.amount} has been rejected. No charges will be applied.`;

      await sql`
        INSERT INTO notifications (
          type,
          title,
          message,
          related_id,
          user_id,
          rider_id,
          is_read,
          created_at
        ) VALUES (
          ${status === 'approved' ? 'deduction_approved' : 'deduction_rejected'},
          ${notificationTitle},
          ${notificationMessage},
          ${deduction.id},
          ${rider.user_id},
          ${rider.id},
          false,
          NOW()
        )
      `;
    }

    return NextResponse.json({ success: true, deduction: updatedDeduction });
  } catch (error) {
    console.error('Error updating deduction status:', error);
    return NextResponse.json({ error: 'Failed to update deduction' }, { status: 500 });
  }
}
