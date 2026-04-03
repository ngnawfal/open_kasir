import { PageTitle } from '../PageTitle'

function UsersToolbar({ setShowForm }) {
    return (
        <div className="admin-toolbar">
            <PageTitle title="Manajemen User" subtitle="Kelola akun kasir dan admin" />
            <button onClick={() => setShowForm(true)} className="admin-toolbar-action">➕ Tambah User</button>
        </div>
    )
}

export default UsersToolbar
