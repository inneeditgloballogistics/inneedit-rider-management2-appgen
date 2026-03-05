import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import fs from 'fs';

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || '';
const processorId = process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID || '';
const location = 'us';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!projectId || !processorId) {
      return NextResponse.json(
        { 
          error: 'Google Cloud credentials not configured',
          message: 'Please set GOOGLE_CLOUD_PROJECT_ID and GOOGLE_DOCUMENT_AI_PROCESSOR_ID'
        },
        { status: 500 }
      );
    }

    // Get credentials from environment
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credentialsJson) {
      return NextResponse.json(
        { error: 'GOOGLE_APPLICATION_CREDENTIALS not set' },
        { status: 500 }
      );
    }

    let credentials;
    try {
      credentials = JSON.parse(credentialsJson);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid GOOGLE_APPLICATION_CREDENTIALS format' },
        { status: 500 }
      );
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const base64Content = fileBuffer.toString('base64');

    // Create JWT auth
    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client = await auth.getClient();
    const processorName = `projects/${projectId}/locations/${location}/processors/${processorId}`;

    // Call Document AI API
    const response = await fetch(
      `https://documentai.googleapis.com/v1/${processorName}:process`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await (client as any).getAccessToken().then((t: any) => t.token)}`,
        },
        body: JSON.stringify({
          rawDocument: {
            content: base64Content,
            mimeType: file.type || 'application/pdf',
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Document AI API error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to process document',
          details: error 
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    const document = result.document;

    // Extract invoice data
    const extractedData = {
      invoiceNumber: '',
      date: '',
      dueDate: '',
      vendor: {
        name: '',
        address: '',
      },
      customer: {
        name: '',
        address: '',
      },
      lineItems: [] as any[],
      subtotal: 0,
      tax: 0,
      total: 0,
      rawEntities: [] as any[],
    };

    // Parse entities
    if (document?.entities) {
      for (const entity of document.entities) {
        const text = entity.mentionText || '';
        const confidence = entity.confidence || 0;

        extractedData.rawEntities.push({
          type: entity.type,
          text: text.substring(0, 100),
          confidence: (confidence * 100).toFixed(2) + '%',
        });

        // Map common invoice fields
        const type = entity.type?.toLowerCase() || '';
        
        if (type.includes('invoice_number') || type.includes('invoice_id')) {
          extractedData.invoiceNumber = text;
        } else if (type.includes('invoice_date') || type.includes('date')) {
          extractedData.date = text;
        } else if (type.includes('due_date')) {
          extractedData.dueDate = text;
        } else if (type.includes('vendor') && type.includes('name')) {
          extractedData.vendor.name = text;
        } else if (type.includes('vendor') && type.includes('address')) {
          extractedData.vendor.address = text;
        } else if (type.includes('customer') && type.includes('name')) {
          extractedData.customer.name = text;
        } else if (type.includes('customer') && type.includes('address')) {
          extractedData.customer.address = text;
        } else if (type.includes('line_item')) {
          extractedData.lineItems.push({ description: text, amount: 0 });
        } else if (type.includes('subtotal')) {
          extractedData.subtotal = parseFloat(text.replace(/[^0-9.-]+/g, '')) || 0;
        } else if (type.includes('tax')) {
          extractedData.tax = parseFloat(text.replace(/[^0-9.-]+/g, '')) || 0;
        } else if (type.includes('total')) {
          extractedData.total = parseFloat(text.replace(/[^0-9.-]+/g, '')) || 0;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
      fileName: file.name,
      message: 'Invoice extracted successfully',
    });

  } catch (error: any) {
    console.error('Invoice extraction error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to extract invoice',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
