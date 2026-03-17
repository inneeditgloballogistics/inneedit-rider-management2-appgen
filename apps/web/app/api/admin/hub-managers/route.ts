import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/api/utils/sql';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// GET all hub managers
export async function GET(request: NextRequest) {
  try {
    const managers = await sql`
      SELECT 
        hm.id,
        hm.user_id,
        hm.hub_id,
        hm.manager_name,
        hm.manager_email,
        hm.manager_phone,
        hm.status,
        hm.created_at,
        h.hub_name,
        h.hub_code
      FROM hub_managers hm
      JOIN hubs h ON h.id = hm.hub_id
      ORDER BY hm.created_at DESC
    `;

    return NextResponse.json(managers);
  } catch (error: any) {
    console.error('Fetch managers error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch hub managers' },
      { status: 500 }
    );
  }
}

// POST create new hub manager
export async function POST(request: NextRequest) {
  try {
    const { managerName, managerEmail, managerPhone, hubId, password } = await request.json();

    if (!managerName || !managerEmail || !hubId) {
      return NextResponse.json(
        { error: 'Manager name, email, and hub ID are required' },
        { status: 400 }
      );
    }

    // Check if manager email already exists
    const existing = await sql`
      SELECT id FROM hub_managers WHERE LOWER(manager_email) = LOWER(${managerEmail})
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A manager with this email already exists' },
        { status: 409 }
      );
    }

    // Create user account
    const userId = crypto.randomUUID();
    await sql`
      INSERT INTO "user" (id, name, email, role, "emailVerified", "createdAt", "updatedAt")
      VALUES (${userId}, ${managerName}, ${managerEmail}, 'hub_manager', true, NOW(), NOW())
    `;

    // Hash password if provided
    let passwordHash = null;
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters' },
          { status: 400 }
        );
      }
      passwordHash = hashPassword(password);
    }

    // Create hub manager
    const result = await sql`
      INSERT INTO hub_managers 
        (user_id, hub_id, manager_name, manager_email, manager_phone, password_hash, status, created_at, updated_at)
      VALUES 
        (${userId}, ${parseInt(hubId)}, ${managerName}, ${managerEmail}, ${managerPhone || null}, ${passwordHash}, 'active', NOW(), NOW())
      RETURNING id, user_id, hub_id, manager_name, manager_email, manager_phone, status
    `;

    return NextResponse.json({
      success: true,
      message: 'Hub manager created successfully',
      manager: result[0],
    });
  } catch (error: any) {
    console.error('Create manager error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create hub manager' },
      { status: 500 }
    );
  }
}

// PUT update hub manager
export async function PUT(request: NextRequest) {
  try {
    const { managerId, managerName, managerPhone, status } = await request.json();

    if (!managerId) {
      return NextResponse.json(
        { error: 'Manager ID is required' },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE hub_managers
      SET 
        manager_name = COALESCE(${managerName || null}, manager_name),
        manager_phone = COALESCE(${managerPhone || null}, manager_phone),
        status = COALESCE(${status || null}, status),
        updated_at = NOW()
      WHERE id = ${parseInt(managerId)}
      RETURNING id, manager_name, manager_email, manager_phone, status
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Hub manager not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Hub manager updated successfully',
      manager: result[0],
    });
  } catch (error: any) {
    console.error('Update manager error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update hub manager' },
      { status: 500 }
    );
  }
}

// DELETE hub manager
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const managerId = searchParams.get('id');

    if (!managerId) {
      return NextResponse.json(
        { error: 'Manager ID is required' },
        { status: 400 }
      );
    }

    const manager = await sql`
      SELECT user_id FROM hub_managers WHERE id = ${parseInt(managerId)}
    `;

    if (manager.length === 0) {
      return NextResponse.json(
        { error: 'Hub manager not found' },
        { status: 404 }
      );
    }

    // Delete hub manager
    await sql`
      DELETE FROM hub_managers WHERE id = ${parseInt(managerId)}
    `;

    // Optionally delete associated user (be careful with this!)
    // await sql`DELETE FROM "user" WHERE id = ${manager[0].user_id}`;

    return NextResponse.json({
      success: true,
      message: 'Hub manager deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete manager error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete hub manager' },
      { status: 500 }
    );
  }
}
