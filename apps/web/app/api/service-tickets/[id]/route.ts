import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ticket = await sql`
      SELECT 
        st.*,
        v.vehicle_number,
        v.vehicle_type,
        h.hub_name
      FROM service_tickets st
      LEFT JOIN vehicles v ON st.vehicle_id = v.id
      LEFT JOIN hubs h ON st.assigned_hub_id = h.id
      WHERE st.id = ${parseInt(id)}
    `;

    if (ticket.length === 0) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Get parts used
    const parts = await sql`
      SELECT pu.*, pi.part_name, pi.part_code, pi.unit_cost
      FROM parts_usage pu
      LEFT JOIN parts_inventory pi ON pu.part_id = pi.id
      WHERE pu.service_ticket_id = ${parseInt(id)}
    `;

    return NextResponse.json({ ...ticket[0], parts_used_details: parts });
  } catch (error) {
    console.error("Error fetching service ticket:", error);
    return NextResponse.json(
      { error: "Failed to fetch service ticket" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, actual_hours, technician_notes, parts_used } = await request.json();

    const ticket = await sql`
      UPDATE service_tickets
      SET 
        status = COALESCE(${status}, status),
        actual_hours = COALESCE(${actual_hours}, actual_hours),
        technician_notes = COALESCE(${technician_notes}, technician_notes),
        parts_used = COALESCE(${parts_used}, parts_used),
        completion_date = CASE WHEN ${status} = 'Completed' THEN CURRENT_TIMESTAMP ELSE completion_date END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;

    if (ticket.length === 0) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(ticket[0]);
  } catch (error) {
    console.error("Error updating service ticket:", error);
    return NextResponse.json(
      { error: "Failed to update service ticket" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Delete parts usage first
    await sql`DELETE FROM parts_usage WHERE service_ticket_id = ${parseInt(id)}`;

    // Delete ticket
    const result = await sql`
      DELETE FROM service_tickets
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.error("Error deleting service ticket:", error);
    return NextResponse.json(
      { error: "Failed to delete service ticket" },
      { status: 500 }
    );
  }
}
