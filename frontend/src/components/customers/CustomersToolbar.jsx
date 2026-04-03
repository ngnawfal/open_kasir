function CustomersToolbar({ setShowForm, searchQuery, setSearchQuery, showDebtOnly, setShowDebtOnly }) {
    return (
        <>
            <div className="admin-toolbar">
                <div>
                    <h1 className="page-title">Pelanggan</h1>
                    <p className="page-subtitle">Kelola data pelanggan dan hutang</p>
                </div>
                <button className="admin-toolbar-action" onClick={() => setShowForm(true)}>
                    ➕ Tambah Pelanggan
                </button>
            </div>

            <div className="card admin-surface-card mb-6" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <input
                            type="text"
                            placeholder="🔍 Cari nama atau telepon..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="form-input"
                            style={{ width: '100%' }}
                        />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <input
                            type="checkbox"
                            checked={showDebtOnly}
                            onChange={(e) => setShowDebtOnly(e.target.checked)}
                            style={{ width: '18px', height: '18px' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>Hanya yang Punya Hutang</span>
                    </label>
                </div>
            </div>
        </>
    )
}

export default CustomersToolbar
