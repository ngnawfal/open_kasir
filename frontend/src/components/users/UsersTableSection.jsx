function UsersTableSection({ users, handleEdit, setShowResetPassword, toggleUserStatus }) {
    return (
        <>
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr><th>User</th><th>Username</th><th>Role</th><th>Status</th><th>Aksi</th></tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className={!user.is_active ? 'row-faded' : ''}>
                                <td>
                                    <div className="user-cell">
                                        <div className="user-avatar-small">{user.role === 'admin' ? '👑' : '👤'}</div>
                                        <span className="font-semibold">{user.full_name}</span>
                                    </div>
                                </td>
                                <td className="text-muted">@{user.username}</td>
                                <td><span className={`status-badge ${user.role === 'admin' ? 'status-gold' : 'status-silver'}`}>{user.role === 'admin' ? 'Administrator' : 'Kasir'}</span></td>
                                <td><span className={`status-badge ${user.is_active ? 'status-active' : 'status-inactive'}`}>{user.is_active ? '🟢 Aktif' : '🔴 Nonaktif'}</span></td>
                                <td>
                                    <div className="table-action-row">
                                        <button onClick={() => handleEdit(user)} title="Edit" className="table-action-button neutral">✏️ Edit</button>
                                        <button onClick={() => setShowResetPassword(user)} title="Reset Password" className="table-action-button warning">🔑</button>
                                        <button onClick={() => toggleUserStatus(user)} title={user.is_active ? 'Nonaktifkan' : 'Aktifkan'} className={`table-action-button ${user.is_active ? 'danger' : 'success'}`}>{user.is_active ? '🚫' : '✓'}</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mobile-card-list">
                {users.map(user => (
                    <div key={user.id} className={`mobile-card ${!user.is_active ? 'row-faded' : ''}`}>
                        <div className="mobile-card-header">
                            <div className="user-cell">
                                <div className="user-avatar-small">{user.role === 'admin' ? '👑' : '👤'}</div>
                                <div className="mobile-stack-inline">
                                    <span className="font-semibold">{user.full_name}</span>
                                    <span className="text-muted mobile-subtext">@{user.username}</span>
                                </div>
                            </div>
                            <span className={`status-badge ${user.is_active ? 'status-active' : 'status-inactive'}`}>{user.is_active ? 'Aktif' : 'Nonaktif'}</span>
                        </div>
                        <div className="mobile-card-row">
                            <span className="mobile-card-label">Role</span>
                            <span className={`status-badge ${user.role === 'admin' ? 'status-gold' : 'status-silver'}`}>{user.role === 'admin' ? 'Administrator' : 'Kasir'}</span>
                        </div>
                        <div className="mobile-card-actions">
                            <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(user)}>✏️ Edit</button>
                            <button className="btn btn-warning btn-sm" onClick={() => setShowResetPassword(user)}>🔑 Reset</button>
                            <button className={`btn btn-sm ${user.is_active ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleUserStatus(user)}>{user.is_active ? '🚫 Disable' : '✓ Enable'}</button>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}

export default UsersTableSection
