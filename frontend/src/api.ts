const API = ''

export interface Item {
  id: number
  name: string
  group: 'Primary' | 'Secondary'
  created_at: string
  updated_at: string
}

export interface CreateItemPayload {
  name: string
  group: 'Primary' | 'Secondary'
}

export interface UpdateItemPayload {
  name?: string
  group?: 'Primary' | 'Secondary'
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export async function fetchItems(): Promise<Item[]> {
  const res = await fetch(`${API}/items/`)
  return handleResponse<Item[]>(res)
}

export async function fetchItem(id: number): Promise<Item> {
  const res = await fetch(`${API}/items/${id}/`)
  return handleResponse<Item>(res)
}

export async function createItem(payload: CreateItemPayload): Promise<Item> {
  const res = await fetch(`${API}/items/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<Item>(res)
}

export async function updateItem(id: number, payload: UpdateItemPayload): Promise<Item> {
  const res = await fetch(`${API}/items/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<Item>(res)
}
