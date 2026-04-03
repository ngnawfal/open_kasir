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

            <div className="card admin-surface-card customers-toolbar-card mb-6">
                <div className="customers-toolbar-row">
                    <div className="customers-search-field">
                        <input
                            type="text"
                            placeholder="🔍 Cari nama atau telepon..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="form-input"
                        />
                    </div>
                    <label className="customers-checkbox-row">
                        <input
                            type="checkbox"
                            checked={showDebtOnly}
                            onChange={(e) => setShowDebtOnly(e.target.checked)}
                            className="customers-checkbox-input"
                        />
                        <span className="customers-checkbox-label">Hanya yang Punya Hutang</span>
                    </label>
                </div>
            </div>
        </>
    )
}

export default CustomersToolbar
