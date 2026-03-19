import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticketId");
    const partId = searchParams.get("partId");

    const results = await sql`SELECT 
      pu.id,
      pu.service_ticket_id,
      pu.part_id,
      pu.quantity_used,
      pu.usage_date,
      pu.created_at,
      pi.part_name,
      pi.part_code,
      pi.unit_cost,
      st.ticket_number,
      st.cee_id
    FROM parts_usage pu
    LEFT JOIN parts_inventory pi ON pu.part_id = pi.id
    LEFT JOIN service_tickets st ON pu.service_ticket_id = st.id
    WHERE 1=1
      ${ticketId ? sql`AND pu.service_ticket_id = ${parseInt(ticketId)}` : sql``}
      ${partId ? sql`AND pu.part_id = ${parseInt(partId)}` : sql``}
    ORDER BY pu.usage_date DESC`;

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching parts usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch parts usage" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { service_ticket_id, part_id, quantity_used } = await request.json();

    if (!service_ticket_id || !part_id || !quantity_used) {
      return NextResponse.json(
        { error: "Missing required fields: service_ticket_id, part_id, quantity_used" },
        { status: 400 }
      );
    }

    // Get part details and service ticket info
    const partData = await sql`
      SELECT id, unit_cost FROM parts_inventory WHERE id = ${part_id}
    `;

    if (partData.length === 0) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    const unitCost = parseFloat(partData[0].unit_cost);
    const totalCost = unitCost * quantity_used;

    // Get service ticket rider info
    const ticketData = await sql`
      SELECT cee_id FROM service_tickets WHERE id = ${service_ticket_id}
    `;

    if (ticketData.length === 0) {
      return NextResponse.json({ error: "Service ticket not found" }, { status: 404 });
    }

    const ceeId = ticketData[0].cee_id;

    // Insert parts usage
    const result = await sql`
      INSERT INTO parts_usage (
        service_ticket_id,
        part_id,
        quantity_used,
        usage_date,
        created_at
      ) VALUES (
        ${service_ticket_id},
        ${part_id},
        ${quantity_used},
        NOW(),
        NOW()
      ) RETURNING *
    `;

    // Update parts inventory quantity
    const partBeforeUpdate = await sql`
      SELECT quantity_in_stock, minimum_stock_level FROM parts_inventory WHERE id = ${part_id}
    `;

    const newQuantity = partBeforeUpdate[0].quantity_in_stock - quantity_used;

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
      WHERE id = ${part_id}
    `;

    // Create deduction entry for the rider (parts cost deduction)
    const deductionResult = await sql`
      INSERT INTO deductions (
        cee_id,
        amount,
        description,
        entry_date,
        status,
        entry_type,
        created_at
      ) VALUES (
        ${ceeId},
        ${totalCost},
        ${'Parts used in service ticket #' + (ticketData[0]?.ticket_number || service_ticket_id)},
        CURRENT_DATE,
        'pending',
        'parts_deduction',
        NOW()
      ) RETURNING *
    `;

    console.log('[Parts Usage] Created deduction:', {
      ceeId,
      amount: totalCost,
      quantity_used,
      unit_cost: unitCost
    });

    // Get rider info for notification
    const riderInfo = await sql`
      SELECT id, user_id, full_name FROM riders WHERE cee_id = ${ceeId}
    `;

    // Create notification for rider about pending deduction
    if (riderInfo.length > 0) {
      const rider = riderInfo[0];
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
          'deduction_pending',
          'Parts Deduction Pending Approval',
          ${'Parts worth ₹' + totalCost.toFixed(2) + ' used in your vehicle (pending admin approval)'},
          ${deductionResult[0].id},
          ${rider.user_id},
          ${rider.id},
          false,
          NOW()
        )
      `;
    }

    return NextResponse.json(
      { 
        success: true, 
        parts_usage: result[0],
        deduction: deductionResult[0],
        total_cost: totalCost 
      }, 
      { status: 201 }
    );
  } catch (error) {
    console.error("Error recording parts usage:", error);
    return NextResponse.json(
      { error: "Failed to record parts usage", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
