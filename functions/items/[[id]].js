// functions/api/items/[[id]].js
// Full Django-equivalent API for MyChoice on Cloudflare Pages + D1
//
// TRAPS PRESERVED:
//   - PATCH (not PUT) for partial updates
//   - Unique per group (DB-level UNIQUE constraint)
//   - GET /items/:id with 404
//   - Timestamps managed server-side (client values ignored)
//   - At least 2 groups (Primary, Secondary)
//   - No DELETE endpoint
//   - Proper HTTP codes: 201, 200, 400, 404

const GROUPS = ['Primary', 'Secondary'];

// ── JSON helpers ──────────────────────────────────────────────
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// ── Request handler ───────────────────────────────────────────
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  // Preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Parse the dynamic [[id]] segment
  // Pages puts matched segments on context.params
  const id = context.params.id ? parseInt(context.params.id, 10) : null;

  // ── Route dispatch ──────────────────────────────────────

  // GET /items/       — list all
  // GET /items/:id    — get single
  if (method === 'GET') {
    if (id) {
      return getItem(env, id);
    }
    return listItems(env);
  }

  // POST /items/      — create
  if (method === 'POST') {
    return createItem(env, request);
  }

  // PATCH /items/:id  — partial update
  if (method === 'PATCH') {
    if (!id) {
      return json({ detail: 'Item ID is required for PATCH.' }, 400);
    }
    return patchItem(env, request, id);
  }

  // DELETE — not allowed (trap!)
  return json({ detail: 'Method not allowed.' }, 405);
}

// ── GET /items/ — list all ────────────────────────────────────
async function listItems(env) {
  const { results } = await env.DB.prepare(
    'SELECT id, name, item_group as "group", created_at, updated_at FROM items ORDER BY id'
  ).all();
  return json(results);
}

// ── GET /items/:id — single item ──────────────────────────────
async function getItem(env, id) {
  const item = await env.DB.prepare(
    'SELECT id, name, item_group as "group", created_at, updated_at FROM items WHERE id = ?'
  ).bind(id).first();

  if (!item) {
    return json({ detail: 'Item not found.' }, 404);
  }
  return json(item);
}

// ── POST /items/ — create ─────────────────────────────────────
async function createItem(env, request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ detail: 'Invalid JSON.' }, 400);
  }

  const name = (body.name || '').trim();
  const group = (body.group || body.item_group || 'Primary').trim();

  // Validate name
  if (!name) {
    return json({ name: ['This field is required.'] }, 400);
  }

  // Validate group
  if (!GROUPS.includes(group)) {
    return json({ group: [`"${group}" is not a valid choice.`] }, 400);
  }

  // Insert — UNIQUE constraint will reject duplicate name+group
  try {
    const now = new Date().toISOString();
    const result = await env.DB.prepare(
      'INSERT INTO items (name, item_group, created_at, updated_at) VALUES (?, ?, ?, ?)'
    ).bind(name, group, now, now).run();

    // Fetch the created item
    const item = await env.DB.prepare(
      'SELECT id, name, item_group as "group", created_at, updated_at FROM items WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    return json(item, 201);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return json(
        { detail: `An item with name '${name}' already exists in group '${group}'.` },
        400
      );
    }
    return json({ detail: 'Internal server error.' }, 500);
  }
}

// ── PATCH /items/:id — partial update ─────────────────────────
async function patchItem(env, request, id) {
  // Check item exists
  const existing = await env.DB.prepare(
    'SELECT id, name, item_group FROM items WHERE id = ?'
  ).bind(id).first();

  if (!existing) {
    return json({ detail: 'Item not found.' }, 404);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ detail: 'Invalid JSON.' }, 400);
  }

  // Partial update — only change fields that are present
  const newName = body.name !== undefined ? body.name.trim() : existing.name;
  const newGroup = (body.group !== undefined ? body.group : body.item_group !== undefined ? body.item_group : existing.item_group);

  if (!newName) {
    return json({ name: ['This field may not be blank.'] }, 400);
  }
  if (!GROUPS.includes(newGroup)) {
    return json({ group: [`"${newGroup}" is not a valid choice.`] }, 400);
  }

  try {
    const now = new Date().toISOString();
    await env.DB.prepare(
      'UPDATE items SET name = ?, item_group = ?, updated_at = ? WHERE id = ?'
    ).bind(newName, newGroup, now, id).run();

    const updated = await env.DB.prepare(
      'SELECT id, name, item_group as "group", created_at, updated_at FROM items WHERE id = ?'
    ).bind(id).first();

    return json(updated);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return json(
        { detail: `An item with name '${newName}' already exists in group '${newGroup}'.` },
        400
      );
    }
    return json({ detail: 'Internal server error.' }, 500);
  }
}
