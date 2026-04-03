function ProductBarcodeManagerModal({
    showBarcodeModal,
    closeBarcodeModal,
    productBarcodes,
    deleteBarcodeAlias,
    batchScanMode,
    setBatchScanMode,
    usbScanMode,
    setUsbScanMode,
    scanBarcodeReaderRef,
    scanVideoRef,
    scannedBarcodes,
    addBarcodeFromScan,
    newBarcodeInput,
    setNewBarcodeInput,
    addBarcodeAlias,
    usbBufferRef,
    startBatchScanner,
}) {
    if (!showBarcodeModal) return null

    return (
        <div className="modal-overlay">
            <div className="modal barcode-manager-modal">
                <div className="modal-header">
                    <h2>🏷️ Kelola Barcode</h2>
                    <button className="modal-close" onClick={closeBarcodeModal}>×</button>
                </div>
                <div className="modal-body">
                    <div className="barcode-manager-product-card">
                        <span className="barcode-manager-product-emoji">{showBarcodeModal.emoji}</span>
                        <div>
                            <div className="barcode-manager-product-name">{showBarcodeModal.name}</div>
                            <div className="barcode-manager-product-meta">
                                {showBarcodeModal.category}
                            </div>
                        </div>
                    </div>

                    <div className="barcode-manager-section">
                        <div className="barcode-manager-section-title">
                            Daftar Barcode ({productBarcodes.length})
                        </div>
                        {productBarcodes.length === 0 ? (
                            <div className="barcode-manager-empty">
                                Belum ada barcode
                            </div>
                        ) : (
                            <div className="barcode-manager-list">
                                {productBarcodes.map((bc, idx) => (
                                    <div key={idx} className={`barcode-manager-item ${bc.is_primary ? 'primary' : ''}`}>
                                        <div>
                                            <div className="barcode-manager-code">{bc.barcode}</div>
                                            <div className="barcode-manager-code-note">
                                                {bc.is_primary ? '⭐ Barcode Utama' : bc.description}
                                            </div>
                                        </div>
                                        {!bc.is_primary && (
                                            <button className="btn btn-danger btn-sm" onClick={() => deleteBarcodeAlias(bc.id)}>
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="barcode-manager-create-panel">
                        <div className="barcode-manager-create-header">
                            <div className="barcode-manager-section-title">➕ Tambah Barcode</div>
                            <button
                                className={`btn btn-sm ${batchScanMode ? 'btn-danger' : 'btn-primary'}`}
                                onClick={async () => {
                                    if (batchScanMode) {
                                        setBatchScanMode(false)
                                        if (scanBarcodeReaderRef.current) {
                                            scanBarcodeReaderRef.current.reset()
                                        }
                                    } else {
                                        setBatchScanMode(true)
                                        startBatchScanner()
                                    }
                                }}
                            >
                                {batchScanMode ? '⏹ Stop' : '📷 Kamera'}
                            </button>
                            <button
                                className={`btn btn-sm ${usbScanMode ? 'btn-danger' : 'btn-success'}`}
                                onClick={() => {
                                    if (usbScanMode) {
                                        setUsbScanMode(false)
                                    } else {
                                        setBatchScanMode(false)
                                        if (scanBarcodeReaderRef.current) scanBarcodeReaderRef.current.reset()
                                        setUsbScanMode(true)
                                        usbBufferRef.current = ''
                                    }
                                }}
                            >
                                {usbScanMode ? '⏹ Stop' : '🔌 USB'}
                            </button>
                        </div>
                        {batchScanMode && (
                            <div className="barcode-manager-camera-wrap">
                                <video ref={scanVideoRef} className="barcode-manager-camera" playsInline muted autoPlay />
                                <div className="barcode-manager-camera-status">
                                    📷 Scan kamera aktif ({scannedBarcodes.length} baru)
                                </div>
                            </div>
                        )}
                        {usbScanMode && (
                            <div className="barcode-manager-usb-state">
                                <div className="barcode-manager-usb-icon">🔌</div>
                                <div className="barcode-manager-usb-title">USB Scanner Aktif</div>
                                <div className="barcode-manager-usb-copy">
                                    Langsung scan barcode dengan scanner USB!
                                </div>
                                {scannedBarcodes.length > 0 && (
                                    <div className="barcode-manager-usb-count">
                                        ✓ {scannedBarcodes.length} barcode ditambahkan
                                    </div>
                                )}
                            </div>
                        )}
                        {!batchScanMode && (
                            <div className="barcode-manager-manual-form">
                                <input type="text" className="form-input" value={newBarcodeInput} onChange={(e) => setNewBarcodeInput(e.target.value)} placeholder="Atau ketik barcode manual..." />
                                <button className="btn btn-success w-full" onClick={addBarcodeAlias} disabled={!newBarcodeInput.trim()}>➕ Tambah</button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={closeBarcodeModal}>
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProductBarcodeManagerModal
