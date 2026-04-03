import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { PageTitle } from '../components/PageTitle'
import AccessDenied from '../components/common/AccessDenied'
import PageLoading from '../components/common/PageLoading'

function InventoryPage() {
    const { authFetch, isAdmin } = useAuth()
    const { notify } = useUI()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAdjustModal, setShowAdjustModal] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [adjustQuantity, setAdjustQuantity] = useState('')
    const [adjustReason, setAdjustReason] = useState('')
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products')
            const data = await response.json()
            setProducts(data)
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatRupiah = (amount) => `Rp ${amount.toLocaleString('id-ID')}`

    const filteredProducts = products.filter(p => {
        if (filter === 'low') return p.stock > 0 && p.stock <= 5
        if (filter === 'out') return p.stock === 0
        return true
    })

    const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length
    const outOfStockCount = products.filter(p => p.stock === 0).length
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0)

    const handleAdjust = (product) => {
        setSelectedProduct(product)
        setAdjustQuantity('')
        setAdjustReason('')
        setShowAdjustModal(true)
    }

    const submitAdjustment = async () => {
        if (!adjustQuantity) return

        try {
            const response = await authFetch(`/api/products/${selectedProduct.id}/stock`, {
                method: 'PUT',
                body: JSON.stringify({
                    quantity: parseInt(adjustQuantity),
                    reason: adjustReason
                })
            })

            if (response.ok) {
                fetchProducts()
                setShowAdjustModal(false)
            } else {
                const error = await response.json()
                notify({ type: 'error', title: 'Gagal menyesuaikan stok', message: error.detail })
            }
        } catch (error) {
            notify({ type: 'error', title: 'Gagal menyesuaikan stok', message: error.message })
        }
    }

    if (!isAdmin) {
        return <AccessDenied message="Halaman ini hanya untuk Admin" />
    }

    if (loading) {
        return <PageLoading />
    }

    return (
        <div className="page-container admin-page-shell inventory-page-shell">
            <PageTitle
                title="Manajemen Stok"
                subtitle="Kelola stok produk Anda dengan mudah"
            />

            <div className="dashboard-stats-grid inventory-stats-grid mb-6">
                <div className="card admin-stat-card">
                    <div className="admin-stat-value primary">
                        {products.length}
                    </div>
                    <div className="admin-stat-label">Total Produk</div>
                </div>
                <div className="card admin-stat-card">
                    <div className="admin-stat-value success">
                        {totalStock}
                    </div>
                    <div className="admin-stat-label">Total Stok</div>
                </div>
                <div className="card admin-stat-card is-clickable" onClick={() => setFilter('low')}>
                    <div className="admin-stat-value warning">
                        {lowStockCount}
                    </div>
                    <div className="admin-stat-label">Stok Rendah</div>
                </div>
                <div className="card admin-stat-card is-clickable" onClick={() => setFilter('out')}>
                    <div className="admin-stat-value danger">
                        {outOfStockCount}
                    </div>
                    <div className="admin-stat-label">Stok Habis</div>
                </div>
            </div>

            {lowStockCount > 0 && (
                <div className="admin-alert-banner warning mb-6">
                    <strong>⚠️ Peringatan:</strong> {lowStockCount} produk stok rendah
                </div >
            )}

            <div className="admin-filter-bar mb-6">
                {[
                    { id: 'all', label: 'Semua' },
                    { id: 'low', label: '⚠️ Rendah' },
                    { id: 'out', label: '🚫 Habis' }
                ].map(f => (
                    <button
                        key={f.id}
                        className={filter === f.id ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                        onClick={() => setFilter(f.id)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="inventory-list-stack">
                {filteredProducts.map(product => (
                    <div key={product.id} className="card inventory-list-item">
                        <div className="inventory-item-main">
                            {product.image_url ? (
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="inventory-item-image"
                                />
                            ) : (
                                <span className="inventory-item-emoji">{product.emoji}</span>
                            )}
                            <div className="inventory-item-copy">
                                <div className="inventory-item-name">
                                    {product.name}
                                </div>
                                <div className="inventory-item-meta">
                                    {product.category} • {formatRupiah(product.price)}
                                </div>
                            </div>
                        </div>
                        <div className="inventory-item-side">
                            <div className="inventory-stock-pill">
                                <div className={`inventory-stock-value ${product.stock === 0 ? 'danger' : product.stock <= 5 ? 'warning' : 'success'}`}>
                                    {product.stock}
                                </div>
                                <div className="inventory-stock-label">stok</div>
                            </div>
                            <button
                                className="btn-primary btn-sm"
                                onClick={() => handleAdjust(product)}
                            >
                                ± Sesuaikan
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Adjust Modal */}
            {showAdjustModal && selectedProduct && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>± Sesuaikan Stok</h2>
                            <button className="modal-close" onClick={() => setShowAdjustModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="adjust-product">
                                {selectedProduct.image_url ? (
                                    <img
                                        src={selectedProduct.image_url}
                                        alt={selectedProduct.name}
                                        className="adjust-product-image"
                                    />
                                ) : (
                                    <span className="adjust-emoji">{selectedProduct.emoji}</span>
                                )}
                                <div>
                                    <h4>{selectedProduct.name}</h4>
                                    <p className="text-muted">Stok saat ini: <strong>{selectedProduct.stock}</strong></p>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Jumlah Penyesuaian</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={adjustQuantity}
                                    onChange={(e) => setAdjustQuantity(e.target.value)}
                                    placeholder="+10 atau -5"
                                />
                                <small className="text-muted">
                                    (+) tambah, (-) kurang
                                </small>
                            </div>

                            {adjustQuantity && (
                                <div className="adjust-preview">
                                    <div className="adjust-row">
                                        <span>Saat ini</span>
                                        <span>{selectedProduct.stock}</span>
                                    </div>
                                    <div className="adjust-row">
                                        <span>Perubahan</span>
                                        <span className={parseInt(adjustQuantity) >= 0 ? 'success' : 'danger'}>
                                            {parseInt(adjustQuantity) >= 0 ? '+' : ''}{adjustQuantity}
                                        </span>
                                    </div>
                                    <div className="adjust-row total">
                                        <span>Stok Baru</span>
                                        <span>{selectedProduct.stock + parseInt(adjustQuantity || 0)}</span>
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Alasan (Opsional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value)}
                                    placeholder="Restock, dll"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowAdjustModal(false)}>Batal</button>
                            <button
                                className="btn btn-success"
                                onClick={submitAdjustment}
                                disabled={!adjustQuantity || (selectedProduct.stock + parseInt(adjustQuantity)) < 0}
                            >
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default InventoryPage
