import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: { testId: string } }) {
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/api/students/tests/${params.testId}/questions`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { testId: string } }) {
  try {
    const body = await req.json();
    const response = await fetch(`${process.env.BACKEND_URL}/api/students/tests/${params.testId}/verify-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
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