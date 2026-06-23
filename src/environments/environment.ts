export const environment = {
  production: false,
  /**
   * Base path for the GSMS API. Requests go through the local proxy
   * (see `proxy/server.mjs` + `proxy.conf.json`), which forwards to the
   * upstream GSMS API and adapts the GET-with-body list endpoints.
   */
  apiBaseUrl: '/api',
};
