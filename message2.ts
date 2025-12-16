/**
 * Tavus → TypeScript Webhook → n8n
 *
 * This server:
 *  - Receives Tavus callbacks at /tavus/webhook
 *  - Listens specifically for event_type: "application.transcription_ready"
 *  - Forwards transcript + metadata to your n8n Webhook Trigger URL
 *
 * Example Tavus payload:
 * {
 *   "properties": {
 *     "replica_id": "<replica_id>",
 *     "transcript": [
 *       { "role": "system", "content": "..." },
 *       { "role": "user", "content": "Hi." },
 *       { "role": "assistant", "content": "How's it going?" },
 *       ...
 *     ]
 *   },
 *   "conversation_id": "<conversation_id>",
 *   "webhook_url": "<webhook_url>",
 *   "event_type": "application.transcription_ready",
 *   "message_type": "application",
 *   "timestamp": "2025-07-11T06:48:37.566057Z"
 * }
 *
 * Env vars:
 *   - N8N_WEBHOOK_URL  (the URL from your n8n Webhook node)
 *   - PORT             (optional, default 4000)
 */

import http, { IncomingMessage, ServerResponse } from 'http';

// ---------- Types based on the Tavus example ----------

export interface TavusTranscriptMessage {
  role: 'system' | 'user' | 'assistant' | string;
  content: string;
}

export interface TavusWebhookProperties {
  replica_id?: string;
  transcript?: TavusTranscriptMessage[];
  // other fields may exist; keep it open-ended
  [key: string]: unknown;
}

export interface TavusWebhookPayload {
  properties: TavusWebhookProperties;
  conversation_id: string;
  webhook_url: string;
  event_type: string;     // e.g. "application.transcription_ready"
  message_type: string;   // e.g. "application"
  timestamp: string;      // ISO timestamp
  [key: string]: unknown; // future-proofing
}

// ---------- Config ----------

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL; // e.g. https://n8n.yourdomain/webhook/tavus-transcript
const PORT = Number(process.env.PORT) || 4000;

if (!N8N_WEBHOOK_URL) {
  console.warn(
    '[WARN] N8N_WEBHOOK_URL is not set. Webhook will receive Tavus events, ' +
      'but nothing will be forwarded to n8n.'
  );
}

// ---------- Helpers ----------

function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    req.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8');
      resolve(body);
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

async function forwardToN8N(payload: unknown): Promise<void> {
  if (!N8N_WEBHOOK_URL) return;

  try {
    const resp = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      console.error('[n8n] Error forwarding to n8n:', resp.status, text);
    } else {
      console.log('[n8n] Successfully forwarded transcript to n8n');
    }
  } catch (err) {
    console.error('[n8n] Network/forward error:', err);
  }
}

// ---------- Main HTTP server ----------

const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');

    // Only handle POST /tavus/webhook
    if (req.method !== 'POST' || url.pathname !== '/tavus/webhook') {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    const rawBody = await readRequestBody(req);
    let payload: TavusWebhookPayload;

    try {
      payload = JSON.parse(rawBody);
    } catch (err) {
      console.error('Failed to parse JSON body:', err);
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }

    const {
      event_type,
      message_type,
      conversation_id,
      timestamp,
      webhook_url,
      properties,
    } = payload;

    console.log('Received Tavus callback:', {
      event_type,
      message_type,
      conversation_id,
      timestamp,
    });

    // Only care about application.transcription_ready
    if (event_type === 'application.transcription_ready') {
      console.log('📝 Transcript is ready for conversation:', conversation_id);

      const transcript: TavusTranscriptMessage[] = properties.transcript ?? [];

      // Forward a clean payload to n8n so a Webhook Trigger can start a workflow
      await forwardToN8N({
        source: 'tavus',
        event_type,
        message_type,
        conversation_id,
        timestamp,
        webhook_url,
        transcript,
      });
    }

    // Respond quickly so Tavus considers the webhook successful
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'success' }));
  } catch (err) {
    console.error('Error handling Tavus webhook:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

// ---------- Start server ----------

server.listen(PORT, () => {
  console.log(`Tavus webhook server listening on port ${PORT}`);
  console.log(`POST callback URL: http://localhost:${PORT}/tavus/webhook`);
});
