function CustomersSummaryCards({ customers, totalDebt }) {
    return (
        <div className="dashboard-stats-grid mb-6">
            <div className="card admin-stat-card">
                <div className="admin-stat-value primary">{customers.length}</div>
                <div className="admin-stat-label">Total Pelanggan</div>
            </div>
            <div className="card admin-stat-card">
                <div className="admin-stat-value danger">Rp {totalDebt.toLocaleString()}</div>
                <div className="admin-stat-label">Total Hutang</div>
            </div>
            <div className="card admin-stat-card">
                <div className="admin-stat-value warning">{customers.filter(c => c.member_level === 'Gold').length}</div>
                <div className="admin-stat-label">Member Gold</div>
            </div>
        </div>
    )
}

export default CustomersSummaryCards
