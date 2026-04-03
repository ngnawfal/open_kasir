function ProductBarcodePreviewModal({ barcodeImage, setBarcodeImage, handleDeleteImage, printBarcode, handleImageUpload, uploading, formatRupiah }) {
    if (!barcodeImage) return null

    return (
        <div className="modal-overlay" onClick={() => setBarcodeImage(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                <div className="modal-header">
                    <h2>📊 Barcode & Gambar</h2>
                    <button className="modal-close" onClick={() => setBarcodeImage(null)}>×</button>
                </div>
                <div className="modal-body" style={{ textAlign: 'center' }}>
                    {barcodeImage.product.image_url && (
                        <div style={{ marginBottom: '1rem' }}>
                            <img
                                src={barcodeImage.product.image_url}
                                alt={barcodeImage.product.name}
                                style={{ maxWidth: '180px', maxHeight: '180px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #e5e7eb' }}
                            />
                            <div style={{ marginTop: '8px' }}>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteImage(barcodeImage.product.id)}>
                                    🗑️ Hapus Gambar
                                </button>
                            </div>
                        </div>
                    )}

                    <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                        <img src={barcodeImage.imageUrl} alt={`Barcode for ${barcodeImage.product.name}`} style={{ maxWidth: '100%', height: 'auto' }} />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>{barcodeImage.product.emoji} {barcodeImage.product.name}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#4f46e5' }}>{formatRupiah(barcodeImage.product.price)}</div>
                        {barcodeImage.product.barcode && (
                            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '4px' }}>{barcodeImage.product.barcode}</div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                            📷 Upload Gambar
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(barcodeImage.product.id, e.target.files[0])} disabled={uploading} />
                        </label>
                        <button className="btn btn-success" onClick={printBarcode}>🖨️ Print</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductBarcodePreviewModal
