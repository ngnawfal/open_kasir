import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import AccessDenied from '../components/common/AccessDenied'
import PageLoading from '../components/common/PageLoading'
import DiscountsToolbar from '../components/discounts/DiscountsToolbar'
import DiscountCardsGrid from '../components/discounts/DiscountCardsGrid'
import DiscountFormModal from '../components/discounts/DiscountFormModal'
import { deleteDiscount, fetchDiscountsPublic, saveDiscount, toggleDiscountStatus } from '../services/discountsApi'

function DiscountsPage() {
    const { authFetch, isAdmin } = useAuth()
    const { notify, confirm } = useUI()
    const [discounts, setDiscounts] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [selectedDiscount, setSelectedDiscount] = useState(null)
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        discount_type: 'percentage',
        value: '',
        min_purchase: '',
        max_discount: '',
        valid_until: '',
        usage_limit: ''
    })

    useEffect(() => {
        fetchDiscounts()
    }, [])

    const fetchDiscounts = async () => {
        try {
            setDiscounts(await fetchDiscountsPublic())
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatRupiah = (amount) => `Rp ${amount.toLocaleString('id-ID')}`

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const response = await saveDiscount(authFetch, {
                code: formData.code,
                name: formData.name,
                discount_type: formData.discount_type,
                value: parseInt(formData.value),
                min_purchase: parseInt(formData.min_purchase) || 0,
                max_discount: formData.max_discount ? parseInt(formData.max_discount) : null,
                valid_until: formData.valid_until || null,
                usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null
            }, selectedDiscount?.id)

            if (response.ok) {
                fetchDiscounts()
                resetForm()
            } else {
                const error = await response.json()
                notify({ type: 'error', title: 'Gagal menyimpan diskon', message: error.detail })
            }
        } catch (error) {
            notify({ type: 'error', title: 'Gagal menyimpan diskon', message: error.message })
        }
    }

    const handleEdit = (discount) => {
        setSelectedDiscount(discount)
        setFormData({
            code: discount.code,
            name: discount.name,
            discount_type: discount.discount_type,
            value: discount.value.toString(),
            min_purchase: discount.min_purchase.toString(),
            max_discount: discount.max_discount?.toString() || '',
            valid_until: discount.valid_until?.split('T')[0] || '',
            usage_limit: discount.usage_limit?.toString() || ''
        })
        setShowForm(true)
    }

    const handleDelete = async (id) => {
        if (!(await confirm({ title: 'Hapus diskon?', description: 'Diskon yang dihapus tidak bisa dipakai lagi.', confirmText: 'Hapus', tone: 'danger' }))) return

        try {
            const response = await deleteDiscount(authFetch, id)
            if (response.ok) {
                fetchDiscounts()
            }
        } catch (error) {
            console.error('Error:', error)
        }
    }

    const toggleActive = async (discount) => {
        try {
            const response = await toggleDiscountStatus(authFetch, discount.id, !discount.is_active)
            if (response.ok) {
                fetchDiscounts()
            }
        } catch (error) {
            console.error('Error:', error)
        }
    }

    const resetForm = () => {
        setShowForm(false)
        setSelectedDiscount(null)
        setFormData({
            code: '',
            name: '',
            discount_type: 'percentage',
            value: '',
            min_purchase: '',
            max_discount: '',
            valid_until: '',
            usage_limit: ''
        })
    }

    if (!isAdmin) {
        return <AccessDenied message="Halaman ini hanya untuk Admin" />
    }

    if (loading) {
        return <PageLoading />
    }

    return (
        <div className="page-container admin-page-shell discounts-page-shell">
            <DiscountsToolbar setShowForm={setShowForm} />
            <DiscountCardsGrid discounts={discounts} formatRupiah={formatRupiah} toggleActive={toggleActive} handleEdit={handleEdit} handleDelete={handleDelete} />
            <DiscountFormModal showForm={showForm} selectedDiscount={selectedDiscount} resetForm={resetForm} handleSubmit={handleSubmit} formData={formData} setFormData={setFormData} />
        </div>
    )
}

export default DiscountsPage
