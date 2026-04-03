function CustomerFormModal({ showForm, selectedCustomer, resetForm, handleSubmit, formData, setFormData }) {
    if (!showForm) return null

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h2>{selectedCustomer ? '✏️ Edit Pelanggan' : '➕ Tambah Pelanggan'}</h2>
                    <button className="modal-close" onClick={resetForm}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Nama *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Nama pelanggan"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">No. Telepon</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="08xxxxxxxxxx"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="email@contoh.com"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Alamat</label>
                            <textarea
                                className="form-input"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                rows={3}
                                placeholder="Alamat lengkap"
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={resetForm}>Batal</button>
                        <button type="submit" className="btn btn-primary">{selectedCustomer ? 'Update' : 'Simpan'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CustomerFormModal
