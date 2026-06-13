# AGENTS.md

## Project

GSMS App | Laboratory Management System — an Angular 20 + Angular Material front end
for the GSMS REST API. See `README.md` for the full overview and scripts.

## Cursor Cloud specific instructions

### Services and how to run them

- **Run everything with `npm run dev`.** It uses `concurrently` to start two processes:
  - the API proxy `proxy/server.mjs` on port **4000**, and
  - the Angular dev server (`ng serve --proxy-config proxy.conf.json`) on port **4200**.
- Open the app at `http://localhost:4200`. Demo login: **`admin` / `admin`**.
- Standard scripts live in `package.json` (`build`, `test`, `proxy`, `serve:web`); there
  is no separate lint script configured by the Angular 20 schematic.

### Non-obvious caveats

- **The proxy is mandatory, not optional.** The upstream API
  (`https://api.gsms.app/api`) requires a JSON **request body even on `GET /users` and
  `GET /masters`**. Browsers cannot send a GET body, so the Angular app calls these list
  endpoints with query params and `proxy/server.mjs` rewrites them into the upstream
  GET-with-body call. If you run `ng serve` alone (without the proxy on :4000), login may
  work but **Users / Masters / Dashboard lists will fail**. Always use `npm run dev`.
- The proxy forwards everything else (`POST /users` login+upsert, `GET /users/:id`,
  `DELETE`, masters create/delete) verbatim to the upstream.
- **Mutations hit the real shared upstream API.** Creating/updating/deleting users or
  masters during testing persists on the live `api.gsms.app` server. Prefer creating a
  clearly-labeled test record (e.g. a master) when demonstrating writes.
- The upstream `GET /masters` filter is loose (some `tname` values return unrelated
  rows), so the Masters page filters results by `tname` client-side.
- `provideAnimations()` requires `@angular/animations`, which is an explicit dependency
  (the Material schematic does not always add it).

### Environment

- Node `>= 22.5.0`. Two Node binaries exist on the VM (`/exec-daemon/node` and the nvm
  Node); both are Node 22 and work for the proxy and Angular CLI.
