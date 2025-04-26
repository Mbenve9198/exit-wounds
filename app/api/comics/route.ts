import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Comic } from '@/lib/models/Comic';

export async function GET() {
  try {
    const db = await getDatabase();
    const comics = await db.collection('comics')
      .find({ published: true })
      .sort({ createdAt: -1 })
      .toArray() as unknown as Comic[];
    
    return NextResponse.json({ comics });
  } catch (error) {
    console.error('Error retrieving comics:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 