function ProductScannerModal({ showScanner, closeScanner, scannerStatus, videoRef, startScanner }) {
    if (!showScanner) return null

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <h2>📷 Scan Barcode</h2>
                    <button className="modal-close" onClick={closeScanner}>×</button>
                </div>
                <div className="modal-body">
                    <div style={{
                        background: '#000',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        <video
                            ref={videoRef}
                            style={{ width: '100%', height: 'auto', maxHeight: '250px', objectFit: 'cover' }}
                            playsInline
                            muted
                            autoPlay
                        />
                    </div>

                    {scannerStatus && (
                        <div style={{
                            textAlign: 'center',
                            padding: '8px',
                            color: scannerStatus.includes('❌') ? 'var(--danger)' : 'var(--success)',
                            fontSize: '0.85rem'
                        }}>
                            {scannerStatus}
                        </div>
                    )}

                    <div style={{ marginTop: '12px' }}>
                        <button className="btn btn-primary w-full" onClick={startScanner}>
                            ▶ Mulai Scan
                        </button>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={closeScanner}>
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProductScannerModal
