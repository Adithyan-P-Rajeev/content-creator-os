const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function dateKey(date) {
  return date.toISOString().slice(0, 10)
}

function monthName(date) {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export default function CalendarView({ items, month, onMonthChange, onSelectItem }) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const firstCell = new Date(month.getFullYear(), month.getMonth(), 1 - firstDay.getDay())
  const days = Array.from({ length: 42 }, (_, index) => new Date(firstCell.getFullYear(), firstCell.getMonth(), firstCell.getDate() + index))
  const dates = new Map()

  items.forEach(item => {
    const date = item.publishDate || item.dueDate
    if (!date) return
    const scheduledItems = dates.get(date) || []
    scheduledItems.push(item)
    dates.set(date, scheduledItems)
  })

  return (
    <section className="calendar-view" aria-label="Content calendar">
      <div className="calendar-head">
        <button type="button" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month">‹</button>
        <h2>{monthName(month)}</h2>
        <button type="button" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month">›</button>
      </div>
      <div className="calendar-grid">
        {weekdays.map(day => <div className="calendar-weekday" key={day}>{day}</div>)}
        {days.map(day => {
          const key = dateKey(day)
          const scheduledItems = dates.get(key) || []
          const isCurrentMonth = day.getMonth() === month.getMonth()
          return <div className={'calendar-day' + (isCurrentMonth ? '' : ' muted')} key={key}>
            <span>{day.getDate()}</span>
            {scheduledItems.map(item => <button type="button" className="calendar-item" key={item.id} onClick={() => onSelectItem(item)} title={item.title}>{item.title}</button>)}
          </div>
        })}
      </div>
    </section>
  )
}
