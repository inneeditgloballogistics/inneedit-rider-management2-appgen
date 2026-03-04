import { NextRequest, NextResponse } from 'next/server';
import { sql } from '../utils/sql';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');

    if (key) {
      // Get specific setting
      const result = await sql`
        SELECT * FROM settings WHERE setting_key = ${key}
      `;
      return NextResponse.json(result[0] || null);
    }

    // Get all settings
    const settings = await sql`
      SELECT * FROM settings ORDER BY setting_key
    `;
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { setting_key, setting_value, description } = body;

    const result = await sql`
      INSERT INTO settings (setting_key, setting_value, description, updated_at)
      VALUES (${setting_key}, ${setting_value}, ${description || ''}, NOW())
      ON CONFLICT (setting_key) 
      DO UPDATE SET 
        setting_value = ${setting_value},
        description = ${description || ''},
        updated_at = NOW()
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error saving setting:', error);
    return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;

    // Bulk update settings
    for (const setting of settings) {
      await sql`
        UPDATE settings 
        SET setting_value = ${setting.value}, updated_at = NOW()
        WHERE setting_key = ${setting.key}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
