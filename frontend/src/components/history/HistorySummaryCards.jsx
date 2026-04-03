function HistorySummaryCards({ totalTransactions, totalRevenue, avgTransaction, formatRupiah }) {
    return (
        <div className="dashboard-stats-grid mb-6">
            <div className="card admin-stat-card">
                <div className="admin-stat-label">Total Transaksi</div>
                <div className="admin-stat-value primary">{totalTransactions}</div>
                <div className="admin-stat-sub">transaksi tercatat</div>
            </div>
            <div className="card admin-stat-card">
                <div className="admin-stat-label">Total Pendapatan</div>
                <div className="admin-stat-value success">{formatRupiah(totalRevenue)}</div>
                <div className="admin-stat-sub">akumulasi penjualan</div>
            </div>
            <div className="card admin-stat-card">
                <div className="admin-stat-label">Rata-rata</div>
                <div className="admin-stat-value warning">{formatRupiah(avgTransaction)}</div>
                <div className="admin-stat-sub">per transaksi</div>
            </div>
        </div>
    )
}

export default HistorySummaryCards
