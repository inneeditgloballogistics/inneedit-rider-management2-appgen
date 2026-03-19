import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Helper function to get user role from session
async function getUserRole(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }
  
  // Get user role from database
  const user = await sql`
    SELECT role FROM "user" WHERE id = ${session.user.id}
  `;
  
  return user?.[0]?.role || null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hubId = searchParams.get("hubId");
    const action = searchParams.get("action");

    if (action === "by-hub" && hubId) {
      const inventory = await sql`
        SELECT 
          id,
          hub_id,
          part_name,
          part_code,
          category,
          quantity_in_stock,
          minimum_stock_level,
          maximum_stock_level,
          unit_cost,
          supplier,
          status,
          last_restock_date,
          next_restock_date,
          created_at,
          updated_at
        FROM parts_inventory
        WHERE hub_id = ${parseInt(hubId)}
        ORDER BY part_name ASC
      `;
      return NextResponse.json(inventory);
    }

    // Get all parts inventory
    const inventory = await sql`
      SELECT 
        id,
        hub_id,
        part_name,
        part_code,
        category,
        quantity_in_stock,
        minimum_stock_level,
        maximum_stock_level,
        unit_cost,
        supplier,
        status,
        last_restock_date,
        created_at,
        updated_at
      FROM parts_inventory
      ORDER BY hub_id, part_name ASC
    `;
    return NextResponse.json(inventory);
  } catch (error) {
    console.error("Error fetching parts inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch parts inventory" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userRole = await getUserRole(request);
    
    // Allow both admin and hub_manager to add parts
    if (!userRole || (userRole !== 'admin' && userRole !== 'hub_manager')) {
      return NextResponse.json(
        { error: "Unauthorized: You don't have permission to add parts" },
        { status: 403 }
      );
    }

    const {
      hubId,
      partName,
      partCode,
      category,
      quantityInStock,
      minimumStockLevel,
      maximumStockLevel,
      unitCost,
      supplier,
    } = await request.json();

    if (!hubId || !partName || !unitCost) {
      return NextResponse.json(
        { error: "Missing required fields: hubId, partName, unitCost" },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO parts_inventory (
        hub_id,
        part_name,
        part_code,
        category,
        quantity_in_stock,
        minimum_stock_level,
        maximum_stock_level,
        unit_cost,
        supplier,
        status,
        created_at,
        updated_at
      ) VALUES (
        ${parseInt(hubId)},
        ${partName},
        ${partCode || ""},
        ${category || "General"},
        ${quantityInStock || 0},
        ${minimumStockLevel || 5},
        ${maximumStockLevel || 100},
        ${parseFloat(unitCost)},
        ${supplier || ""},
        ${quantityInStock > 0 ? "In Stock" : "Out of Stock"},
        NOW(),
        NOW()
      ) RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating parts inventory:", error);
    return NextResponse.json(
      { error: "Failed to create parts inventory" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const userRole = await getUserRole(request);
    
    // Only admin can edit parts
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized: Only admins can edit parts. Hub managers can only add new parts." },
        { status: 403 }
      );
    }

    const { partId, quantityInStock, unitCost, supplier } = await request.json();

    if (!partId) {
      return NextResponse.json(
        { error: "Missing partId" },
        { status: 400 }
      );
    }

    // Get current part data
    const currentPart = await sql`
      SELECT quantity_in_stock, minimum_stock_level FROM parts_inventory WHERE id = ${parseInt(partId)}
    `;

    if (currentPart.length === 0) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    const newQuantity = quantityInStock !== undefined ? quantityInStock : currentPart[0].quantity_in_stock;
    const newStatus = 
      newQuantity === 0 
        ? "Out of Stock" 
        : newQuantity <= currentPart[0].minimum_stock_level 
        ? "Low Stock" 
        : "In Stock";

    const result = await sql`
      UPDATE parts_inventory
      SET 
        quantity_in_stock = ${newQuantity},
        unit_cost = ${unitCost !== undefined ? parseFloat(unitCost) : 'unit_cost'},
        supplier = ${supplier !== undefined ? supplier : 'supplier'},
        status = ${newStatus},
        updated_at = NOW()
      WHERE id = ${parseInt(partId)}
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating parts inventory:", error);
    return NextResponse.json(
      { error: "Failed to update parts inventory" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const userRole = await getUserRole(request);
    
    // Only admin can delete parts
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized: Only admins can delete parts" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const partId = searchParams.get("id");

    if (!partId) {
      return NextResponse.json(
        { error: "Missing partId" },
        { status: 400 }
      );
    }

    await sql`DELETE FROM parts_inventory WHERE id = ${parseInt(partId)}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting parts inventory:", error);
    return NextResponse.json(
      { error: "Failed to delete parts inventory" },
      { status: 500 }
    );
  }
}
