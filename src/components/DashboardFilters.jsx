export default function DashboardFilters({ filters, onChange, onClear }) {
  return (
    <div className="dashboard-filters">
      <select value={filters.priority} onChange={event => onChange('priority', event.target.value)} aria-label="Filter by priority">
        <option value="">All priorities</option>
        <option value="Urgent">Urgent</option>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>
      <select value={filters.platform} onChange={event => onChange('platform', event.target.value)} aria-label="Filter by platform">
        <option value="">All platforms</option>
        {filters.platforms.map(platform => <option key={platform} value={platform}>{platform}</option>)}
      </select>
      <select value={filters.due} onChange={event => onChange('due', event.target.value)} aria-label="Filter by due date">
        <option value="">Any due date</option>
        <option value="overdue">Overdue</option>
        <option value="week">Due this week</option>
        <option value="none">No due date</option>
      </select>
      <button type="button" className="filter-clear" onClick={onClear}>Clear filters</button>
    </div>
  )
}
