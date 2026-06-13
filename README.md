# GSMS App | Laboratory Management System

A responsive, mobile-friendly **Laboratory Management System** front end built with
**Angular 20** and **Angular Material**. It consumes the GSMS REST API
(`https://api.gsms.app/api`) for authentication, user management and master/lookup data.

## Features

- **Authentication** – username / password sign-in (`POST /users`).
- **Dashboard** – overview cards (user / role / gender counts).
- **Users** – list with pagination, add, edit and delete users.
- **Masters** – manage lookup data (roles, genders, locations): list, add, delete.
- **Responsive UI** – Angular Material with a collapsible sidenav for mobile devices.
- English-only content throughout.

## Architecture

```
Browser (Angular 20)  ──►  Local proxy (proxy/server.mjs)  ──►  https://api.gsms.app/api
```

The upstream GSMS API requires a JSON **request body on some GET endpoints**
(`GET /users`, `GET /masters`). Browsers cannot send a body with GET requests, so a
small Node proxy (`proxy/server.mjs`, Node built-ins only) sits in front of the API.
It accepts browser-friendly query parameters for those list endpoints and re-issues
the upstream call as a GET-with-body. All other calls are forwarded verbatim.

During development the Angular dev server proxies `/api` to this local proxy
(`proxy.conf.json`).

## Prerequisites

- Node.js `>= 22.5.0` (the proxy and dev server are tested on Node 22).

## Getting started

```bash
npm install        # install dependencies
npm run dev        # starts the API proxy (:4000) AND the Angular dev server (:4200)
```

Then open http://localhost:4200 and sign in with the demo credentials
**`admin` / `admin`**.

### Useful scripts

| Command           | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `npm run dev`     | Run the proxy + Angular dev server together (recommended) |
| `npm run proxy`   | Run only the API proxy (port 4000)                       |
| `npm run serve:web` | Run only `ng serve` with the proxy config              |
| `npm run build`   | Production build into `dist/`                            |
| `npm test`        | Unit tests (Karma/Jasmine, requires Chrome)              |

## Configuration

- `proxy/server.mjs` reads `GSMS_API_BASE` (default `https://api.gsms.app`) and
  `PROXY_PORT` (default `4000`).
- `src/environments/environment.ts` sets `apiBaseUrl` (default `/api`, served via proxy).
