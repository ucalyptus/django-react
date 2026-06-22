import React, { useState } from 'react'
import { createItem, CreateItemPayload } from '../api'

interface Props {
  onCreated: () => void
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 8,
    padding: '20px 24px',
    marginBottom: 24,
  },
  heading: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#ff6600',
    marginBottom: 14,
  },
  row: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-end',
    flexWrap: 'wrap' as const,
  },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 5 },
  label: { fontSize: 11, color: '#888', letterSpacing: '0.05em', textTransform: 'uppercase' as const },
  input: {
    background: '#0f0f0f',
    border: '1px solid #2e2e2e',
    borderRadius: 5,
    color: '#e8e8e8',
    fontSize: 14,
    padding: '8px 12px',
    outline: 'none',
    transition: 'border-color 0.15s',
    minWidth: 220,
  },
  select: {
    background: '#0f0f0f',
    border: '1px solid #2e2e2e',
    borderRadius: 5,
    color: '#e8e8e8',
    fontSize: 14,
    padding: '8px 12px',
    outline: 'none',
    cursor: 'pointer',
    minWidth: 140,
  },
  btn: {
    background: '#ff6600',
    border: 'none',
    borderRadius: 5,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    padding: '9px 20px',
    transition: 'opacity 0.15s',
    whiteSpace: 'nowrap' as const,
  },
  error: { color: '#ff4444', fontSize: 12, marginTop: 8 },
}

export default function CreateItem({ onCreated }: Props) {
  const [name, setName] = useState('')
  const [group, setGroup] = useState<'Primary' | 'Secondary'>('Primary')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    try {
      const payload: CreateItemPayload = { name: trimmed, group }
      await createItem(payload)
      setName('')
      setGroup('Primary')
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.card}>
      <div style={styles.heading}>New Item</div>
      <form onSubmit={handleSubmit}>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Name</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Item name…"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={loading}
              onFocus={e => { e.currentTarget.style.borderColor = '#ff6600' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#2e2e2e' }}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Group</label>
            <select
              style={styles.select}
              value={group}
              onChange={e => setGroup(e.target.value as 'Primary' | 'Secondary')}
              disabled={loading}
            >
              <option value="Primary">Primary</option>
              <option value="Secondary">Secondary</option>
            </select>
          </div>
          <button
            type="submit"
            style={{ ...styles.btn, opacity: loading ? 0.6 : 1 }}
            disabled={loading}
          >
            {loading ? 'Creating…' : 'Create'}
          </button>
        </div>
        {error && <div style={styles.error}>{error}</div>}
      </form>
    </div>
  )
}
