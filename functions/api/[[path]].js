export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Proxy /items/* API calls to the backend via tunnel domain
    if (url.pathname.startsWith('/items')) {
      const backend = 'https://mychoice.ucalyptus.me';
      const target = backend + url.pathname + url.search;
      
      const resp = await fetch(target, {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' 
          ? await request.text() 
          : undefined,
      });

      const response = new Response(resp.body, resp);
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      return response;
    }

    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    // Pass everything else through to Pages static files
    return env.ASSETS.fetch(request);
  }
}
