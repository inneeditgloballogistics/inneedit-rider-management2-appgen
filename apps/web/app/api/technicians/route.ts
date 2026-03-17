import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";
import crypto from "crypto";

// Hash password function
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hubId = searchParams.get("hub_id");
    const action = searchParams.get("action");

    // If action is count, return count instead of data
    if (action === "count") {
      if (hubId) {
        const result = await sql`
          SELECT COUNT(*) as count FROM technicians WHERE hub_id = ${parseInt(hubId)}
        `;
        return NextResponse.json({ count: result[0].count });
      } else {
        const result = await sql`
          SELECT COUNT(*) as count FROM technicians
        `;
        return NextResponse.json({ count: result[0].count });
      }
    }

    let technicians;

    if (hubId) {
      technicians = await sql`
        SELECT 
          id,
          user_id,
          hub_id,
          name,
          email,
          phone,
          status,
          created_at,
          updated_at
        FROM technicians
        WHERE hub_id = ${parseInt(hubId)}
        ORDER BY created_at DESC
      `;
    } else {
      technicians = await sql`
        SELECT 
          id,
          user_id,
          hub_id,
          name,
          email,
          phone,
          status,
          created_at,
          updated_at
        FROM technicians
        ORDER BY created_at DESC
      `;
    }

    return NextResponse.json(technicians);
  } catch (error) {
    console.error("Error fetching technicians:", error);
    return NextResponse.json(
      { error: "Failed to fetch technicians" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, phone, hub_id, password } = await request.json();

    // Validation
    if (!name || !email || !phone || !hub_id || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingTechnician = await sql`
      SELECT id FROM technicians WHERE email = ${email}
    `;

    if (existingTechnician.length > 0) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Generate user_id
    const userId = `TECH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Hash password
    const passwordHash = hashPassword(password);

    // Create technician
    const result = await sql`
      INSERT INTO technicians (
        user_id,
        hub_id,
        name,
        email,
        phone,
        password_hash,
        status
      ) VALUES (
        ${userId},
        ${hub_id},
        ${name},
        ${email},
        ${phone},
        ${passwordHash},
        'active'
      ) RETURNING id, user_id, hub_id, name, email, phone, status, created_at
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error: any) {
    console.error("Error creating technician:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create technician" },
      { status: 500 }
    );
  }
}
