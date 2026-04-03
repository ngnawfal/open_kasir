function BestSellersPanel({ bestSellers, formatRupiah }) {
    if (!bestSellers) return null

    return (
        <div className="report-card">
            <h3 className="report-title">🏆 Terlaris (30 Hari)</h3>

            <div className="bestseller-list">
                {bestSellers.best_sellers.map((product, index) => (
                    <div key={product.product_id} className="bestseller-item">
                        <span className={`bestseller-rank ${index < 3 ? 'top' : ''}`}>#{index + 1}</span>
                        <span className="bestseller-emoji">{product.emoji}</span>
                        <div className="bestseller-info">
                            <div className="bestseller-name">{product.product_name}</div>
                            <div className="bestseller-stock">Stok: {product.current_stock}</div>
                        </div>
                        <div className="bestseller-stats">
                            <div className="bestseller-qty">{product.total_quantity} terjual</div>
                            <div className="bestseller-revenue">{formatRupiah(product.total_revenue)}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default BestSellersPanel
