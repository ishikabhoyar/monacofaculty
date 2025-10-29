import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(
  req: Request,
  context: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await context.params;
    const authHeader = req.headers.get('Authorization');
    
    const response = await fetch(`${process.env.BACKEND_URL}/api/students/tests/${testId}/questions`, {
      headers: {
        'Authorization': authHeader || ''
      }
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await context.params;
    const body = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    const response = await fetch(`${process.env.BACKEND_URL}/api/students/tests/${testId}/verify-password`, {
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
    console.error('Error verifying password:', error);
    return NextResponse.json({ success: false, message: 'Failed to verify password' }, { status: 500 });
  }
}