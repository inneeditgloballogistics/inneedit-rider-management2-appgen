import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

// GET all service charges for a rider or by ticket
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId');
    const riderId = searchParams.get('riderId');

    console.log('[GET /api/service-charges] Params:', { ticketId, riderId });

    if (ticketId) {
      // Get charges for a specific ticket
      // First get the ticket number from the ticket ID
      const ticketInfo = await sql`
        SELECT ticket_number, cee_id FROM service_tickets WHERE id = ${parseInt(ticketId)}
      `;

      console.log('[GET /api/service-charges] Ticket info:', ticketInfo);

      if (ticketInfo.length === 0) {
        console.log('[GET /api/service-charges] Ticket not found');
        return NextResponse.json([]);
      }

      const ticketNumber = ticketInfo[0].ticket_number;
      const ceeId = ticketInfo[0].cee_id;

      console.log('[GET /api/service-charges] Searching for charges:', { ticketNumber, ceeId });

      // Now get charges for this rider and ticket
      const charges = await sql`
        SELECT d.* FROM deductions d
        WHERE d.cee_id = ${ceeId}
        AND d.entry_type = 'service_charge'
        AND d.description LIKE ${'%' + ticketNumber + '%'}
        ORDER BY d.created_at DESC
      `;

      console.log('[GET /api/service-charges] Found charges:', charges);
      return NextResponse.json(charges);
    }

    if (riderId) {
      // Get all service charges for a rider
      const charges = await sql`
        SELECT d.* FROM deductions d
        WHERE d.cee_id = ${riderId}
        AND d.entry_type = 'service_charge'
        ORDER BY d.entry_date DESC
      `;
      return NextResponse.json(charges);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('[GET /api/service-charges] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch charges' }, { status: 500 });
  }
}

// UPDATE service charges (hub manager can edit)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { deductionId, amount, description } = body;

    if (!deductionId) {
      return NextResponse.json({ error: 'Missing deductionId' }, { status: 400 });
    }

    // Get the existing deduction
    const existing = await sql`
      SELECT * FROM deductions WHERE id = ${parseInt(deductionId)}
    `;

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Deduction not found' }, { status: 404 });
    }

    // Only allow editing if it's a service charge and approved
    if (existing[0].entry_type !== 'service_charge') {
      return NextResponse.json({ error: 'Can only edit service charges' }, { status: 400 });
    }

    const result = await sql`
      UPDATE deductions
      SET 
        amount = COALESCE(${amount !== undefined ? amount : null}, amount),
        description = COALESCE(${description || null}, description),
        updated_at = NOW()
      WHERE id = ${parseInt(deductionId)}
      RETURNING *
    `;

    console.log('Service charge updated:', result[0]);
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating service charge:', error);
    return NextResponse.json({ error: 'Failed to update charge' }, { status: 500 });
  }
}

// DELETE service charges (hub manager can remove)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deductionId = searchParams.get('deductionId');

    if (!deductionId) {
      return NextResponse.json({ error: 'Missing deductionId' }, { status: 400 });
    }

    // Get the existing deduction
    const existing = await sql`
      SELECT * FROM deductions WHERE id = ${parseInt(deductionId)}
    `;

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Deduction not found' }, { status: 404 });
    }

    // Only allow deleting if it's a service charge
    if (existing[0].entry_type !== 'service_charge') {
      return NextResponse.json({ error: 'Can only delete service charges' }, { status: 400 });
    }

    const result = await sql`
      DELETE FROM deductions
      WHERE id = ${parseInt(deductionId)}
      RETURNING *
    `;

    console.log('Service charge deleted:', result[0]);
    return NextResponse.json({ success: true, deleted: result[0] });
  } catch (error) {
    console.error('Error deleting service charge:', error);
    return NextResponse.json({ error: 'Failed to delete charge' }, { status: 500 });
  }
}
