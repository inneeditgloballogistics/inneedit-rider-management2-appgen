import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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

    // Convert file to base64 for OpenAI Vision API
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
  const base64 = buffer.toString('base64');
  return await extractWithOpenAI(base64, 'application/pdf', 'pdf');
}

async function extractFromImage(buffer: Buffer) {
  const base64 = buffer.toString('base64');
  return await extractWithOpenAI(base64, 'image/jpeg', 'image');
}

async function extractFromSpreadsheet(buffer: Buffer, fileName: string) {
  // For CSV, parse directly
  if (fileName.endsWith('.csv')) {
    const text = buffer.toString('utf-8');
    return parseCSV(text);
  }
  
  // For Excel, convert to image or use text extraction
  const base64 = buffer.toString('base64');
  return await extractWithOpenAI(base64, 'image/jpeg', 'spreadsheet');
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

async function extractWithOpenAI(base64Data: string, mimeType: string, fileType: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
  });

  // Prepare the prompt based on file type
  const prompt = `Analyze this ${fileType} document which contains rider/delivery partner payout information.

Extract the following information for each rider/delivery partner:
1. CEE ID / Employee ID / Rider ID
2. Full Name / Rider Name
3. Number of Orders / Trips / Deliveries
4. Base Payout Amount / Salary / Payment
5. Week Period / Date Range (if available)

Return the data as a JSON array with this structure:
[
  {
    "ceeId": "CEE123",
    "riderName": "John Doe",
    "orders": 45,
    "basePayout": 15000,
    "weekPeriod": "Week 1 (Jan 1-7)"
  }
]

If any field is not found, use empty string for text fields and 0 for numeric fields.
Extract ALL riders from the document.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
              },
            },
          ],
        },
      ],
      max_tokens: 4000,
      temperature: 0.4,
    });

    const content = response.choices[0].message.content || '';
    
    // Extract JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Could not extract valid JSON from AI response');
    
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    throw new Error(`AI extraction failed: ${error.message}`);
  }
}
