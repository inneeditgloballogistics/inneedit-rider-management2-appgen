import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";
import * as crypto from 'crypto';

function generateUserId() {
  // Generate a unique ID similar to auth system
  return 'user_' + crypto.randomBytes(12).toString('hex');
}

export async function POST(request: Request) {
  try {
    const { hub_id, email, password, manager_name } = await request.json();

    if (!hub_id || !email || !password) {
      return NextResponse.json(
        { error: 'Hub ID, email, and password are required' },
        { status: 400 }
      );
    }

    // Hash the password
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    // Check if hub exists
    const hubCheck = await sql`
      SELECT id FROM hubs WHERE id = ${hub_id}
    `;

    if (hubCheck.length === 0) {
      return NextResponse.json(
        { error: 'Hub not found' },
        { status: 404 }
      );
    }

    // Check if user with this email already exists
    const existingUser = await sql`
      SELECT id FROM "user" WHERE email = ${email}
    `;

    let userId;
    
    if (existingUser.length > 0) {
      userId = existingUser[0].id;
    } else {
      // Create new user for hub manager
      userId = generateUserId();
      await sql`
        INSERT INTO "user" (id, email, name, role, "createdAt", "updatedAt")
        VALUES (${userId}, ${email}, ${manager_name || 'Hub Manager'}, 'hub-manager', NOW(), NOW())
      `;
    }

    // Check if hub manager with this user_id already exists
    const existingManager = await sql`
      SELECT id FROM hub_managers WHERE user_id = ${userId}
    `;

    let result;
    if (existingManager.length > 0) {
      // Update existing manager
      result = await sql`
        UPDATE hub_managers
        SET password_hash = ${passwordHash}, manager_name = ${manager_name || ''}, updated_at = NOW()
        WHERE user_id = ${userId}
        RETURNING id, manager_email, user_id
      `;
    } else {
      // Create new hub manager
      result = await sql`
        INSERT INTO hub_managers (
          user_id,
          hub_id,
          manager_email,
          password_hash,
          manager_name,
          status,
          created_at,
          updated_at
        ) VALUES (
          ${userId},
          ${hub_id},
          ${email},
          ${passwordHash},
          ${manager_name || 'Hub Manager'},
          'active',
          NOW(),
          NOW()
        )
        RETURNING id, manager_email, user_id
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Hub manager credentials created successfully',
      manager: result[0]
    });
  } catch (error: any) {
    console.error('Error creating hub manager credentials:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create credentials' },
      { status: 500 }
    );
  }
}
