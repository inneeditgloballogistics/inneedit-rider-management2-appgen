import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find technician by email
    const technician = await sql`
      SELECT 
        id,
        user_id,
        hub_id,
        name,
        email,
        phone,
        password_hash,
        status
      FROM technicians
      WHERE email = ${email}
    `;

    if (technician.length === 0) {
      return NextResponse.json(
        { error: "Email not found. Please contact your administrator." },
        { status: 401 }
      );
    }

    const tech = technician[0];

    // Check if technician is active
    if (tech.status !== "active") {
      return NextResponse.json(
        { error: "Your account is not active. Please contact administrator." },
        { status: 401 }
      );
    }

    // Verify password
    const passwordHash = hashPassword(password);
    if (tech.password_hash !== passwordHash) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Return technician data
    return NextResponse.json(
      {
        success: true,
        technician: {
          id: tech.id,
          user_id: tech.user_id,
          hub_id: tech.hub_id,
          name: tech.name,
          email: tech.email,
          phone: tech.phone,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Technician login error:", error);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
