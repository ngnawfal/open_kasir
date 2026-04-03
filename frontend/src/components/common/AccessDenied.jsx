function AccessDenied({ title = 'Akses Ditolak', message = 'Halaman ini tidak tersedia untuk akun ini' }) {
    return (
        <div className="access-denied-state">
            <span className="access-denied-icon">🔒</span>
            <h2 className="mt-md">{title}</h2>
            <p className="text-muted">{message}</p>
        </div>
    )
}

export default AccessDenied
