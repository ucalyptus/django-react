import React, { useState, useEffect, useCallback } from 'react'
import { Item, fetchItems } from './api'
import CreateItem from './components/CreateItem'
import ItemList from './components/ItemList'
import ItemDetail from './components/ItemDetail'

const appStyles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: '#0f0f0f',
    display: 'flex',
    flexDirection: 'column',
  },
  topbar: {
    background: '#141414',
    borderBottom: '1px solid #1f1f1f',
    padding: '0 24px',
    height: 52,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  logo: {
    fontSize: 15,
    fontWeight: 700,
    color: '#ff6600',
    letterSpacing: '0.03em',
  },
  logoSub: {
    fontSize: 12,
    color: '#444',
    marginLeft: 4,
  },
  main: {
    flex: 1,
    maxWidth: 1100,
    margin: '0 auto',
    width: '100%',
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
  },
  contentRow: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
    flex: 1,
  },
}

export default function App() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchItems()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  function handleCreated() {
    loadItems()
  }

  function handleSelectItem(item: Item) {
    setSelectedItem(prev => prev?.id === item.id ? null : item)
  }

  function handleUpdated(updated: Item) {
    setItems(prev => prev.map(i => (i.id === updated.id ? updated : i)))
    setSelectedItem(updated)
  }

  function handleClose() {
    setSelectedItem(null)
  }

  return (
    <div style={appStyles.root}>
      <header style={appStyles.topbar}>
        <span style={appStyles.logo}>MyChoice</span>
        <span style={appStyles.logoSub}>/ Items</span>
      </header>

      <main style={appStyles.main}>
        <CreateItem onCreated={handleCreated} />

        <div style={appStyles.contentRow}>
          <ItemList
            items={items}
            loading={loading}
            error={error}
            selectedId={selectedItem?.id ?? null}
            onSelect={handleSelectItem}
          />

          {selectedItem && (
            <ItemDetail
              item={selectedItem}
              onUpdated={handleUpdated}
              onClose={handleClose}
            />
          )}
        </div>
      </main>
    </div>
  )
}
