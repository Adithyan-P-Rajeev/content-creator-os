const priorityWeight = { Urgent: 0, High: 1, Medium: 2, Low: 3 }

function dueWeight(item) {
  if (item.stage === 'Published' || !item.dueDate) return Number.MAX_SAFE_INTEGER
  return new Date(`${item.dueDate}T00:00:00`).getTime()
}

export function filterItems(items, filters, search, stage) {
  const query = search.trim().toLowerCase()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekEnd = new Date(today)
  weekEnd.setDate(today.getDate() + 6)

  return items.filter(item => {
    if (stage && item.stage !== stage) return false
    if (filters.priority && item.priority !== filters.priority) return false
    if (filters.platform && item.platform !== filters.platform) return false
    const dueDate = item.dueDate ? new Date(`${item.dueDate}T00:00:00`) : null
    if (filters.due === 'none' && dueDate) return false
    if (filters.due === 'overdue' && (!dueDate || dueDate >= today)) return false
    if (filters.due === 'week' && (!dueDate || dueDate < today || dueDate > weekEnd)) return false
    if (!query) return true
    return (item.title || '').toLowerCase().includes(query) || (item.research || '').toLowerCase().includes(query) || (item.tags || []).some(tag => tag.toLowerCase().includes(query))
  }).sort((first, second) => dueWeight(first) - dueWeight(second) || (priorityWeight[first.priority] ?? 2) - (priorityWeight[second.priority] ?? 2))
}

export function getOverdueItems(items) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return items.filter(item => item.stage !== 'Published' && item.dueDate && new Date(`${item.dueDate}T00:00:00`) < today)
}
