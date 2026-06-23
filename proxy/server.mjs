/**
 * GSMS dev/prod proxy (Backend-for-Frontend).
 *
 * The upstream GSMS API (https://api.gsms.app/api) requires a JSON *request body*
 * even on some GET endpoints. Browsers cannot send a body with a GET request, so the
 * Angular app talks to this proxy instead.
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

function numOrNull(query, key) {
  return query.get(key) != null ? Number(query.get(key)) : null;
}

function strOrEmpty(query, key) {
  return query.get(key) ?? '';
}

function toUsDate(d) {
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function toIsoDate(d) {
  return d.toISOString().slice(0, 10);
}

/** GSMS list endpoints reject empty fdt/tdt; apply documented defaults when missing. */
function listDateFilters(query, apiPath) {
  const end = new Date();
  const start = new Date();
  start.setFullYear(end.getFullYear() - 5);
  const iso = apiPath === 'samples' || apiPath === 'results';
  const defaults = iso
    ? { fdt: toIsoDate(start), tdt: toIsoDate(end) }
    : { fdt: toUsDate(start), tdt: toUsDate(end) };
  const fdt = query.get('fdt');
  const tdt = query.get('tdt');
  return {
    fdt: fdt && fdt !== '' ? fdt : defaults.fdt,
    tdt: tdt && tdt !== '' ? tdt : defaults.tdt,
  };
}

function paginated(query) {
  return {
    pn: Number(query.get('pn') ?? 1),
    ps: Number(query.get('ps') ?? 10),
    lid: numOrNull(query, 'lid'),
  };
}

function planUpstream(req, pathname, query, incomingBody) {
  if (req.method === 'GET' && pathname === '/api/users') {
    const payload = { uid: Number(query.get('uid') ?? 0), ...paginated(query) };
    return { method: 'GET', body: Buffer.from(JSON.stringify(payload)) };
  }

  if (req.method === 'GET' && pathname === '/api/masters') {
    const payload = { tname: query.get('tname') ?? '' };
    return { method: 'GET', body: Buffer.from(JSON.stringify(payload)) };
  }

  if (req.method === 'GET' && pathname === '/api/patients') {
    const payload = {
      pid: Number(query.get('pid') ?? 0),
      ...listDateFilters(query, 'patients'),
      pname: strOrEmpty(query, 'pname'),
      mob: strOrEmpty(query, 'mob'),
      ...paginated(query),
    };
    return { method: 'GET', body: Buffer.from(JSON.stringify(payload)) };
  }

  if (req.method === 'GET' && pathname === '/api/visits') {
    const payload = {
      vid: Number(query.get('vid') ?? 0),
      ...listDateFilters(query, 'visits'),
      ...paginated(query),
    };
    return { method: 'GET', body: Buffer.from(JSON.stringify(payload)) };
  }

  if (req.method === 'GET' && pathname === '/api/orders') {
    const payload = {
      id: Number(query.get('id') ?? 0),
      ...listDateFilters(query, 'orders'),
      ...paginated(query),
    };
    return { method: 'GET', body: Buffer.from(JSON.stringify(payload)) };
  }

  if (req.method === 'GET' && pathname === '/api/bills') {
    const payload = {
      bid: Number(query.get('bid') ?? 0),
      pcd: strOrEmpty(query, 'pcd'),
      pname: strOrEmpty(query, 'pname'),
      mb: strOrEmpty(query, 'mb'),
      ...listDateFilters(query, 'bills'),
      ...paginated(query),
    };
    return { method: 'GET', body: Buffer.from(JSON.stringify(payload)) };
  }

  if (req.method === 'GET' && pathname === '/api/samples') {
    const payload = {
      sid: Number(query.get('sid') ?? 0),
      sno: strOrEmpty(query, 'sno'),
      pcd: strOrEmpty(query, 'pcd'),
      pname: strOrEmpty(query, 'pname'),
      mb: strOrEmpty(query, 'mb'),
      ...listDateFilters(query, 'samples'),
      ...paginated(query),
    };
    return { method: 'GET', body: Buffer.from(JSON.stringify(payload)) };
  }

  if (req.method === 'GET' && pathname === '/api/results') {
    const payload = {
      rid: Number(query.get('rid') ?? 0),
      sno: strOrEmpty(query, 'sno'),
      pcd: strOrEmpty(query, 'pcd'),
      pname: strOrEmpty(query, 'pname'),
      mb: strOrEmpty(query, 'mb'),
      ...listDateFilters(query, 'results'),
      ...paginated(query),
    };
    return { method: 'GET', body: Buffer.from(JSON.stringify(payload)) };
  }

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
