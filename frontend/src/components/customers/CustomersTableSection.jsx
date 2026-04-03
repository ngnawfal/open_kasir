function memberTone(memberLevel) {
    if (memberLevel === 'Gold') return 'gold'
    if (memberLevel === 'Silver') return 'silver'
    return 'bronze'
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
                            const tone = memberTone(customer.member_level)
                            return (
                                <tr key={customer.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className={`user-avatar-small member-avatar ${tone}`}>
                                                {memberEmoji(customer.member_level)}
                                            </div>
                                            <div>
                                                <div className="font-semibold">{customer.name}</div>
                                                <div className="text-muted customer-id-text">ID: #{customer.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="customer-contact-stack">
                                            <span className="text-muted">📱 {customer.phone || '-'}</span>
                                            {customer.email && <span className="text-muted">📧 {customer.email}</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="customer-member-stack">
                                            <span className={`status-badge status-${customer.member_level.toLowerCase()}`}>
                                                {customer.member_level}
                                            </span>
                                            <span className="text-muted">⭐ {customer.points} Poin</span>
                                            <span className="text-muted">🛒 Rp {customer.total_spent.toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td>
                                        {customer.total_debt > 0 ? (
                                            <span className="status-badge status-inactive customer-debt-badge">
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
                    const tone = memberTone(customer.member_level)
                    return (
                        <div key={customer.id} className={`mobile-card customer-mobile-card ${customer.total_debt > 0 ? 'with-debt' : ''}`}>
                            <div className="mobile-card-header">
                                <div className="user-cell">
                                    <div className={`user-avatar-small member-avatar ${tone}`}>{memberEmoji(customer.member_level)}</div>
                                    <div className="mobile-stack-inline">
                                        <span className="font-semibold">{customer.name}</span>
                                        <span className="text-muted customer-phone-subtext">{customer.phone || '-'}</span>
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
                                <div className="mobile-card-row customer-debt-row">
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
