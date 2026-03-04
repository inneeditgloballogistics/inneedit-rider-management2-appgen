import { NextRequest, NextResponse } from 'next/server';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';

// Initialize Google Cloud clients
const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || '';
const location = 'us'; // Document AI location
const processorId = process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID || '';

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

    // Check if credentials are configured
    if (!projectId || !processorId) {
      return NextResponse.json(
        { 
          error: 'Google Cloud credentials not configured',
          message: 'Please set GOOGLE_CLOUD_PROJECT_ID and GOOGLE_DOCUMENT_AI_PROCESSOR_ID in environment variables'
        },
        { status: 500 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64String = Buffer.from(bytes).toString('base64');

    // Initialize Document AI client
    const client = new DocumentProcessorServiceClient({
      projectId,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    const processorName = client.processorPath(projectId, location, processorId);

    // Process the document
    const request_obj = {
      name: processorName,
      rawDocument: {
        content: Buffer.from(base64String, 'base64'),
        mimeType: file.type || 'application/pdf',
      },
    };

    const [result] = await client.processDocument(request_obj as any);
    const document = result.document;

    // Extract invoice data from entities
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
        switch (entity.type?.toLowerCase()) {
          case 'invoice_number':
            extractedData.invoiceNumber = text;
            break;
          case 'invoice_date':
            extractedData.date = text;
            break;
          case 'due_date':
            extractedData.dueDate = text;
            break;
          case 'vendor_name':
            extractedData.vendor.name = text;
            break;
          case 'vendor_address':
            extractedData.vendor.address = text;
            break;
          case 'customer_name':
            extractedData.customer.name = text;
            break;
          case 'customer_address':
            extractedData.customer.address = text;
            break;
          case 'line_item':
            extractedData.lineItems.push({
              description: text,
              amount: 0,
            });
            break;
          case 'subtotal':
            extractedData.subtotal = parseFloat(text.replace(/[^0-9.-]+/g, '')) || 0;
            break;
          case 'tax_amount':
            extractedData.tax = parseFloat(text.replace(/[^0-9.-]+/g, '')) || 0;
            break;
          case 'total_amount':
            extractedData.total = parseFloat(text.replace(/[^0-9.-]+/g, '')) || 0;
            break;
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
        details: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
