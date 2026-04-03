function DiscountCardsGrid({ discounts, formatRupiah, toggleActive, handleEdit, handleDelete }) {
    if (discounts.length === 0) {
        return (
            <div className="card admin-empty-state">
                <span className="admin-empty-icon">🏷️</span>
                <p>Belum ada diskon atau promo</p>
            </div>
        )
    }

    return (
        <div className="discount-grid admin-coupon-grid">
            {discounts.map(discount => (
                <div key={discount.id} className={`discount-card admin-coupon-card ${discount.is_active ? 'active' : 'inactive'}`}>
                    <div className="admin-coupon-badge">
                        {discount.discount_type === 'percentage' ? `${discount.value}%` : '💰'}
                    </div>

                    <div className="admin-coupon-head">
                        <div className="admin-coupon-title">{discount.name}</div>
                        <div className="admin-coupon-code">{discount.code}</div>
                    </div>

                    <div className="admin-coupon-meta">
                        <div>💵 {discount.discount_type === 'percentage' ? `Diskon ${discount.value}%` : `Potongan ${formatRupiah(discount.value)}`}</div>
                        {discount.min_purchase > 0 && <div>🛒 Min. belanja {formatRupiah(discount.min_purchase)}</div>}
                        {discount.max_discount && <div>📊 Max. diskon {formatRupiah(discount.max_discount)}</div>}
                        <div>📈 Terpakai: {discount.usage_count}{discount.usage_limit && ` / ${discount.usage_limit}`}</div>
                        {discount.valid_until && <div>📅 Berlaku hingga {new Date(discount.valid_until).toLocaleDateString('id-ID')}</div>}
                    </div>

                    <div className="admin-coupon-actions">
                        <button onClick={() => toggleActive(discount)} className="admin-coupon-action primary">
                            {discount.is_active ? '❌ Nonaktifkan' : '✅ Aktifkan'}
                        </button>
                        <button onClick={() => handleEdit(discount)} className="admin-coupon-action icon">✏️</button>
                        <button onClick={() => handleDelete(discount.id)} className="admin-coupon-action danger">🗑️</button>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default DiscountCardsGrid
