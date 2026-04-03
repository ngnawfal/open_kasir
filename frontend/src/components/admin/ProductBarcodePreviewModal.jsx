function ProductBarcodePreviewModal({ barcodeImage, setBarcodeImage, handleDeleteImage, printBarcode, handleImageUpload, uploading, formatRupiah }) {
    if (!barcodeImage) return null

    return (
        <div className="modal-overlay" onClick={() => setBarcodeImage(null)}>
            <div className="modal barcode-preview-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>📊 Barcode & Gambar</h2>
                    <button className="modal-close" onClick={() => setBarcodeImage(null)}>×</button>
                </div>
                <div className="modal-body barcode-preview-body">
                    {barcodeImage.product.image_url && (
                        <div className="barcode-preview-image-wrap">
                            <img
                                src={barcodeImage.product.image_url}
                                alt={barcodeImage.product.name}
                                className="barcode-preview-image"
                            />
                            <div className="barcode-preview-image-actions">
                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteImage(barcodeImage.product.id)}>
                                    🗑️ Hapus Gambar
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="barcode-preview-card">
                        <img src={barcodeImage.imageUrl} alt={`Barcode for ${barcodeImage.product.name}`} className="barcode-preview-code" />
                    </div>

                    <div className="barcode-preview-copy">
                        <div className="barcode-preview-name">{barcodeImage.product.emoji} {barcodeImage.product.name}</div>
                        <div className="barcode-preview-price">{formatRupiah(barcodeImage.product.price)}</div>
                        {barcodeImage.product.barcode && (
                            <div className="barcode-preview-number">{barcodeImage.product.barcode}</div>
                        )}
                    </div>

                    <div className="barcode-preview-actions">
                        <label className="btn btn-primary barcode-upload-action">
                            📷 Upload Gambar
                            <input type="file" accept="image/*" className="hidden-file-input" onChange={(e) => handleImageUpload(barcodeImage.product.id, e.target.files[0])} disabled={uploading} />
                        </label>
                        <button className="btn btn-success" onClick={printBarcode}>🖨️ Print</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductBarcodePreviewModal
