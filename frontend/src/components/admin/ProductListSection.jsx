import { PageTitle } from '../PageTitle'

function ProductListSection({
    products,
    filteredProducts,
    searchQuery,
    setSearchQuery,
    formatRupiah,
    setShowForm,
    uploading,
    handleImageUpload,
    showBarcode,
    openBarcodeModal,
    handleEdit,
    handleDelete,
}) {
    return (
        <>
            <div className="admin-toolbar">
                <PageTitle
                    title="Daftar Produk"
                    subtitle={`Kelola ${products.length} produk, gambar, dan barcode`}
                />
                <button
                    className="admin-toolbar-action"
                    onClick={() => setShowForm(true)}
                >
                    ➕ Tambah Produk
                </button>
            </div>

            <div className="card admin-surface-card product-list-card">
                <input
                    type="text"
                    className="form-input mb-md"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 Cari produk atau barcode..."
                />

                <div className="product-list-stack">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="product-item">
                            <div className="product-item-image">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="product-item-image-asset" />
                                ) : (
                                    <span className="product-item-emoji">{product.emoji}</span>
                                )}
                            </div>

                            <div className="product-item-info">
                                <div className="product-item-name">{product.name}</div>
                                <div className="product-item-details">
                                    <span className="product-item-price">{formatRupiah(product.price)}</span>
                                    <span className="product-item-category">{product.category}</span>
                                    <span>Stok: <span className={`product-stock-value ${product.stock <= 5 ? 'low' : 'ok'}`}>{product.stock}</span></span>
                                    {product.barcode && <span className="product-barcode-inline">📊 {product.barcode}</span>}
                                </div>
                            </div>

                            <div className="product-actions">
                                <label className="action-btn">
                                    📷 Gambar
                                    <input type="file" accept="image/*" className="hidden-file-input" onChange={(e) => handleImageUpload(product.id, e.target.files[0])} disabled={uploading} />
                                </label>
                                <button onClick={() => showBarcode(product)} className="action-btn">📊 Barcode</button>
                                <button onClick={() => openBarcodeModal(product)} className="action-btn">🏷️ Kelola</button>
                                <button onClick={() => handleEdit(product)} className="action-btn primary">✏️ Edit</button>
                                <button onClick={() => handleDelete(product.id)} className="action-btn danger">🗑️ Hapus</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}

export default ProductListSection
