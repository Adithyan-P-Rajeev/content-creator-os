import { useEffect, useState } from 'react'
import { itemsApi } from '../api'

export default function useItems() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    itemsApi.getAll()
      .then(data => {
        if (!cancelled) setItems(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setError('Could not load data. Is the API running on port 3001?')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  async function createItem(payload) {
    const created = await itemsApi.create(payload)
    setItems(prev => [...prev, created])
    return created
  }

  async function updateItem(id, body) {
    const updated = await itemsApi.update(id, body)
    setItems(currentItems => currentItems.map(item => item.id === id ? updated : item))
    return updated
  }

  async function removeItem(id) {
    await itemsApi.remove(id)
    setItems(prev => prev.filter(item => item.id !== id))
  }

  function replaceItem(updatedItem) {
    setItems(currentItems => currentItems.map(item => item.id === updatedItem.id ? updatedItem : item))
  }

  return { items, loading, error, setError, createItem, updateItem, removeItem, replaceItem }
}
