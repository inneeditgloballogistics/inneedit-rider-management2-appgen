import { NextRequest, NextResponse } from 'next/server';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Get file type
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    let extractedData;

    // Handle different file types
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      extractedData = await extractFromPDF(buffer);
    } else if (fileType.includes('sheet') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
      extractedData = await extractFromSpreadsheet(buffer, fileName);
    } else if (fileType.includes('image')) {
      extractedData = await extractFromImage(buffer);
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Please upload PDF, Excel, CSV, or image files.' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      data: extractedData,
      fileName: file.name
    });

  } catch (error: any) {
    console.error('Invoice upload error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to process invoice' 
    }, { status: 500 });
  }
}

async function extractFromPDF(buffer: Buffer) {
  return await extractWithGoogleDocumentAI(buffer, 'application/pdf');
}

async function extractFromImage(buffer: Buffer) {
  return await extractWithGoogleDocumentAI(buffer, 'image/jpeg');
}

async function extractFromSpreadsheet(buffer: Buffer, fileName: string) {
  // For CSV, parse directly
  if (fileName.endsWith('.csv')) {
    const text = buffer.toString('utf-8');
    return parseCSV(text);
  }
  
  // For Excel, parse directly as text
  const text = buffer.toString('utf-8');
  return parseCSV(text);
}

function parseCSV(csvText: string) {
  const lines = csvText.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  const riders = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    
    // Map common column names
    const rider = {
      ceeId: row['cee id'] || row['cee_id'] || row['id'] || row['employee id'] || '',
      riderName: row['name'] || row['rider name'] || row['rider_name'] || row['employee name'] || '',
      orders: parseInt(row['orders'] || row['order count'] || row['trips'] || '0'),
      basePayout: parseFloat(row['payout'] || row['amount'] || row['base payout'] || row['salary'] || '0'),
      weekPeriod: row['week'] || row['period'] || row['week period'] || ''
    };
    
    if (rider.ceeId || rider.riderName) {
      riders.push(rider);
    }
  }
  
  return riders;
}

async function extractWithGoogleDocumentAI(buffer: Buffer, mimeType: string) {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  
  if (!serviceAccountJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not configured in environment variables.');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    const projectId = serviceAccount.project_id;
    const processorId = 'ec20e080f10b01a3'; // Replace with your Document AI processor ID
    const location = 'us'; // Processor location

    // Create client
    const client = new DocumentProcessorServiceClient({
      credentials: serviceAccount,
    });

    const name = client.processorPath(projectId, location, processorId);

    // Encode document
    const encodedDocument = {
      mimeType: mimeType,
      content: buffer,
    };

    // Process document
    const request = {
      name,
      rawDocument: encodedDocument,
    };

    const [result] = await client.processDocument(request as any);
    const document = result.document!;

    // Extract text and tables from the document
    const riders = extractRiderDataFromDocument(document);
    
    if (riders.length === 0) {
      // Fall back to simple text extraction if tables not found
      const text = document.text || '';
      return parsePayrollText(text);
    }

    return riders;

  } catch (error: any) {
    console.error('Document AI error:', error);
    // Fall back to empty extraction on error
    return [];
  }
}

function extractRiderDataFromDocument(document: any) {
  const riders = [];
  
  // Extract from document pages and tables
  if (document.pages && document.pages.length > 0) {
    for (const page of document.pages) {
      if (page.tables && page.tables.length > 0) {
        for (const table of page.tables) {
          const tableData = extractTableData(table);
          riders.push(...tableData);
        }
      }
    }
  }

  return riders;
}

function extractTableData(table: any) {
  const rows = [];
  
  if (!table.bodyRows) return rows;

  // Assuming first row or header row contains column names
  for (const row of table.bodyRows) {
    const cellValues = row.cells?.map((cell: any) => {
      const text = cell.layout?.textAnchor?.textSegments?.map((segment: any) => segment).join('') || '';
      return text.trim();
    }) || [];

    if (cellValues.length > 0) {
      const rider = {
        ceeId: cellValues[0] || '',
        riderName: cellValues[1] || '',
        orders: parseInt(cellValues[2] || '0'),
        basePayout: parseFloat(cellValues[3] || '0'),
        weekPeriod: cellValues[4] || '',
      };
      
      if (rider.ceeId || rider.riderName) {
        rows.push(rider);
      }
    }
  }

  return rows;
}

function parsePayrollText(text: string) {
  // Simple text parsing fallback
  const lines = text.split('
').filter(line => line.trim());
  const riders = [];

  for (const line of lines) {
    // Try to extract rider data from each line
    const match = line.match(/([A-Z0-9]+)\s+(.+?)\s+(\d+)\s+([\d,]+)/);
    if (match) {
      riders.push({
        ceeId: match[1],
        riderName: match[2],
        orders: parseInt(match[3]),
        basePayout: parseFloat(match[4].replace(',', '')),
        weekPeriod: '',
      });
    }
  }

  return riders;
}
