function DiscountFormModal({ showForm, selectedDiscount, resetForm, handleSubmit, formData, setFormData }) {
    if (!showForm) return null

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h2>{selectedDiscount ? '✏️ Edit Diskon' : '➕ Tambah Diskon'}</h2>
                    <button className="modal-close" onClick={resetForm}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-grid-two">
                            <div className="form-group">
                                <label className="form-label">Kode Promo *</label>
                                <input type="text" className="form-input" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="HEMAT10" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nama Diskon *</label>
                                <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Diskon 10%" required />
                            </div>
                        </div>

                        <div className="form-grid-two">
                            <div className="form-group">
                                <label className="form-label">Tipe Diskon</label>
                                <select className="form-input" value={formData.discount_type} onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}>
                                    <option value="percentage">Persentase (%)</option>
                                    <option value="fixed">Nominal (Rp)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nilai {formData.discount_type === 'percentage' ? '(%)' : '(Rp)'} *</label>
                                <input type="number" className="form-input" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} placeholder={formData.discount_type === 'percentage' ? '10' : '5000'} required />
                            </div>
                        </div>

                        <div className="form-grid-two">
                            <div className="form-group">
                                <label className="form-label">Min. Pembelian (Rp)</label>
                                <input type="number" className="form-input" value={formData.min_purchase} onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })} placeholder="50000" />
                            </div>
                            {formData.discount_type === 'percentage' && (
                                <div className="form-group">
                                    <label className="form-label">Max. Diskon (Rp)</label>
                                    <input type="number" className="form-input" value={formData.max_discount} onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })} placeholder="20000" />
                                </div>
                            )}
                        </div>

                        <div className="form-grid-two">
                            <div className="form-group">
                                <label className="form-label">Berlaku Hingga</label>
                                <input type="date" className="form-input" value={formData.valid_until} onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Batas Penggunaan</label>
                                <input type="number" className="form-input" value={formData.usage_limit} onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })} placeholder="100" />
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={resetForm}>Batal</button>
                        <button type="submit" className="btn btn-success">{selectedDiscount ? 'Simpan' : 'Tambah'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default DiscountFormModal
