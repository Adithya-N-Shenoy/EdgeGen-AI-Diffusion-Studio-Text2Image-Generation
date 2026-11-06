import type { IncomingMessage, ServerResponse } from 'http';
import { handleApiRoute } from '../src/server/apiHandler';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    await handleApiRoute(req, res);
  } catch (err: any) {
    if (!res.headersSent) {
      res.writeHead(500, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(
        JSON.stringify({
          detail: 'Image generation is temporarily unavailable. Please try again later.',
          error: err.message || 'Internal server error',
        })
      );
    }
  }
}
