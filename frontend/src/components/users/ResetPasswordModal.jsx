function ResetPasswordModal({ showResetPassword, setShowResetPassword, handleResetPassword, newPassword, setNewPassword }) {
    if (!showResetPassword) return null

    return (
        <div className="modal-overlay">
            <div className="modal user-reset-modal">
                <div className="modal-header">
                    <h2>🔑 Reset Password</h2>
                    <button className="modal-close" onClick={() => setShowResetPassword(null)}>×</button>
                </div>
                <form onSubmit={handleResetPassword}>
                    <div className="modal-body">
                        <p className="user-reset-copy">
                            Reset password untuk <strong>{showResetPassword.full_name}</strong> (@{showResetPassword.username})
                        </p>
                        <div className="form-group">
                            <label className="form-label">Password Baru *</label>
                            <input type="password" className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimal 4 karakter" required minLength={4} />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={() => setShowResetPassword(null)}>Batal</button>
                        <button type="submit" className="btn btn-warning">Reset Password</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ResetPasswordModal
