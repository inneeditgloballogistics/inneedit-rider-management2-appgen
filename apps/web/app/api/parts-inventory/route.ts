import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hubId = searchParams.get("hubId");
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    let query = `SELECT * FROM parts_inventory WHERE 1=1`;
    const params: any[] = [];

    if (hubId) {
      query += ` AND hub_id = $${params.length + 1}`;
      params.push(parseInt(hubId));
    }

    if (category) {
      query += ` AND category = $${params.length + 1}`;
      params.push(category);
    }

    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY status DESC, quantity_in_stock ASC`;

    const parts = await sql(query, params);
    return NextResponse.json(parts);
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
    const {
      hub_id,
      part_name,
      part_code,
      category,
      quantity_in_stock,
      minimum_stock_level,
      maximum_stock_level,
      unit_cost,
      supplier,
    } = await request.json();

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
        status
      ) VALUES (
        ${hub_id},
        ${part_name},
        ${part_code},
        ${category},
        ${quantity_in_stock},
        ${minimum_stock_level},
        ${maximum_stock_level},
        ${unit_cost},
        ${supplier},
        CASE 
          WHEN ${quantity_in_stock} = 0 THEN 'Out of Stock'
          WHEN ${quantity_in_stock} <= ${minimum_stock_level} THEN 'Low Stock'
          ELSE 'In Stock'
        END
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
