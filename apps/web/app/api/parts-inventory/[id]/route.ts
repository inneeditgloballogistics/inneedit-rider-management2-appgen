import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const part = await sql`
      SELECT * FROM parts_inventory WHERE id = ${parseInt(id)}
    `;

    if (part.length === 0) {
      return NextResponse.json(
        { error: "Part not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(part[0]);
  } catch (error) {
    console.error("Error fetching part:", error);
    return NextResponse.json(
      { error: "Failed to fetch part" },
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
    const {
      quantity_in_stock,
      minimum_stock_level,
      maximum_stock_level,
      last_restock_date,
      next_restock_date,
      supplier,
    } = await request.json();

    // Determine status based on quantity
    let statusQuery = `status`;
    if (quantity_in_stock !== undefined) {
      statusQuery = `CASE 
        WHEN ${quantity_in_stock} = 0 THEN 'Out of Stock'
        WHEN ${quantity_in_stock} <= COALESCE(${minimum_stock_level}, 5) THEN 'Low Stock'
        ELSE 'In Stock'
      END`;
    }

    const part = await sql`
      UPDATE parts_inventory
      SET 
        quantity_in_stock = COALESCE(${quantity_in_stock}, quantity_in_stock),
        minimum_stock_level = COALESCE(${minimum_stock_level}, minimum_stock_level),
        maximum_stock_level = COALESCE(${maximum_stock_level}, maximum_stock_level),
        last_restock_date = COALESCE(${last_restock_date}, last_restock_date),
        next_restock_date = COALESCE(${next_restock_date}, next_restock_date),
        supplier = COALESCE(${supplier}, supplier),
        status = ${statusQuery},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;

    if (part.length === 0) {
      return NextResponse.json(
        { error: "Part not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(part[0]);
  } catch (error) {
    console.error("Error updating part:", error);
    return NextResponse.json(
      { error: "Failed to update part" },
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

    const result = await sql`
      DELETE FROM parts_inventory
      WHERE id = ${parseInt(id)}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Part not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Part deleted successfully" });
  } catch (error) {
    console.error("Error deleting part:", error);
    return NextResponse.json(
      { error: "Failed to delete part" },
      { status: 500 }
    );
  }
}
