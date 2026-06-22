import React from 'react'
import { Item } from '../api'

interface Props {
  items: Item[]
  loading: boolean
  error: string | null
  selectedId: number | null
  onSelect: (item: Item) => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'short', day: 'numeric',
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

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
  },
  tableWrap: { overflowX: 'auto' as const },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: {
    padding: '10px 16px',
    textAlign: 'left' as const,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    color: '#666',
    borderBottom: '1px solid #2a2a2a',
    background: '#141414',
  },
  td: {
    padding: '11px 16px',
    fontSize: 13,
    color: '#e8e8e8',
    borderBottom: '1px solid #1f1f1f',
  },
  empty: {
    padding: '48px 16px',
    textAlign: 'center' as const,
    color: '#444',
    fontSize: 13,
  },
  statusBar: {
    padding: '12px 16px',
    textAlign: 'center' as const,
    color: '#555',
    fontSize: 13,
    borderBottom: '1px solid #2a2a2a',
  },
  heading: {
    padding: '14px 16px',
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#ff6600',
    borderBottom: '1px solid #2a2a2a',
    background: '#141414',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  count: {
    fontSize: 11,
    color: '#555',
    fontWeight: 400,
    letterSpacing: 0,
    textTransform: 'none' as const,
  },
}

export default function ItemList({ items, loading, error, selectedId, onSelect }: Props) {
  return (
    <div style={styles.card}>
      <div style={styles.heading}>
        <span>Items</span>
        {!loading && !error && (
          <span style={styles.count}>{items.length} record{items.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {loading && <div style={styles.statusBar}>Loading…</div>}
      {error && <div style={{ ...styles.statusBar, color: '#ff4444' }}>{error}</div>}

      {!loading && !error && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Group</th>
                <th style={styles.th}>Created</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={3} style={styles.empty}>No items yet — create one above.</td>
                </tr>
              )}
              {items.map(item => {
                const isSelected = item.id === selectedId
                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelect(item)}
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(255,102,0,0.07)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = '#1f1f1f'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLTableRowElement).style.background =
                        isSelected ? 'rgba(255,102,0,0.07)' : 'transparent'
                    }}
                  >
                    <td style={{ ...styles.td, fontWeight: isSelected ? 600 : 400, color: isSelected ? '#ff6600' : '#e8e8e8' }}>
                      {item.name}
                    </td>
                    <td style={styles.td}>
                      <span style={badgeStyle(item.group)}>{item.group}</span>
                    </td>
                    <td style={{ ...styles.td, color: '#777' }}>{formatDate(item.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
