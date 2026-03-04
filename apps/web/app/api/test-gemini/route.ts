import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not found in environment variables' }, { status: 500 });
  }

  try {
    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: "Say 'API is working' if you can read this.",
        },
      ],
    });

    if (response.choices[0].message.content) {
      return NextResponse.json({
        success: true,
        message: '✅ OpenAI API key is working!',
        statusCode: 200,
        modelResponse: response.choices[0].message.content,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: '❌ OpenAI API key test failed',
        statusCode: 400,
        error: 'No response from OpenAI',
      }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: '❌ Error testing OpenAI API',
      error: error.message,
    }, { status: 500 });
  }
}
