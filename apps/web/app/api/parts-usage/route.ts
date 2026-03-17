import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticketId");
    const partId = searchParams.get("partId");

    let query = `SELECT 
      pu.*,
      pi.part_name,
      pi.part_code,
      pi.unit_cost,
      st.ticket_number
    FROM parts_usage pu
    LEFT JOIN parts_inventory pi ON pu.part_id = pi.id
    LEFT JOIN service_tickets st ON pu.service_ticket_id = st.id
    WHERE 1=1`;

    const params: any[] = [];

    if (ticketId) {
      query += ` AND pu.service_ticket_id = $${params.length + 1}`;
      params.push(parseInt(ticketId));
    }

    if (partId) {
      query += ` AND pu.part_id = $${params.length + 1}`;
      params.push(parseInt(partId));
    }

    query += ` ORDER BY pu.usage_date DESC`;

    const usage = await sql(query, params);
    return NextResponse.json(usage);
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

    // Insert parts usage
    const result = await sql`
      INSERT INTO parts_usage (
        service_ticket_id,
        part_id,
        quantity_used
      ) VALUES (
        ${service_ticket_id},
        ${part_id},
        ${quantity_used}
      ) RETURNING *
    `;

    // Update parts inventory quantity
    await sql`
      UPDATE parts_inventory
      SET 
        quantity_in_stock = quantity_in_stock - ${quantity_used},
        status = CASE 
          WHEN (quantity_in_stock - ${quantity_used}) = 0 THEN 'Out of Stock'
          WHEN (quantity_in_stock - ${quantity_used}) <= minimum_stock_level THEN 'Low Stock'
          ELSE 'In Stock'
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${part_id}
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error recording parts usage:", error);
    return NextResponse.json(
      { error: "Failed to record parts usage" },
      { status: 500 }
    );
  }
}
