function ReportsSummaryOverview({ summary, formatRupiah }) {
    if (!summary) return null

    return (
        <div className="dashboard-stats-grid reports-summary mb-6">
            <div className="card admin-stat-card">
                <div className="admin-stat-label">Hari Ini</div>
                <div className="admin-stat-value success">{formatRupiah(summary.today.sales)}</div>
                <div className="admin-stat-sub">{summary.today.transactions} transaksi</div>
            </div>
            <div className="card admin-stat-card">
                <div className="admin-stat-label">Bulan Ini</div>
                <div className="admin-stat-value primary">{formatRupiah(summary.this_month.sales)}</div>
                <div className="admin-stat-sub">{summary.this_month.transactions} transaksi</div>
            </div>
            <div className="card admin-stat-card">
                <div className="admin-stat-label">Produk</div>
                <div className="admin-stat-value accent">{summary.products.total}</div>
                <div className="admin-stat-sub">{summary.products.low_stock} stok rendah</div>
            </div>
            <div className="card admin-stat-card">
                <div className="admin-stat-label">Promo Aktif</div>
                <div className="admin-stat-value warning">{summary.discounts.active}</div>
                <div className="admin-stat-sub">diskon</div>
            </div>
        </div>
    )
}

export default ReportsSummaryOverview
