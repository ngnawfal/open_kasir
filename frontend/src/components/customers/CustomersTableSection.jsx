function memberColors(memberLevel) {
    if (memberLevel === 'Gold') return { background: 'rgba(241, 196, 15, 0.2)', color: '#f1c40f' }
    if (memberLevel === 'Silver') return { background: 'rgba(149, 165, 166, 0.2)', color: '#7f8c8d' }
    return { background: 'rgba(211, 84, 0, 0.1)', color: '#d35400' }
}

function memberEmoji(memberLevel) {
    if (memberLevel === 'Gold') return '🥇'
    if (memberLevel === 'Silver') return '🥈'
    return '🥉'
}

function CustomersTableSection({ filteredCustomers, handleEdit, handlePayDebt }) {
    return (
        <>
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Pelanggan</th>
                            <th>Kontak</th>
                            <th>Member</th>
                            <th>Hutang</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.map(customer => {
                            const colors = memberColors(customer.member_level)
                            return (
                                <tr key={customer.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar-small" style={colors}>
                                                {memberEmoji(customer.member_level)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{customer.name}</div>
                                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>ID: #{customer.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span className="text-muted">📱 {customer.phone || '-'}</span>
                                            {customer.email && <span className="text-muted">📧 {customer.email}</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span className={`status-badge status-${customer.member_level.toLowerCase()}`}>
                                                {customer.member_level}
                                            </span>
                                            <span className="text-muted">⭐ {customer.points} Poin</span>
                                            <span className="text-muted">🛒 Rp {customer.total_spent.toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td>
                                        {customer.total_debt > 0 ? (
                                            <span className="status-badge status-inactive" style={{ fontSize: '0.85rem' }}>
                                                ⚠️ Rp {customer.total_debt.toLocaleString()}
                                            </span>
                                        ) : (
                                            <span className="status-badge status-active">Lunas</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(customer)} title="Edit">
                                                ✏️
                                            </button>
                                            {customer.total_debt > 0 && (
                                                <button className="btn btn-success btn-sm" onClick={() => handlePayDebt(customer.id, customer.id)} title="Bayar Hutang">
                                                    💵
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mobile-card-list">
                {filteredCustomers.map(customer => {
                    const colors = memberColors(customer.member_level)
                    return (
                        <div key={customer.id} className="mobile-card" style={{ borderLeft: customer.total_debt > 0 ? '4px solid var(--danger)' : '1px solid var(--border)' }}>
                            <div className="mobile-card-header">
                                <div className="user-cell">
                                    <div className="user-avatar-small" style={colors}>{memberEmoji(customer.member_level)}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 600 }}>{customer.name}</span>
                                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>{customer.phone || '-'}</span>
                                    </div>
                                </div>
                                <span className={`status-badge status-${customer.member_level.toLowerCase()}`}>{customer.member_level}</span>
                            </div>

                            <div className="mobile-card-row">
                                <span className="mobile-card-label">Total Belanja</span>
                                <span className="mobile-card-value">Rp {customer.total_spent.toLocaleString()}</span>
                            </div>

                            <div className="mobile-card-row">
                                <span className="mobile-card-label">Poin Loyalty</span>
                                <span className="mobile-card-value">{customer.points} ⭐</span>
                            </div>

                            {customer.total_debt > 0 && (
                                <div className="mobile-card-row" style={{ marginTop: '8px', color: 'var(--danger)', fontWeight: 'bold' }}>
                                    <span>⚠️ Hutang</span>
                                    <span>Rp {customer.total_debt.toLocaleString()}</span>
                                </div>
                            )}

                            <div className="mobile-card-actions">
                                <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(customer)}>✏️ Edit</button>
                                {customer.total_debt > 0 && (
                                    <button className="btn btn-success btn-sm" onClick={() => handlePayDebt(customer.id, customer.id)}>💵 Bayar Hutang</button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </>
    )
}

export default CustomersTableSection
