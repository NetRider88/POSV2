import { NextResponse } from 'next/server';
import { testResults } from '@/app/api/simulator/[id]/route';

export async function GET() {
  try {
    let csv = 'Timestamp,Type,Status,Error Codes,Payload Sample\n';

    testResults.forEach((test) => {
      csv += `"${test.timestamp}","${test.requestType}",${test.passed ? 'Passed' : 'Failed'},"${test.errorCodes.join(', ')}","${JSON.stringify(test.payloadSample).replace(/"/g, '""')}"\n`;
    });

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=test-history.csv'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to export history' },
      { status: 500 }
    );
  }
}
