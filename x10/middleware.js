// Vercel Routing Middleware: the Cerebro deck is presenter-only. Every request
// under /cerebro/presentacion/ (the single-file deck and its media) needs the
// cookie that src/gate/gate.js sets after the right key (DECK_PASSWORD), signed
// with DECK_COOKIE_SECRET.
// Runs before the CDN cache, so cached assets are gated too.
import { next } from '@vercel/functions';
import { gateResponse } from './src/gate/gate.js';

export const config = { matcher: ['/cerebro/presentacion/:path*'] };

export default async function middleware(request) {
  const res = await gateResponse(request, process.env.DECK_PASSWORD, process.env.DECK_COOKIE_SECRET);
  return res ?? next();
}
