export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
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
