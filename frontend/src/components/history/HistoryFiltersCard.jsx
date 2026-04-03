function HistoryFiltersCard({ filter, setFilter, fetchTransactions }) {
    return (
        <div className="card admin-surface-card history-filters-card mb-6">
            <h3 className="history-filters-title">
                🔍 Filter & Pencarian
            </h3>
            <div className="history-filters history-filters-row">
                <div className="history-filter-field">
                    <label className="history-filter-label">
                        Metode Pembayaran
                    </label>
                    <select
                        className="form-input"
                        value={filter.payment_method}
                        onChange={(e) => setFilter({ ...filter, payment_method: e.target.value })}
                    >
                        <option value="">Semua</option>
                        <option value="cash">Cash</option>
                        <option value="qris">QRIS</option>
                        <option value="debit">Debit</option>
                        <option value="credit">Credit</option>
                    </select>
                </div>
                <div className="history-filter-field">
                    <label className="history-filter-label">
                        Dari Tanggal
                    </label>
                    <input
                        type="date"
                        className="form-input"
                        value={filter.date_from}
                        onChange={(e) => setFilter({ ...filter, date_from: e.target.value })}
                    />
                </div>
                <div className="history-filter-field">
                    <label className="history-filter-label">
                        Sampai Tanggal
                    </label>
                    <input
                        type="date"
                        className="form-input"
                        value={filter.date_to}
                        onChange={(e) => setFilter({ ...filter, date_to: e.target.value })}
                    />
                </div>
                <button className="btn btn-primary" onClick={fetchTransactions}>🔍 Filter</button>
                <button
                    className="btn btn-ghost"
                    onClick={() => {
                        setFilter({ payment_method: '', date_from: '', date_to: '' })
                        setTimeout(fetchTransactions, 100)
                    }}
                >
                    ✕ Reset
                </button>
            </div>
        </div>
    )
}

export default HistoryFiltersCard
