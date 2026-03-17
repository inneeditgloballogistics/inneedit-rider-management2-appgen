import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hubId = searchParams.get("hubId");
    const status = searchParams.get("status");
    const technicianId = searchParams.get("technicianId");

    let query = `SELECT 
      st.id,
      st.ticket_number,
      st.vehicle_id,
      st.technician_id,
      st.assigned_hub_id,
      st.issue_description,
      st.priority,
      st.status,
      st.estimated_hours,
      st.actual_hours,
      st.parts_used,
      st.technician_notes,
      st.completion_date,
      st.created_at,
      st.updated_at,
      v.vehicle_number,
      v.vehicle_type,
      h.hub_name
    FROM service_tickets st
    LEFT JOIN vehicles v ON st.vehicle_id = v.id
    LEFT JOIN hubs h ON st.assigned_hub_id = h.id
    WHERE 1=1`;

    const params: any[] = [];

    if (hubId) {
      query += ` AND st.assigned_hub_id = $${params.length + 1}`;
      params.push(parseInt(hubId));
    }

    if (status) {
      query += ` AND st.status = $${params.length + 1}`;
      params.push(status);
    }

    if (technicianId) {
      query += ` AND st.technician_id = $${params.length + 1}`;
      params.push(technicianId);
    }

    query += ` ORDER BY 
      CASE st.priority
        WHEN 'Critical' THEN 1
        WHEN 'High' THEN 2
        WHEN 'Medium' THEN 3
        WHEN 'Low' THEN 4
      END,
      st.created_at DESC`;

    const tickets = await sql(query, params);
    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error fetching service tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch service tickets" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const {
      vehicle_id,
      technician_id,
      assigned_hub_id,
      issue_description,
      priority,
      estimated_hours,
    } = await request.json();

    // Generate ticket number
    const lastTicket = await sql`SELECT ticket_number FROM service_tickets ORDER BY id DESC LIMIT 1`;
    let ticketNumber = "TKT-001";
    if (lastTicket.length > 0) {
      const lastNum = parseInt(lastTicket[0].ticket_number.split("-")[1]);
      ticketNumber = `TKT-${String(lastNum + 1).padStart(3, "0")}`;
    }

    const result = await sql`
      INSERT INTO service_tickets (
        ticket_number,
        vehicle_id,
        technician_id,
        assigned_hub_id,
        issue_description,
        priority,
        status,
        estimated_hours
      ) VALUES (
        ${ticketNumber},
        ${vehicle_id},
        ${technician_id},
        ${assigned_hub_id},
        ${issue_description},
        ${priority},
        'Open',
        ${estimated_hours || null}
      ) RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating service ticket:", error);
    return NextResponse.json(
      { error: "Failed to create service ticket" },
      { status: 500 }
    );
  }
}
