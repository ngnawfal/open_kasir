function ProductScannerModal({ showScanner, closeScanner, scannerStatus, videoRef, startScanner }) {
    if (!showScanner) return null

    return (
        <div className="modal-overlay">
            <div className="modal product-scanner-modal">
                <div className="modal-header">
                    <h2>📷 Scan Barcode</h2>
                    <button className="modal-close" onClick={closeScanner}>×</button>
                </div>
                <div className="modal-body">
                    <div className="product-scanner-frame">
                        <video
                            ref={videoRef}
                            className="product-scanner-video"
                            playsInline
                            muted
                            autoPlay
                        />
                    </div>

                    {scannerStatus && (
                        <div className={`product-scanner-status ${scannerStatus.includes('❌') ? 'error' : 'success'}`}>
                            {scannerStatus}
                        </div>
                    )}

                    <div className="product-scanner-actions">
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
