/**
 * GSMS dev/prod proxy (Backend-for-Frontend).
 *
 * The upstream GSMS API (https://api.gsms.app/api) requires a JSON *request body*
 * even on some GET endpoints (`GET /users`, `GET /masters`). Browsers (XHR/fetch)
 * cannot send a body with a GET request, so the Angular app talks to this proxy
 * instead. The proxy accepts browser-friendly query params for those list
 * endpoints and re-issues the request to the upstream API as a GET-with-body
 * (which Node's http stack supports). All other requests are forwarded as-is.
 */
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

const PORT = Number(process.env.PROXY_PORT || 4000);
const UPSTREAM = process.env.GSMS_API_BASE || 'https://api.gsms.app';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', () => resolve(Buffer.alloc(0)));
  });
}

/**
 * Decide how to call the upstream for a given incoming request.
 * Returns { method, body } where body is a Buffer or null.
 */
function planUpstream(req, pathname, query, incomingBody) {
  // List endpoints that require a GET-with-body upstream.
  if (req.method === 'GET' && pathname === '/api/users') {
    const payload = {
      uid: Number(query.get('uid') ?? 0),
      lid: query.get('lid') != null ? Number(query.get('lid')) : null,
      pn: Number(query.get('pn') ?? 1),
      ps: Number(query.get('ps') ?? 10),
    };
    return { method: 'GET', body: Buffer.from(JSON.stringify(payload)) };
  }

  if (req.method === 'GET' && pathname === '/api/masters') {
    const payload = { tname: query.get('tname') ?? '' };
    return { method: 'GET', body: Buffer.from(JSON.stringify(payload)) };
  }

  // Everything else: forward verbatim (POST login/insert, GET /users/:id, DELETE, etc.)
  return { method: req.method, body: incomingBody.length ? incomingBody : null };
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const incomingUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = incomingUrl.pathname;
  const query = incomingUrl.searchParams;
  const incomingBody = await readBody(req);

  const { method, body } = planUpstream(req, pathname, query, incomingBody);

  const upstreamUrl = new URL(pathname, UPSTREAM);
  const isHttps = upstreamUrl.protocol === 'https:';
  const client = isHttps ? https : http;

  const headers = { Accept: 'application/json' };
  if (body) {
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = Buffer.byteLength(body);
  }

  const upstreamReq = client.request(
    {
      hostname: upstreamUrl.hostname,
      port: upstreamUrl.port || (isHttps ? 443 : 80),
      path: upstreamUrl.pathname,
      method,
      headers,
    },
    (upstreamRes) => {
      const outHeaders = { ...CORS_HEADERS };
      const ct = upstreamRes.headers['content-type'];
      if (ct) outHeaders['Content-Type'] = ct;
      res.writeHead(upstreamRes.statusCode || 502, outHeaders);
      upstreamRes.pipe(res);
    }
  );

  upstreamReq.on('error', (err) => {
    res.writeHead(502, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Upstream request failed', detail: String(err) }));
  });

  if (body) upstreamReq.write(body);
  upstreamReq.end();
});

server.listen(PORT, () => {
  console.log(`GSMS proxy listening on http://localhost:${PORT} -> ${UPSTREAM}`);
});
