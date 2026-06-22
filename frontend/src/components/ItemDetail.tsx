import React, { useState, useEffect } from 'react'
import { Item, updateItem } from '../api'

interface Props {
  item: Item
  onUpdated: (item: Item) => void
  onClose: () => void
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-CA', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function badgeStyle(g: string): React.CSSProperties {
  return {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 99,
    fontSize: 11,
    fontWeight: 600,
    background: g === 'Primary' ? 'rgba(255,102,0,0.15)' : 'rgba(100,180,255,0.12)',
    color: g === 'Primary' ? '#ff6600' : '#64b4ff',
    border: `1px solid ${g === 'Primary' ? 'rgba(255,102,0,0.3)' : 'rgba(100,180,255,0.25)'}`,
  }
}

const s: Record<string, React.CSSProperties> = {
  panel: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 8,
    width: 320,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: '1px solid #2a2a2a',
    background: '#141414',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#ff6600',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#555',
    cursor: 'pointer',
    fontSize: 18,
    lineHeight: 1,
    padding: '0 2px',
    transition: 'color 0.1s',
  },
  body: { padding: '20px 16px', flex: 1 },
  row: { marginBottom: 16 },
  label: {
    fontSize: 11,
    color: '#555',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    marginBottom: 4,
  },
  value: { fontSize: 14, color: '#e8e8e8' },
  divider: { height: 1, background: '#222', margin: '20px 0' },
  editSection: { marginTop: 4 },
  editHeading: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    color: '#888',
    marginBottom: 12,
  },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 5, marginBottom: 10 },
  fieldLabel: { fontSize: 11, color: '#555', letterSpacing: '0.05em', textTransform: 'uppercase' as const },
  input: {
    background: '#0f0f0f',
    border: '1px solid #2e2e2e',
    borderRadius: 5,
    color: '#e8e8e8',
    fontSize: 13,
    padding: '7px 10px',
    outline: 'none',
    transition: 'border-color 0.15s',
    width: '100%',
  },
  select: {
    background: '#0f0f0f',
    border: '1px solid #2e2e2e',
    borderRadius: 5,
    color: '#e8e8e8',
    fontSize: 13,
    padding: '7px 10px',
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  actions: { display: 'flex', gap: 8, marginTop: 12 },
  saveBtn: {
    flex: 1,
    background: '#ff6600',
    border: 'none',
    borderRadius: 5,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    padding: '8px 0',
    transition: 'opacity 0.15s',
  },
  cancelBtn: {
    flex: 1,
    background: '#222',
    border: '1px solid #2e2e2e',
    borderRadius: 5,
    color: '#aaa',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    padding: '8px 0',
    transition: 'background 0.15s',
  },
  editToggleBtn: {
    width: '100%',
    background: '#222',
    border: '1px solid #2e2e2e',
    borderRadius: 5,
    color: '#ccc',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    padding: '8px 0',
    transition: 'background 0.15s',
    marginTop: 4,
    letterSpacing: '0.04em',
  },
  error: { color: '#ff4444', fontSize: 11, marginTop: 8 },
}

export default function ItemDetail({ item, onUpdated, onClose }: Props) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const [group, setGroup] = useState<'Primary' | 'Secondary'>(item.group)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when item changes
  useEffect(() => {
    setEditing(false)
    setName(item.name)
    setGroup(item.group)
    setError(null)
  }, [item.id, item.name, item.group])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    try {
      const updated = await updateItem(item.id, {
        name: trimmed !== item.name ? trimmed : undefined,
        group: group !== item.group ? group : undefined,
      })
      setEditing(false)
      onUpdated(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  function cancelEdit() {
    setEditing(false)
    setName(item.name)
    setGroup(item.group)
    setError(null)
  }

  return (
    <div style={s.panel}>
      <div style={s.header}>
        <span style={s.headerTitle}>Detail</span>
        <button
          style={s.closeBtn}
          onClick={onClose}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ff6600' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#555' }}
          title="Close"
        >
          ×
        </button>
      </div>

      <div style={s.body}>
        {/* Read-only view */}
        <div style={s.row}>
          <div style={s.label}>ID</div>
          <div style={{ ...s.value, color: '#555', fontFamily: 'monospace', fontSize: 12 }}>#{item.id}</div>
        </div>
        <div style={s.row}>
          <div style={s.label}>Name</div>
          <div style={{ ...s.value, fontWeight: 600 }}>{item.name}</div>
        </div>
        <div style={s.row}>
          <div style={s.label}>Group</div>
          <span style={badgeStyle(item.group)}>{item.group}</span>
        </div>
        <div style={s.row}>
          <div style={s.label}>Created</div>
          <div style={{ ...s.value, color: '#777', fontSize: 12 }}>{formatDateTime(item.created_at)}</div>
        </div>
        <div style={s.row}>
          <div style={s.label}>Updated</div>
          <div style={{ ...s.value, color: '#777', fontSize: 12 }}>{formatDateTime(item.updated_at)}</div>
        </div>

        <div style={s.divider} />

        {!editing ? (
          <button
            style={s.editToggleBtn}
            onClick={() => setEditing(true)}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#222' }}
          >
            Edit Item
          </button>
        ) : (
          <div style={s.editSection}>
            <div style={s.editHeading}>Edit Item</div>
            <form onSubmit={handleSave}>
              <div style={s.field}>
                <label style={s.fieldLabel}>Name</label>
                <input
                  style={s.input}
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  disabled={loading}
                  onFocus={e => { e.currentTarget.style.borderColor = '#ff6600' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#2e2e2e' }}
                />
              </div>
              <div style={s.field}>
                <label style={s.fieldLabel}>Group</label>
                <select
                  style={s.select}
                  value={group}
                  onChange={e => setGroup(e.target.value as 'Primary' | 'Secondary')}
                  disabled={loading}
                >
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                </select>
              </div>
              {error && <div style={s.error}>{error}</div>}
              <div style={s.actions}>
                <button
                  type="submit"
                  style={{ ...s.saveBtn, opacity: loading ? 0.6 : 1 }}
                  disabled={loading}
                >
                  {loading ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  style={s.cancelBtn}
                  onClick={cancelEdit}
                  disabled={loading}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#222' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
