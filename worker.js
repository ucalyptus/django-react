export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Only proxy API paths
    if (path.startsWith('/items')) {
      const backend = 'http://localhost:8000';
      const target = backend + url.pathname + url.search;

      const headers = new Headers(request.headers);
      headers.set('Host', 'localhost');

      const resp = await fetch(target, {
        method: request.method,
        headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined,
      });

      const response = new Response(resp.body, resp);
      response.headers.set('Access-Control-Allow-Origin', '*');
      return response;
    }

    // Pass everything else through
    return fetch(request);
  }
}
