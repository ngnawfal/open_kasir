function ReportsExportPanel({ exportExcel }) {
    return (
        <div className="card admin-surface-card export-panel mb-6">
            <div className="export-panel-copy">
                <h3 className="export-panel-title">📊 Export Laporan Excel</h3>
                <p className="export-panel-subtitle">Laporan profesional dengan grafik, analitik, dan formatting otomatis</p>
            </div>
            <div className="export-panel-actions">
                <button
                    className="export-button finance"
                    onClick={() => exportExcel('/api/export/excel/transactions', `laporan_keuangan_${new Date().toISOString().split('T')[0]}.xlsx`)}
                >
                    💼 Laporan Keuangan
                </button>
                <button
                    className="export-button inventory"
                    onClick={() => exportExcel('/api/export/excel/products', `inventori_lengkap_${new Date().toISOString().split('T')[0]}.xlsx`)}
                >
                    📦 Laporan Inventori
                </button>
            </div>
        </div>
    )
}

export default ReportsExportPanel
