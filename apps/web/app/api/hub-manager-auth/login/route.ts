import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find hub manager by email
    const managers = await sql`
      SELECT hm.id, hm.user_id, hm.hub_id, hm.manager_name, hm.manager_email, hm.manager_phone, 
             hm.password_hash, hm.status, h.hub_name, h.hub_code, h.location, h.city
      FROM hub_managers hm
      JOIN hubs h ON h.id = hm.hub_id
      WHERE LOWER(hm.manager_email) = LOWER(${email})
      LIMIT 1
    `;

    if (managers.length === 0) {
      return NextResponse.json(
        { error: 'Email not found. Please contact your administrator.' },
        { status: 404 }
      );
    }

    const manager = managers[0];

    // Check if manager is active
    if (manager.status !== 'active') {
      return NextResponse.json(
        { error: 'Your account is not active. Please contact your administrator.' },
        { status: 403 }
      );
    }

    // Check if password is set
    if (!manager.password_hash) {
      return NextResponse.json(
        { 
          error: 'Password not set. Please set your password first.',
          redirectTo: '/hub-manager-password-setup',
          needsPasswordSetup: true
        },
        { status: 400 }
      );
    }

    // Verify password
    if (!verifyPassword(password, manager.password_hash)) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get or create user entry
    let userId = manager.user_id;

    if (userId) {
      const userExists = await sql`
        SELECT id FROM "user" WHERE id = ${userId}
      `;
      
      if (userExists.length === 0) {
        // User ID exists but user doesn't exist, create it
        await sql`
          INSERT INTO "user" (id, name, email, role, "emailVerified", "createdAt", "updatedAt")
          VALUES (
            ${userId},
            ${manager.manager_name},
            ${manager.manager_email},
            'hub_manager',
            true,
            NOW(),
            NOW()
          )
        `;
      }
    } else {
      // No user_id, check if user exists by email
      const existingUsers = await sql`
        SELECT id FROM "user" WHERE LOWER(email) = LOWER(${manager.manager_email})
      `;

      if (existingUsers.length > 0) {
        userId = existingUsers[0].id;
      } else {
        // Create a new user entry
        userId = crypto.randomUUID();
        await sql`
          INSERT INTO "user" (id, name, email, role, "emailVerified", "createdAt", "updatedAt")
          VALUES (
            ${userId},
            ${manager.manager_name},
            ${manager.manager_email},
            'hub_manager',
            true,
            NOW(),
            NOW()
          )
        `;
      }

      // Link user to manager
      await sql`
        UPDATE hub_managers
        SET user_id = ${userId}
        WHERE id = ${manager.id}
      `;
    }

    // Create session
    const sessionToken = `hub_manager_${crypto.randomUUID()}`;
    const expiresAtDate = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const sessionId = crypto.randomUUID();

    await sql`
      INSERT INTO session (id, "userId", token, "expiresAt", "createdAt", "updatedAt")
      VALUES (
        ${sessionId},
        ${userId},
        ${sessionToken},
        ${expiresAtDate},
        NOW(),
        NOW()
      )
    `;

    // Return success response
    const response = NextResponse.json({
      success: true,
      manager: {
        id: manager.id,
        name: manager.manager_name,
        email: manager.manager_email,
        phone: manager.manager_phone,
        hubId: manager.hub_id,
        hubName: manager.hub_name,
        hubCode: manager.hub_code,
        location: manager.location,
        city: manager.city,
      },
    });

    // Set session cookie
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Hub manager login error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
