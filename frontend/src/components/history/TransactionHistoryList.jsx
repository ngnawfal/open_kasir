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
            <div className="glass-card text-center history-empty-state">
                <span className="history-empty-icon">📋</span>
                <p className="mt-md text-muted">Belum ada transaksi</p>
            </div>
        )
    }

    return (
        <div className="history-list-stack">
            {transactions.map(transaction => (
                <div
                    key={transaction.id}
                    className="glass-card history-transaction-card"
                    onClick={() => setSelectedTransaction(selectedTransaction?.id === transaction.id ? null : transaction)}
                >
                    <div className="flex-between">
                        <div className="flex gap-md history-transaction-head">
                            <span className="history-payment-icon">{getPaymentIcon(transaction.payment_method)}</span>
                            <div>
                                <div className="history-transaction-id">#{transaction.id.toString().padStart(6, '0')}</div>
                                <div className="text-muted history-meta-text">{formatDate(transaction.created_at)}</div>
                                {transaction.user_name && (
                                    <div className="text-muted history-meta-subtext">Kasir: {transaction.user_name}</div>
                                )}
                            </div>
                        </div>
                        <div className="history-transaction-summary">
                            <div className="history-total-amount">
                                {formatRupiah(transaction.total)}
                            </div>
                            <div className="text-muted history-meta-text">
                                {getTotalItems(transaction.items)} item • {transaction.payment_method.toUpperCase()}
                            </div>
                            {transaction.discount_code && (
                                <div className="history-discount-note">🏷️ {transaction.discount_code}</div>
                            )}
                        </div>
                    </div>

                    {selectedTransaction?.id === transaction.id && (
                        <div className="history-transaction-details">
                            <div className="history-item-list">
                                {transaction.items?.map((item, idx) => (
                                    <div key={idx} className="flex-between history-item-row">
                                        <span>{item.product_name} x{item.quantity}</span>
                                        <span>{formatRupiah(item.subtotal)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="history-total-card">
                                <div className="flex-between history-total-line">
                                    <span>Subtotal</span>
                                    <span>{formatRupiah(transaction.subtotal)}</span>
                                </div>
                                {transaction.discount_amount > 0 && (
                                    <div className="flex-between history-total-line history-discount-line">
                                        <span>Diskon ({transaction.discount_code})</span>
                                        <span>-{formatRupiah(transaction.discount_amount)}</span>
                                    </div>
                                )}
                                <div className="flex-between history-total-strong">
                                    <span>Total</span>
                                    <span className="history-total-primary">{formatRupiah(transaction.total)}</span>
                                </div>
                                <div className="flex-between history-total-line history-paid-line">
                                    <span>Bayar</span>
                                    <span>{formatRupiah(transaction.paid)}</span>
                                </div>
                                <div className="flex-between text-success">
                                    <span>Kembalian</span>
                                    <span className="history-total-strong">{formatRupiah(transaction.change)}</span>
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
