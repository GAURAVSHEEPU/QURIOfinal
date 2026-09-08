import { NextResponse } from 'next/server';
import http from 'node:http';

const TUTOR_BACKEND_HOST = '127.0.0.1';
const TUTOR_BACKEND_PORT = 8000;

function queryPythonBackend(endpoint: string, method: string, data?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : undefined;
    const req = http.request(
      {
        hostname: TUTOR_BACKEND_HOST,
        port: TUTOR_BACKEND_PORT,
        path: endpoint,
        method,
        headers: {
          ...(payload
            ? {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
              }
            : {}),
        },
        timeout: 15000,
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve({ ok: (res.statusCode ?? 200) < 400, status: res.statusCode ?? 200, data: parsed });
          } catch {
            resolve({ ok: false, status: res.statusCode ?? 500, error: body });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Backend request timed out'));
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

export async function GET() {
  try {
    const res = await queryPythonBackend('/health', 'GET');
    if (res.ok) {
      return NextResponse.json({ connected: true, ...res.data });
    }
    return NextResponse.json({ connected: false, status: res.status }, { status: 502 });
  } catch {
    return NextResponse.json({ connected: false }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await queryPythonBackend('/api/tutor', 'POST', {
      learner_id: body.learner_id || 'LEARNER_0001',
      mode: body.mode || 'explain',
      question: body.question,
      context: body.context || null,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: 'Backend error', detail: result.error || result.data },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Tutor backend unreachable', detail: msg },
      { status: 503 }
    );
  }
}
