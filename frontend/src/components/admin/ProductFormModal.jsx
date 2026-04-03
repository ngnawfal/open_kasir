function ProductFormModal({
    showForm,
    selectedProduct,
    resetForm,
    handleSubmit,
    formData,
    setFormData,
    setShowScanner,
    categories,
    customCategory,
    setCustomCategory,
    previewUrl,
    pendingImageFile,
    uploading,
    handleImageUpload,
    handleDeleteImage,
    setPendingImageFile,
    setPreviewUrl,
    emojiOptions,
}) {
    if (!showForm) return null

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h2>{selectedProduct ? '✏️ Edit Produk' : '➕ Tambah Produk'}</h2>
                    <button className="modal-close" onClick={resetForm}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Barcode (Opsional untuk Snack/Kemasan)</label>
                            <div className="input-with-action">
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.barcode}
                                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                    placeholder="Ketik atau scan barcode"
                                />
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => setShowScanner(true)}
                                >
                                    📷 Scan
                                </button>
                            </div>
                            <small className="barcode-help-text">
                                Kosongkan untuk Makanan/Minuman yang disajikan langsung
                            </small>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Nama Produk *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Contoh: Nasi Goreng"
                                required
                            />
                        </div>

                        <div className="form-grid-two">
                            <div className="form-group">
                                <label className="form-label">Harga Jual (Rp) *</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="15000"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Harga Modal (Rp)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.cost_price}
                                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                                    placeholder="10000"
                                />
                            </div>
                        </div>

                        <div className="form-grid-two">
                            <div className="form-group">
                                <label className="form-label">Stok *</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.stock}
                                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                    placeholder="50"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Min. Stok (Alert)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.min_stock}
                                    onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                                    placeholder="5"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Kategori</label>
                            <select
                                className="form-input"
                                value={formData.category === customCategory && customCategory ? 'Lainnya' : formData.category}
                                onChange={(e) => {
                                    if (e.target.value === 'Lainnya') {
                                        setCustomCategory('')
                                        setFormData({ ...formData, category: '' })
                                    } else {
                                        setCustomCategory('')
                                        setFormData({ ...formData, category: e.target.value })
                                    }
                                }}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            {(formData.category === '' || formData.category === customCategory || !categories.includes(formData.category)) && (
                                <input
                                    type="text"
                                    className="form-input category-custom-input"
                                    value={customCategory || formData.category}
                                    onChange={(e) => {
                                        setCustomCategory(e.target.value)
                                        setFormData({ ...formData, category: e.target.value })
                                    }}
                                    placeholder="Ketik kategori baru..."
                                />
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Foto Produk</label>
                            <div className="media-picker-row">
                                <div className="media-preview-box">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="media-preview-image" />
                                    ) : selectedProduct?.image_url ? (
                                        <img src={selectedProduct.image_url} alt="Preview" className="media-preview-image" />
                                    ) : (
                                        <span className="media-preview-placeholder">📷</span>
                                    )}
                                </div>
                                <div className="media-picker-copy">
                                    <p className="media-picker-note">
                                        {previewUrl ? '✅ Foto siap diupload' : selectedProduct?.image_url ? 'Foto sudah diupload' : 'Pilih foto untuk produk'}
                                    </p>
                                    <label className="media-picker-button">
                                        📷 {previewUrl || selectedProduct?.image_url ? 'Ganti Foto' : 'Pilih Foto'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden-file-input"
                                            onChange={(e) => {
                                                if (e.target.files[0]) {
                                                    const file = e.target.files[0]
                                                    if (selectedProduct) {
                                                        handleImageUpload(selectedProduct.id, file)
                                                    } else {
                                                        setPendingImageFile(file)
                                                        setPreviewUrl(URL.createObjectURL(file))
                                                    }
                                                }
                                            }}
                                            disabled={uploading}
                                        />
                                    </label>
                                    {(previewUrl || selectedProduct?.image_url) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (previewUrl) {
                                                    setPendingImageFile(null)
                                                    setPreviewUrl(null)
                                                } else if (selectedProduct) {
                                                    handleDeleteImage(selectedProduct.id)
                                                }
                                            }}
                                            className="media-delete-button"
                                        >
                                            🗑️ Hapus
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Emoji (Fallback jika tidak ada foto)</label>
                            <div className="emoji-picker-grid">
                                {emojiOptions.map(emoji => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        className={`btn ${formData.emoji === emoji ? 'btn-primary' : 'btn-ghost'} emoji-picker-btn`}
                                        onClick={() => setFormData({ ...formData, emoji })}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={resetForm}>Batal</button>
                        <button type="submit" className="btn btn-success">
                            {selectedProduct ? 'Simpan' : 'Tambah'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ProductFormModal
