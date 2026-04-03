function UsersSummaryCards({ users }) {
    return (
        <div className="dashboard-stats-grid mb-6">
            <div className="card admin-stat-card"><div className="admin-stat-value primary">{users.length}</div><div className="admin-stat-label">Total User</div></div>
            <div className="card admin-stat-card"><div className="admin-stat-value success">{users.filter(u => u.is_active).length}</div><div className="admin-stat-label">User Aktif</div></div>
            <div className="card admin-stat-card"><div className="admin-stat-value warning">{users.filter(u => u.role === 'admin').length}</div><div className="admin-stat-label">Admin</div></div>
            <div className="card admin-stat-card"><div className="admin-stat-value accent">{users.filter(u => u.role === 'kasir').length}</div><div className="admin-stat-label">Kasir</div></div>
        </div>
    )
}

export default UsersSummaryCards
