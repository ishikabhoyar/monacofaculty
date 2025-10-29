import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    
    const response = await fetch(`${process.env.BACKEND_URL}/api/students/tests`, {
      headers: {
        'Authorization': authHeader || ''
      }
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching tests:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch tests' }, { status: 500 });
  }
}