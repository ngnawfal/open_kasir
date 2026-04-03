import { PageTitle } from '../PageTitle'

function DiscountsToolbar({ setShowForm }) {
    return (
        <div className="admin-toolbar">
            <PageTitle
                title="Manajemen Diskon & Promo"
                subtitle="Kelola kode promo dan penawaran spesial"
            />
            <button onClick={() => setShowForm(true)} className="admin-toolbar-action warning">
                🏷️ Tambah Diskon
            </button>
        </div>
    )
}

export default DiscountsToolbar
