import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleNumber = searchParams.get('vehicleNumber');
    const role = searchParams.get('role'); // 'admin', 'hub_manager', 'technician'
    const userHubId = searchParams.get('userHubId'); // for hub managers and technicians

    let query;

    // Get swap history based on role and filters
    if (role === 'hub_manager' && userHubId) {
      const hubId = parseInt(userHubId);
      query = await sql`
        SELECT 
          sr.id,
          sr.ticket_id,
          sr.rider_id,
          sr.vehicle_id,
          sr.replacement_vehicle_id,
          sr.issue_reason,
          sr.status,
          sr.technician_notes,
          sr.created_at,
          sr.completed_at,
          sr.repair_cost,
          v1.vehicle_number as old_vehicle_number,
          v1.vehicle_type as old_vehicle_type,
          v1.model as old_model,
          v2.vehicle_number as new_vehicle_number,
          v2.vehicle_type as new_vehicle_type,
          v2.model as new_model,
          r.full_name as rider_name,
          r.cee_id as rider_cee_id,
          r.phone as rider_phone,
          h.hub_name,
          h.hub_code,
          st.ticket_number,
          st.issue_description,
          st.priority
        FROM swap_requests sr
        LEFT JOIN vehicles v1 ON sr.vehicle_id = v1.id
        LEFT JOIN vehicles v2 ON sr.replacement_vehicle_id = v2.id
        LEFT JOIN riders r ON sr.rider_id = r.id
        LEFT JOIN hubs h ON sr.hub_id = h.id
        LEFT JOIN service_tickets st ON sr.ticket_id = st.id
        WHERE sr.hub_id = ${hubId}
        ${vehicleNumber ? sql`AND (v1.vehicle_number = ${vehicleNumber} OR v2.vehicle_number = ${vehicleNumber})` : sql``}
        ORDER BY sr.created_at DESC
      `;
    } else if (role === 'technician' && userHubId) {
      const hubId = parseInt(userHubId);
      query = await sql`
        SELECT 
          sr.id,
          sr.ticket_id,
          sr.rider_id,
          sr.vehicle_id,
          sr.replacement_vehicle_id,
          sr.issue_reason,
          sr.status,
          sr.technician_notes,
          sr.created_at,
          sr.completed_at,
          sr.repair_cost,
          v1.vehicle_number as old_vehicle_number,
          v1.vehicle_type as old_vehicle_type,
          v1.model as old_model,
          v2.vehicle_number as new_vehicle_number,
          v2.vehicle_type as new_vehicle_type,
          v2.model as new_model,
          r.full_name as rider_name,
          r.cee_id as rider_cee_id,
          r.phone as rider_phone,
          h.hub_name,
          h.hub_code,
          st.ticket_number,
          st.issue_description,
          st.priority
        FROM swap_requests sr
        LEFT JOIN vehicles v1 ON sr.vehicle_id = v1.id
        LEFT JOIN vehicles v2 ON sr.replacement_vehicle_id = v2.id
        LEFT JOIN riders r ON sr.rider_id = r.id
        LEFT JOIN hubs h ON sr.hub_id = h.id
        LEFT JOIN service_tickets st ON sr.ticket_id = st.id
        WHERE sr.hub_id = ${hubId}
        ${vehicleNumber ? sql`AND (v1.vehicle_number = ${vehicleNumber} OR v2.vehicle_number = ${vehicleNumber})` : sql``}
        ORDER BY sr.created_at DESC
      `;
    } else {
      // Admin - sees all records
      query = await sql`
        SELECT 
          sr.id,
          sr.ticket_id,
          sr.rider_id,
          sr.vehicle_id,
          sr.replacement_vehicle_id,
          sr.issue_reason,
          sr.status,
          sr.technician_notes,
          sr.created_at,
          sr.completed_at,
          sr.repair_cost,
          v1.vehicle_number as old_vehicle_number,
          v1.vehicle_type as old_vehicle_type,
          v1.model as old_model,
          v2.vehicle_number as new_vehicle_number,
          v2.vehicle_type as new_vehicle_type,
          v2.model as new_model,
          r.full_name as rider_name,
          r.cee_id as rider_cee_id,
          r.phone as rider_phone,
          h.hub_name,
          h.hub_code,
          st.ticket_number,
          st.issue_description,
          st.priority
        FROM swap_requests sr
        LEFT JOIN vehicles v1 ON sr.vehicle_id = v1.id
        LEFT JOIN vehicles v2 ON sr.replacement_vehicle_id = v2.id
        LEFT JOIN riders r ON sr.rider_id = r.id
        LEFT JOIN hubs h ON sr.hub_id = h.id
        LEFT JOIN service_tickets st ON sr.ticket_id = st.id
        ${vehicleNumber ? sql`WHERE (v1.vehicle_number = ${vehicleNumber} OR v2.vehicle_number = ${vehicleNumber})` : sql``}
        ORDER BY sr.created_at DESC
      `;
    }
    
    return NextResponse.json(query);
  } catch (error) {
    console.error('Error fetching swap history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch swap history', details: String(error) },
      { status: 500 }
    );
  }
}
