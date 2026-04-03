function UserFormModal({ showForm, selectedUser, resetForm, handleSubmit, formData, setFormData }) {
    if (!showForm) return null

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h2>{selectedUser ? '✏️ Edit User' : '➕ Tambah User Baru'}</h2>
                    <button className="modal-close" onClick={resetForm}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Username *</label>
                            <input type="text" className="form-input" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="contoh: kasir1" required />
                        </div>
                        {!selectedUser && (
                            <div className="form-group">
                                <label className="form-label">Password *</label>
                                <input type="password" className="form-input" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Minimal 4 karakter" required minLength={4} />
                            </div>
                        )}
                        <div className="form-group">
                            <label className="form-label">Nama Lengkap *</label>
                            <input type="text" className="form-input" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder="Nama tampilan" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Role *</label>
                            <div className="form-grid-role">
                                <label className={`role-option ${formData.role === 'kasir' ? 'active kasir' : ''}`}>
                                    <input type="radio" name="role" value="kasir" checked={formData.role === 'kasir'} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="hidden-radio" />
                                    👤 Kasir
                                </label>
                                <label className={`role-option ${formData.role === 'admin' ? 'active admin' : ''}`}>
                                    <input type="radio" name="role" value="admin" checked={formData.role === 'admin'} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="hidden-radio" />
                                    👑 Admin
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={resetForm}>Batal</button>
                        <button type="submit" className="btn btn-success">{selectedUser ? 'Simpan' : 'Buat User'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default UserFormModal
