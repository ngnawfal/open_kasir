import { useState } from 'react'
import BarcodeScanner from '../components/BarcodeScanner'
import CheckoutModal from '../components/CheckoutModal'
import { useAuth } from '../context/AuthContext'

function CashierPage({ products, cart, cartTotal, cartCount, addToCart, updateQuantity, clearCart, fetchProducts }) {
    const { authFetch } = useAuth()
    const [isScanning, setIsScanning] = useState(false)
    const [scanStatus, setScanStatus] = useState(null)
    const [showCheckout, setShowCheckout] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('Semua')

    // Get unique categories
    const categories = ['Semua', ...new Set(products.map(p => p.category))]

    // Filter products
    const filteredProducts = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.barcode && p.barcode.includes(searchQuery))
        const matchCategory = activeCategory === 'Semua' || p.category === activeCategory
        return matchSearch && matchCategory
    })

    const handleScan = async (barcode) => {
        try {
            const response = await fetch(`/api/products/barcode/${barcode}`)
            if (response.ok) {
                const product = await response.json()
                if (product.stock <= 0) {
                    showStatus('error', `❌ Stok ${product.name} habis!`)
                    return
                }
                addToCart(product)
                showStatus('success', `✅ ${product.name} ditambahkan!`)
            } else {
                showStatus('error', '❌ Produk tidak ditemukan')
            }
        } catch (error) {
            showStatus('error', '❌ Error saat scan')
        }
    }

    const showStatus = (type, message) => {
        setScanStatus({ type, message })
        setTimeout(() => setScanStatus(null), 2000)
    }

    const handleAddToCart = (product) => {
        if (product.stock <= 0) {
            showStatus('error', `❌ Stok ${product.name} habis!`)
            return
        }
        addToCart(product)
        showStatus('success', `✅ ${product.name}`)
    }

    const handleCheckoutComplete = () => {
        clearCart()
        fetchProducts()
    }

    const formatRupiah = (amount) => `Rp ${amount.toLocaleString('id-ID')}`
    const lowStockCount = products.filter(product => product.stock > 0 && product.stock <= 5).length
    const availableCount = products.filter(product => product.stock > 0).length

    return (
        <div className="cashier-page cashier-shell">
            <div className="cashier-products-panel cashier-products-surface">
                <div className="cashier-hero">
                    <div>
                        <span className="cashier-kicker">Operator Workspace</span>
                        <h1 className="cashier-title">Kasir Cepat & Fokus</h1>
                        <p className="cashier-subtitle">
                            Cari produk, scan barcode, lalu selesaikan pembayaran tanpa pindah alur.
                        </p>
                    </div>
                    <div className="cashier-hero-stats">
                        <div className="cashier-stat-card">
                            <span className="cashier-stat-label">Produk aktif</span>
                            <strong>{availableCount}</strong>
                        </div>
                        <div className="cashier-stat-card warning">
                            <span className="cashier-stat-label">Stok menipis</span>
                            <strong>{lowStockCount}</strong>
                        </div>
                        <div className="cashier-stat-card accent">
                            <span className="cashier-stat-label">Item di keranjang</span>
                            <strong>{cartCount}</strong>
                        </div>
                    </div>
                </div>

                {scanStatus && (
                    <div className={`status-toast ${scanStatus.type} cashier-status-pill`}>
                        <span className="cashier-status-dot" />
                        <span>{scanStatus.message}</span>
                    </div>
                )}

                <div className="cashier-toolbar">
                    <div className="cashier-search search-elevated">
                        <span className="search-icon">🔎</span>
                        <input
                            type="text"
                            placeholder="Cari nama menu atau barcode..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="cashier-search-input"
                        />
                    </div>
                    <button
                        className={`btn-scan cashier-scan-btn ${isScanning ? 'active' : ''}`}
                        onClick={() => setIsScanning(!isScanning)}
                    >
                        <span>📷</span>
                        <span>{isScanning ? 'Tutup Scanner' : 'Scan Barcode'}</span>
                    </button>
                </div>

                <div className="cashier-filter-row">
                    <div className="category-tabs cashier-category-tabs">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="cashier-filter-meta">
                        <span>{filteredProducts.length} produk tampil</span>
                        <span>{activeCategory}</span>
                    </div>
                </div>

                <div className="products-grid cashier-products-grid">
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            className={`product-card cashier-product-card ${product.stock <= 0 ? 'out-of-stock' : ''}`}
                            onClick={() => handleAddToCart(product)}
                        >
                            <div className="product-card-image">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} />
                                ) : (
                                    <span className="product-emoji">{product.emoji}</span>
                                )}
                                {product.stock <= 5 && product.stock > 0 && (
                                    <span className="stock-warning">⚠️ {product.stock}</span>
                                )}
                                {product.stock <= 0 && (
                                    <span className="stock-empty">Habis</span>
                                )}
                            </div>
                            <div className="product-card-info">
                                <div className="cashier-product-head">
                                    <span className="product-card-name">{product.name}</span>
                                    <span className="cashier-product-category">{product.category}</span>
                                </div>
                                <div className="cashier-product-footer">
                                    <span className="product-card-price">{formatRupiah(product.price)}</span>
                                    <span className="cashier-product-stock">Stok {product.stock}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="cashier-cart-panel cashier-cart-surface">
                <div className="cart-header">
                    <div>
                        <span className="cashier-kicker">Ringkasan transaksi</span>
                        <h2>🛒 Keranjang</h2>
                    </div>
                    <span className="cart-count">{cartCount} item</span>
                </div>

                <div className="cashier-cart-summary">
                    <div>
                        <span className="cashier-summary-label">Total sementara</span>
                        <strong>{formatRupiah(cartTotal)}</strong>
                    </div>
                    <div>
                        <span className="cashier-summary-label">Kategori dipilih</span>
                        <strong>{activeCategory}</strong>
                    </div>
                </div>

                <div className="cart-items cashier-cart-items">
                    {cart.length === 0 ? (
                        <div className="cart-empty cashier-cart-empty-state">
                            <span className="cart-empty-icon">🛒</span>
                            <p>Keranjang kosong</p>
                            <small>Tambahkan produk dari panel kiri atau scan barcode</small>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="cart-item cashier-cart-item-card">
                                <div className="cart-item-info">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="cart-item-img" />
                                    ) : (
                                        <span className="cart-item-emoji">{item.emoji}</span>
                                    )}
                                    <div>
                                        <div className="cart-item-name">{item.name}</div>
                                        <div className="cart-item-price">{formatRupiah(item.price)}</div>
                                    </div>
                                </div>
                                <div className="cashier-cart-side">
                                    <div className="cart-item-qty cashier-qty-control">
                                        <button
                                            className="qty-btn"
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        >
                                            −
                                        </button>
                                        <span className="qty-value">{item.quantity}</span>
                                        <button
                                            className="qty-btn"
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div className="cart-item-subtotal">
                                        {formatRupiah(item.price * item.quantity)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="cart-footer cashier-cart-footer">
                    <div className="cart-total">
                        <span>Total</span>
                        <span className="cart-total-amount">{formatRupiah(cartTotal)}</span>
                    </div>

                    <p className="cashier-cart-note">
                        Pastikan jumlah item benar sebelum lanjut ke pembayaran.
                    </p>

                    <div className="cart-actions">
                        {cart.length > 0 && (
                            <button className="btn-clear" onClick={clearCart}>
                                🗑️ Hapus
                            </button>
                        )}
                        <button
                            className="btn-checkout"
                            onClick={() => setShowCheckout(true)}
                            disabled={cart.length === 0}
                        >
                            💳 Bayar
                        </button>
                    </div>
                </div>
            </div>

            {
                isScanning && (
                    <div className="modal-overlay" onClick={() => setIsScanning(false)}>
                        <div className="modal scanner-modal cashier-scanner-shell" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div>
                                    <span className="cashier-kicker">Mode scan</span>
                                    <h3>📷 Scan Barcode</h3>
                                </div>
                                <button
                                    className="btn-close"
                                    onClick={() => setIsScanning(false)}
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="modal-body">
                                <BarcodeScanner
                                    onScan={handleScan}
                                    isScanning={isScanning}
                                    setIsScanning={setIsScanning}
                                />
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showCheckout && (
                    <CheckoutModal
                        cart={cart}
                        cartTotal={cartTotal}
                        onClose={() => setShowCheckout(false)}
                        onComplete={handleCheckoutComplete}
                        authFetch={authFetch}
                    />
                )
            }
        </div >
    )
}

export default CashierPage
