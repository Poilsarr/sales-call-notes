import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { SharedArray } from 'k6/data';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '4m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.001'],
  },
};

const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'k6-load-test/1.0',
};

if (AUTH_TOKEN) {
  headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
}

const callIds = new SharedArray('callIds', function () {
  const res = http.get(`${BASE_URL}/api/calls?limit=100`, { headers });
  if (res.status !== 200) return [];
  try {
    const body = JSON.parse(res.body);
    return (body.calls || []).map((c) => c.id);
  } catch {
    return [];
  }
});

export default function () {
  group('GET /api/calls', function () {
    const res = http.get(`${BASE_URL}/api/calls?limit=20`, { headers });
    check(res, {
      'calls list status OK': (r) => r.status === 200 || r.status === 401,
      'calls list duration < 200ms': (r) => r.timings.duration < 200,
    });
  });

  group('GET /api/calls/:id', function () {
    const id = callIds.length > 0
      ? callIds[Math.floor(Math.random() * callIds.length)]
      : 'nonexistent';
    const res = http.get(`${BASE_URL}/api/calls/${id}`, { headers });
    check(res, {
      'single call status OK': (r) => [200, 401, 403, 404].includes(r.status),
      'single call duration < 200ms': (r) => r.timings.duration < 200,
    });
  });

  group('GET /api/analytics', function () {
    const res = http.get(`${BASE_URL}/api/analytics`, { headers });
    check(res, {
      'analytics status OK': (r) => r.status === 200 || r.status === 401,
      'analytics duration < 200ms': (r) => r.timings.duration < 200,
    });
  });

  sleep(1);
}
