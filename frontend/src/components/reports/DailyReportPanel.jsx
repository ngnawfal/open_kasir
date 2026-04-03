function DailyReportPanel({ dailyReport, selectedDate, handleDateChange, formatRupiah }) {
    if (!dailyReport) return null

    const hourlyBars = Array.from({ length: 24 }).map((_, hour) => {
        const data = dailyReport.hourly_sales[hour]
        const maxSales = Math.max(...Object.values(dailyReport.hourly_sales).map(d => d?.total || 0), 1)
        const height = data ? (data.total / maxSales * 100) : 2
        return {
            hour,
            height,
            total: data ? data.total : 0,
        }
    })

    return (
        <div className="report-card">
            <div className="report-header">
                <h3>📅 Harian</h3>
                <input type="date" className="form-input date-input" value={selectedDate} onChange={handleDateChange} />
            </div>

            <div className="report-stats">
                <div className="report-stat">
                    <div className="report-stat-value success">{formatRupiah(dailyReport.summary.total_sales)}</div>
                    <div className="report-stat-label">Penjualan</div>
                </div>
                <div className="report-stat">
                    <div className="report-stat-value">{dailyReport.summary.total_transactions}</div>
                    <div className="report-stat-label">Transaksi</div>
                </div>
                <div className="report-stat">
                    <div className="report-stat-value">{dailyReport.summary.total_items_sold}</div>
                    <div className="report-stat-label">Item</div>
                </div>
                <div className="report-stat">
                    <div className="report-stat-value danger">{formatRupiah(dailyReport.summary.total_discount)}</div>
                    <div className="report-stat-label">Diskon</div>
                </div>
            </div>

            <h4 className="report-section-title">Metode Pembayaran</h4>
            <div className="payment-list">
                {Object.entries(dailyReport.payment_methods).map(([method, data]) => (
                    <div key={method} className="payment-item">
                        <span className="payment-icon">{method === 'cash' ? '💵' : method === 'qris' ? '📱' : '💳'}</span>
                        <span className="payment-name">{method.toUpperCase()}</span>
                        <span className="payment-count">{data.count}x</span>
                        <span className="payment-total">{formatRupiah(data.total)}</span>
                    </div>
                ))}
            </div>

            <h4 className="report-section-title">Penjualan per Jam</h4>
            <div className="hourly-chart-svg-wrap">
                <svg viewBox="0 0 240 60" className="hourly-chart-svg" preserveAspectRatio="none">
                    {hourlyBars.map(({ hour, height, total }) => {
                        const barHeight = Math.max((height / 100) * 54, 2)
                        const x = hour * 10 + 1
                        const y = 58 - barHeight
                        return (
                            <g key={hour}>
                                <title>{`${hour}:00 - ${formatRupiah(total)}`}</title>
                                <rect x={x} y={y} width="8" height={barHeight} rx="2" ry="2" className="hourly-bar-rect" />
                            </g>
                        )
                    })}
                </svg>
            </div>
            <div className="hourly-labels">
                <span>00</span>
                <span>06</span>
                <span>12</span>
                <span>18</span>
                <span>23</span>
            </div>
        </div>
    )
}

export default DailyReportPanel
