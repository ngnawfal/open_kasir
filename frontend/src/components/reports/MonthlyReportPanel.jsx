function MonthlyReportPanel({ monthlyReport, formatRupiah }) {
    if (!monthlyReport) return null

    return (
        <div className="report-card">
            <h3 className="report-title">📆 {monthlyReport.month}/{monthlyReport.year}</h3>

            <div className="report-stats three-cols">
                <div className="report-stat">
                    <div className="report-stat-value success">{formatRupiah(monthlyReport.summary.total_sales)}</div>
                    <div className="report-stat-label">Total Penjualan</div>
                </div>
                <div className="report-stat">
                    <div className="report-stat-value">{monthlyReport.summary.total_transactions}</div>
                    <div className="report-stat-label">Transaksi</div>
                </div>
                <div className="report-stat">
                    <div className="report-stat-value primary">{formatRupiah(monthlyReport.summary.average_daily)}</div>
                    <div className="report-stat-label">Rata-rata/Hari</div>
                </div>
            </div>

            <h4 className="report-section-title">Metode Pembayaran</h4>
            <div className="payment-list">
                {Object.entries(monthlyReport.payment_methods).map(([method, data]) => (
                    <div key={method} className="payment-item">
                        <span className="payment-icon">{method === 'cash' ? '💵' : method === 'qris' ? '📱' : '💳'}</span>
                        <span className="payment-name">{method.toUpperCase()}</span>
                        <span className="payment-count">{data.count}x</span>
                        <span className="payment-total">{formatRupiah(data.total)}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default MonthlyReportPanel
