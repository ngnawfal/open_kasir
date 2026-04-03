function CheckoutReceiptView({ receipt, formatRupiah, handleDone, handlePrint }) {
    return (
        <div className="modal-overlay">
            <div className="modal cashier-receipt-modal">
                <div className="modal-header">
                    <h2>✅ Pembayaran Berhasil</h2>
                    <button className="modal-close" onClick={handleDone}>×</button>
                </div>
                <div className="modal-body">
                    <div className="receipt">
                        <div className="receipt-header">
                            <div className="receipt-logo">🛒</div>
                            <div className="receipt-store-name">TOKO MAKANAN</div>
                            <div className="receipt-date">
                                {new Date(receipt.created_at).toLocaleString('id-ID')}
                            </div>
                            <div className="receipt-number">
                                No: #{receipt.id.toString().padStart(6, '0')}
                            </div>
                        </div>

                        <hr className="receipt-divider" />

                        <div className="receipt-items">
                            {receipt.items.map((item, idx) => (
                                <div key={idx} className="receipt-item">
                                    <span className="receipt-item-name">{item.product_name}</span>
                                    <span className="receipt-item-qty">x{item.quantity}</span>
                                    <span>{formatRupiah(item.subtotal)}</span>
                                </div>
                            ))}
                        </div>

                        <hr className="receipt-divider" />

                        <div className="receipt-totals">
                            <div className="receipt-total-row">
                                <span>Subtotal</span>
                                <span>{formatRupiah(receipt.subtotal)}</span>
                            </div>
                            {receipt.discount_amount > 0 && (
                                <div className="receipt-total-row receipt-discount-row">
                                    <span>Diskon ({receipt.discount_code})</span>
                                    <span>-{formatRupiah(receipt.discount_amount)}</span>
                                </div>
                            )}
                            <div className="receipt-total-row grand-total">
                                <span>Total</span>
                                <span>{formatRupiah(receipt.total)}</span>
                            </div>
                            <div className="receipt-total-row">
                                <span>Bayar ({receipt.payment_method.toUpperCase()})</span>
                                <span>{formatRupiah(receipt.paid)}</span>
                            </div>
                            <div className="receipt-total-row receipt-change-row">
                                <span>Kembalian</span>
                                <span>{formatRupiah(receipt.change)}</span>
                            </div>
                        </div>

                        <div className="receipt-footer">
                            <p className="receipt-thanks">Terima Kasih! 🙏</p>
                            <p>Selamat Menikmati</p>
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={handlePrint}>🖨️ Print</button>
                    <button className="btn btn-success" onClick={handleDone}>✓ Selesai</button>
                </div>
            </div>
        </div>
    )
}

export default CheckoutReceiptView
