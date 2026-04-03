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
            <div className="modal" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h2>🏷️ Kelola Barcode</h2>
                    <button className="modal-close" onClick={closeBarcodeModal}>×</button>
                </div>
                <div className="modal-body">
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: 'var(--bg-main)',
                        borderRadius: '8px',
                        marginBottom: '16px'
                    }}>
                        <span style={{ fontSize: '2rem' }}>{showBarcodeModal.emoji}</span>
                        <div>
                            <div style={{ fontWeight: '600' }}>{showBarcodeModal.name}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                {showBarcodeModal.category}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                            Daftar Barcode ({productBarcodes.length})
                        </div>
                        {productBarcodes.length === 0 ? (
                            <div style={{
                                color: 'var(--text-muted)',
                                textAlign: 'center',
                                padding: '16px',
                                background: 'var(--bg-main)',
                                borderRadius: '8px'
                            }}>
                                Belum ada barcode
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {productBarcodes.map((bc, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 12px',
                                        background: 'var(--bg-main)',
                                        borderRadius: '8px',
                                        border: bc.is_primary ? '2px solid var(--primary)' : '1px solid var(--border)'
                                    }}>
                                        <div>
                                            <div style={{ fontFamily: 'monospace', fontWeight: '500' }}>{bc.barcode}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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

                    <div style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px', flexWrap: 'wrap' }}>
                            <div style={{ fontWeight: '600' }}>➕ Tambah Barcode</div>
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
                            <div style={{ marginBottom: '12px' }}>
                                <video ref={scanVideoRef} style={{ width: '100%', maxHeight: '180px', borderRadius: '8px', background: '#000' }} playsInline muted autoPlay />
                                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--success)', marginTop: '8px' }}>
                                    📷 Scan kamera aktif ({scannedBarcodes.length} baru)
                                </div>
                            </div>
                        )}
                        {usbScanMode && (
                            <div style={{
                                marginBottom: '12px',
                                padding: '16px',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                borderRadius: '8px',
                                textAlign: 'center',
                                color: 'white'
                            }}>
                                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔌</div>
                                <div style={{ fontWeight: '600' }}>USB Scanner Aktif</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '4px' }}>
                                    Langsung scan barcode dengan scanner USB!
                                </div>
                                {scannedBarcodes.length > 0 && (
                                    <div style={{ marginTop: '8px', fontWeight: '600' }}>
                                        ✓ {scannedBarcodes.length} barcode ditambahkan
                                    </div>
                                )}
                            </div>
                        )}
                        {!batchScanMode && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
