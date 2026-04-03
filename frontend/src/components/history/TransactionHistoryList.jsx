function TransactionHistoryList({
    transactions,
    selectedTransaction,
    setSelectedTransaction,
    getPaymentIcon,
    formatDate,
    getTotalItems,
    formatRupiah,
}) {
    if (transactions.length === 0) {
        return (
            <div className="glass-card text-center" style={{ padding: '3rem' }}>
                <span style={{ fontSize: '4rem', opacity: 0.5 }}>📋</span>
                <p className="mt-md text-muted">Belum ada transaksi</p>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {transactions.map(transaction => (
                <div
                    key={transaction.id}
                    className="glass-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedTransaction(selectedTransaction?.id === transaction.id ? null : transaction)}
                >
                    <div className="flex-between">
                        <div className="flex gap-md" style={{ alignItems: 'center' }}>
                            <span style={{ fontSize: '1.5rem' }}>{getPaymentIcon(transaction.payment_method)}</span>
                            <div>
                                <div style={{ fontWeight: '600' }}>#{transaction.id.toString().padStart(6, '0')}</div>
                                <div className="text-muted" style={{ fontSize: '0.85rem' }}>{formatDate(transaction.created_at)}</div>
                                {transaction.user_name && (
                                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>Kasir: {transaction.user_name}</div>
                                )}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '700', fontSize: '1.25rem', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                {formatRupiah(transaction.total)}
                            </div>
                            <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                                {getTotalItems(transaction.items)} item • {transaction.payment_method.toUpperCase()}
                            </div>
                            {transaction.discount_code && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>🏷️ {transaction.discount_code}</div>
                            )}
                        </div>
                    </div>

                    {selectedTransaction?.id === transaction.id && (
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                {transaction.items?.map((item, idx) => (
                                    <div key={idx} className="flex-between" style={{ padding: '0.25rem 0' }}>
                                        <span>{item.product_name} x{item.quantity}</span>
                                        <span>{formatRupiah(item.subtotal)}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ padding: '0.75rem', background: 'var(--bg-glass)', borderRadius: '8px' }}>
                                <div className="flex-between" style={{ marginBottom: '0.25rem' }}>
                                    <span>Subtotal</span>
                                    <span>{formatRupiah(transaction.subtotal)}</span>
                                </div>
                                {transaction.discount_amount > 0 && (
                                    <div className="flex-between" style={{ marginBottom: '0.25rem', color: 'var(--danger)' }}>
                                        <span>Diskon ({transaction.discount_code})</span>
                                        <span>-{formatRupiah(transaction.discount_amount)}</span>
                                    </div>
                                )}
                                <div className="flex-between" style={{ fontWeight: '600' }}>
                                    <span>Total</span>
                                    <span style={{ color: 'var(--primary)' }}>{formatRupiah(transaction.total)}</span>
                                </div>
                                <div className="flex-between" style={{ marginTop: '0.5rem' }}>
                                    <span>Bayar</span>
                                    <span>{formatRupiah(transaction.paid)}</span>
                                </div>
                                <div className="flex-between text-success">
                                    <span>Kembalian</span>
                                    <span style={{ fontWeight: '600' }}>{formatRupiah(transaction.change)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

export default TransactionHistoryList
