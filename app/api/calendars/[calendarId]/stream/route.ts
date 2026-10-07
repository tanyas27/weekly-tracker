export const dynamic = 'force-dynamic';

/**
 * DEPRECATED: Replaced by Ably WebSocket realtime pub/sub.
 * Returns an immediate 204 No Content response to instantly terminate any legacy
 * EventSource listeners and eliminate billable Vercel serverless runtime.
 */
export async function GET() {
  return new Response(null, {
    status: 204,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Realtime-Mode': 'ably',
    },
  });
}
