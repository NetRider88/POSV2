export const responseTimeData = [
  { endpoint: '/auth/login', time: 120 },
  { endpoint: '/orders', time: 250 },
  { endpoint: '/catalog', time: 400 },
  { endpoint: '/webhooks', time: 80 },
  { endpoint: '/ssl', time: 150 },
];

export const successRateData = [
  { time: '12:00', rate: 99.8 },
  { time: '12:05', rate: 99.5 },
  { time: '12:10', rate: 100 },
  { time: '12:15', rate: 99.9 },
  { time: '12:20', rate: 99.7 },
  { time: '12:25', rate: 99.8 },
  { time: '12:30', rate: 100 },
];

export const errorLogs = [
  { id: 'ERR-001', time: '12:05:12', endpoint: '/orders', status: 500, message: 'Internal Server Error' },
  { id: 'ERR-002', time: '11:50:34', endpoint: '/catalog', status: 400, message: 'Invalid JSON format' },
  { id: 'ERR-003', time: '11:45:01', endpoint: '/auth/login', status: 401, message: 'Unauthorized: Invalid credentials' },
  { id: 'ERR-004', time: '11:30:15', endpoint: '/orders', status: 429, message: 'Rate limit exceeded' },
];

export const chartConfig = {
  time: {
    label: 'Response Time (ms)',
    color: 'hsl(var(--primary))',
  },
  rate: {
    label: 'Success Rate (%)',
    color: 'hsl(var(--accent))',
  },
};
