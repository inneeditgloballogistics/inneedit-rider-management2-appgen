import { NextRequest, NextResponse } from 'next/server';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
      
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 });
      }

      // Convert file to base64 data URL
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;

      // Return mock URL (in production, store in database or cloud storage)
      return NextResponse.json({
        success: true,
        url: dataUrl,
        filename: file.name,
        size: file.size,
        type: file.type
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('[Upload API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
