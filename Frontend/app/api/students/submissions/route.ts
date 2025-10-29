import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    const response = await fetch(`${process.env.BACKEND_URL}/api/students/submissions`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error submitting code:', error);
    return NextResponse.json({ success: false, message: 'Failed to submit code' }, { status: 500 });
  }
}