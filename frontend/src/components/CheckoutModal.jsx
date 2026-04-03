import { useState } from 'react'
import CheckoutReceiptView from './checkout/CheckoutReceiptView'

function CheckoutModal({ cart, cartTotal, discount, onClose, onComplete, authFetch }) {
    const [paid, setPaid] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('cash')
    const [promoCode, setPromoCode] = useState('')
    const [appliedDiscount, setAppliedDiscount] = useState(discount)
    const [promoError, setPromoError] = useState('')
    const [paymentError, setPaymentError] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [receipt, setReceipt] = useState(null)

    const discountAmount = appliedDiscount ?
        (appliedDiscount.discount_type === 'percentage'
            ? Math.min(Math.floor(cartTotal * appliedDiscount.value / 100), appliedDiscount.max_discount || Infinity)
            : Math.min(appliedDiscount.value, cartTotal)
        ) : 0

    const finalTotal = cartTotal - discountAmount
    const paidAmount = parseInt(paid) || 0
    const change = paidAmount - finalTotal
    const canPay = paymentMethod !== 'cash' || paidAmount >= finalTotal

    const formatRupiah = (amount) => `Rp ${amount.toLocaleString('id-ID')}`

    const paymentMethods = [
        { id: 'cash', label: '💵 Cash', icon: '💵' },
        { id: 'qris', label: '📱 QRIS', icon: '📱' },
        { id: 'debit', label: '💳 Debit', icon: '💳' },
        { id: 'credit', label: '💳 Credit', icon: '💳' },
    ]

    const quickPayAmounts = [20000, 50000, 100000, 150000, 200000]

    const applyPromo = async () => {
        if (!promoCode) return
        setPromoError('')

        try {
            const response = await fetch(`/api/discounts/validate/${promoCode}?subtotal=${cartTotal}`)
            if (response.ok) {
                const data = await response.json()
                setAppliedDiscount(data.discount)
            } else {
                const error = await response.json()
                setPromoError(error.detail)
            }
        } catch (error) {
            setPromoError('Gagal memvalidasi promo')
        }
    }

    const handlePayment = async () => {
        if (!canPay) return

        setPaymentError('')
        setIsProcessing(true)
        try {
            const finalPaid = paymentMethod === 'cash' ? paidAmount : finalTotal

            const response = await authFetch('/api/transactions', {
                method: 'POST',
                body: JSON.stringify({
                    items: cart.map(item => ({
                        product_id: item.id,
                        quantity: item.quantity
                    })),
                    discount_code: appliedDiscount?.code || null,
                    payment_method: paymentMethod,
                    paid: finalPaid
                })
            })

            if (response.ok) {
                const data = await response.json()
                setReceipt(data)
            } else {
                const error = await response.json()
                throw new Error(error.detail)
            }
        } catch (error) {
            setPaymentError(error.message || 'Gagal memproses pembayaran')
        } finally {
            setIsProcessing(false)
        }
    }

    const handlePrint = () => window.print()

    const handleDone = () => {
        onComplete()
        onClose()
    }

    // Receipt View
    if (receipt) {
        return <CheckoutReceiptView receipt={receipt} formatRupiah={formatRupiah} handleDone={handleDone} handlePrint={handlePrint} />
    }

    return (
        <div className="modal-overlay">
            <div className="modal cashier-checkout-modal">
                <div className="modal-header">
                    <div>
                        <span className="cashier-kicker">Finalisasi transaksi</span>
                        <h2>💰 Pembayaran</h2>
                    </div>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body cashier-checkout-layout">
                    <div className="cashier-checkout-column primary">
                        <div className="checkout-summary cashier-summary-card">
                            <div className="cashier-section-heading">
                                <h4>Ringkasan pesanan</h4>
                                <span>{cart.length} item</span>
                            </div>
                            <div className="cashier-checkout-items">
                            {cart.map(item => (
                                <div key={item.id} className="checkout-row">
                                    <span>{item.emoji} {item.name} x{item.quantity}</span>
                                    <span>{formatRupiah(item.price * item.quantity)}</span>
                                </div>
                            ))}
                            </div>
                            <div className="checkout-row total">
                                <span>Subtotal</span>
                                <span>{formatRupiah(cartTotal)}</span>
                            </div>
                        </div>

                        <div className="form-group cashier-promo-card">
                            <label className="form-label">Kode Promo</label>
                            <div className="cashier-promo-row">
                                <input
                                    type="text"
                                    className="form-input"
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                    placeholder="Masukkan kode promo"
                                />
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={applyPromo}
                                >
                                    Pakai
                                </button>
                            </div>
                            {promoError && <small className="text-danger">{promoError}</small>}
                            {appliedDiscount && (
                                <div className="cashier-applied-promo">
                                    ✅ {appliedDiscount.name} (-{appliedDiscount.discount_type === 'percentage'
                                        ? `${appliedDiscount.value}%`
                                        : formatRupiah(appliedDiscount.value)})
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Metode Pembayaran</label>
                            <div className="payment-methods cashier-payment-grid">
                                {paymentMethods.map(method => (
                                    <button
                                        key={method.id}
                                        type="button"
                                        className={`payment-method-btn ${paymentMethod === method.id ? 'active' : ''}`}
                                        onClick={() => setPaymentMethod(method.id)}
                                    >
                                        <span>{method.icon}</span>
                                        <span>{method.label.replace(`${method.icon} `, '')}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="cashier-checkout-column secondary">
                        <div className="checkout-summary cashier-payment-card">
                            <div className="cashier-section-heading">
                                <h4>Panel pembayaran</h4>
                                <span>{paymentMethod.toUpperCase()}</span>
                            </div>

                            {paymentMethod === 'cash' && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Jumlah Bayar</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={paid}
                                            onChange={(e) => setPaid(e.target.value)}
                                            placeholder="Masukkan jumlah uang"
                                        />
                                    </div>

                                    <div className="cashier-quickpay-grid">
                                        {quickPayAmounts.map(amount => (
                                            <button
                                                key={amount}
                                                type="button"
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => setPaid(amount.toString())}
                                            >
                                                {formatRupiah(amount)}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-sm"
                                            onClick={() => setPaid(finalTotal.toString())}
                                        >
                                            Uang Pas
                                        </button>
                                    </div>
                                </>
                            )}

                            <div className="checkout-summary cashier-final-summary">
                                {discountAmount > 0 && (
                                    <div className="checkout-row cashier-discount-row">
                                        <span>Diskon</span>
                                        <span>-{formatRupiah(discountAmount)}</span>
                                    </div>
                                )}
                                <div className="checkout-row total">
                                    <span>Total Bayar</span>
                                    <span className="amount">{formatRupiah(finalTotal)}</span>
                                </div>
                                {paymentMethod === 'cash' && paidAmount > 0 && (
                                    <div className={`checkout-row ${change >= 0 ? 'change' : ''}`}>
                                        <span>Kembalian</span>
                                        <span className={change >= 0 ? 'cashier-positive' : 'cashier-negative'}>
                                            {change >= 0 ? formatRupiah(change) : `Kurang ${formatRupiah(-change)}`}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {paymentError && (
                                <div className="cashier-payment-error">
                                    ⚠️ {paymentError}
                                </div>
                            )}

                            <div className="cashier-payment-footnote">
                                Pastikan nominal dan metode pembayaran sesuai sebelum konfirmasi.
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onClose}>Batal</button>
                    <button
                        className="btn btn-success"
                        onClick={handlePayment}
                        disabled={!canPay || isProcessing}
                    >
                        {isProcessing ? '⏳ Memproses...' : '✓ Konfirmasi Bayar'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CheckoutModal
