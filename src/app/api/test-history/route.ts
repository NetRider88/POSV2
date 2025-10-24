import { NextResponse } from 'next/server';
import { testResults } from '@/app/api/simulator/[id]/route';

export async function GET() {
  return NextResponse.json(testResults);
}
