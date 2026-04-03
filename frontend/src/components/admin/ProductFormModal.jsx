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
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.barcode}
                                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                    placeholder="Ketik atau scan barcode"
                                    style={{ flex: 1 }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => setShowScanner(true)}
                                >
                                    📷 Scan
                                </button>
                            </div>
                            <small style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
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

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                                    className="form-input"
                                    value={customCategory || formData.category}
                                    onChange={(e) => {
                                        setCustomCategory(e.target.value)
                                        setFormData({ ...formData, category: e.target.value })
                                    }}
                                    placeholder="Ketik kategori baru..."
                                    style={{ marginTop: '0.5rem' }}
                                />
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Foto Produk</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '12px',
                                    background: '#f3f4f6',
                                    border: '2px dashed #d1d5db',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    flexShrink: 0
                                }}>
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : selectedProduct?.image_url ? (
                                        <img src={selectedProduct.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '2rem', opacity: 0.4 }}>📷</span>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                                        {previewUrl ? '✅ Foto siap diupload' : selectedProduct?.image_url ? 'Foto sudah diupload' : 'Pilih foto untuk produk'}
                                    </p>
                                    <label style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 16px',
                                        background: '#4f46e5',
                                        color: 'white',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '500'
                                    }}>
                                        📷 {previewUrl || selectedProduct?.image_url ? 'Ganti Foto' : 'Pilih Foto'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
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
                                            style={{
                                                marginLeft: '8px',
                                                padding: '8px 16px',
                                                background: '#fee2e2',
                                                color: '#ef4444',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                fontWeight: '500'
                                            }}
                                        >
                                            🗑️ Hapus
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Emoji (Fallback jika tidak ada foto)</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {emojiOptions.map(emoji => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        className={`btn ${formData.emoji === emoji ? 'btn-primary' : 'btn-ghost'}`}
                                        style={{ fontSize: '1.5rem', padding: '0.5rem' }}
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
