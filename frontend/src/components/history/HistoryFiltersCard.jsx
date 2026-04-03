function HistoryFiltersCard({ filter, setFilter, fetchTransactions }) {
    return (
        <div className="card admin-surface-card mb-6" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>
                🔍 Filter & Pencarian
            </h3>
            <div className="history-filters" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                        Metode Pembayaran
                    </label>
                    <select
                        className="form-input"
                        value={filter.payment_method}
                        onChange={(e) => setFilter({ ...filter, payment_method: e.target.value })}
                        style={{ width: '100%' }}
                    >
                        <option value="">Semua</option>
                        <option value="cash">Cash</option>
                        <option value="qris">QRIS</option>
                        <option value="debit">Debit</option>
                        <option value="credit">Credit</option>
                    </select>
                </div>
                <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                        Dari Tanggal
                    </label>
                    <input
                        type="date"
                        className="form-input"
                        value={filter.date_from}
                        onChange={(e) => setFilter({ ...filter, date_from: e.target.value })}
                        style={{ width: '100%' }}
                    />
                </div>
                <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                        Sampai Tanggal
                    </label>
                    <input
                        type="date"
                        className="form-input"
                        value={filter.date_to}
                        onChange={(e) => setFilter({ ...filter, date_to: e.target.value })}
                        style={{ width: '100%' }}
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
