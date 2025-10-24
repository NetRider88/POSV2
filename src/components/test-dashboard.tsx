'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function TestDashboard() {
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0 });

  useEffect(() => {
    // Fetch test history from API
    fetch('/api/test-history')
      .then(res => res.json())
      .then(data => {
        setTestHistory(data);
        setStats({
          total: data.length,
          passed: data.filter((t: any) => t.passed).length,
          failed: data.filter((t: any) => !t.passed).length
        });
      });
  }, []);

  const exportCSV = () => {
    window.location.href = '/api/export-history';
  };

  return (
    <Card className="max-w-6xl mx-auto mt-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Test Validation Dashboard</CardTitle>
          <Button onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard title="Total Tests" value={stats.total} />
          <StatCard title="Tests Passed" value={stats.passed} variant="success" />
          <StatCard title="Tests Failed" value={stats.failed} variant="destructive" />
        </div>

        <h3 className="text-lg font-semibold mb-4">Test History</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Error Codes</TableHead>
              <TableHead>Payload Sample</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {testHistory.map((test) => (
              <TableRow key={test.timestamp}>
                <TableCell>{new Date(test.timestamp).toLocaleString()}</TableCell>
                <TableCell>{test.requestType}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded ${
                    test.passed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {test.passed ? 'Passed' : 'Failed'}
                  </span>
                </TableCell>
                <TableCell>
                  {test.errorCodes?.join(', ') || '-'}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {JSON.stringify(test.payloadSample)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function StatCard({ title, value, variant = 'default' }: { 
  title: string, 
  value: number,
  variant?: 'default' | 'success' | 'destructive' 
}) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    destructive: 'bg-red-100 text-red-800'
  };

  return (
    <Card>
      <CardContent className="p-4">
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
        <p className={`text-2xl font-bold mt-2 ${variantClasses[variant]}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
