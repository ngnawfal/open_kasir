import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import PageLoading from '../components/common/PageLoading'
import CustomersSummaryCards from '../components/customers/CustomersSummaryCards'
import CustomersToolbar from '../components/customers/CustomersToolbar'
import CustomersTableSection from '../components/customers/CustomersTableSection'
import CustomerFormModal from '../components/customers/CustomerFormModal'

function CustomersPage() {
    const { authFetch } = useAuth()
    const { notify, prompt } = useUI()
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [showDebtOnly, setShowDebtOnly] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: ''
    })

    useEffect(() => {
        loadCustomers()
    }, [showDebtOnly])

    const loadCustomers = async () => {
        try {
            const url = showDebtOnly
                ? '/api/customers?has_debt=true'
                : '/api/customers'
            const response = await authFetch(url)
            if (response.ok) {
                const data = await response.json()
                setCustomers(data)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const url = selectedCustomer
                ? `/api/customers/${selectedCustomer.id}`
                : '/api/customers'
            const response = await authFetch(url, {
                method: selectedCustomer ? 'PUT' : 'POST',
                body: JSON.stringify(formData)
            })
            if (response.ok) {
                loadCustomers()
                resetForm()
            } else {
                const error = await response.json()
                notify({ type: 'error', title: 'Gagal menyimpan pelanggan', message: error.detail })
            }
        } catch (error) {
            notify({ type: 'error', title: 'Gagal menyimpan pelanggan', message: error.message })
        }
    }

    const handleEdit = (customer) => {
        setSelectedCustomer(customer)
        setFormData({
            name: customer.name,
            phone: customer.phone || '',
            email: customer.email || '',
            address: customer.address || ''
        })
        setShowForm(true)
    }

    const resetForm = () => {
        setShowForm(false)
        setSelectedCustomer(null)
        setFormData({ name: '', phone: '', email: '', address: '' })
    }

    const handlePayDebt = async (customerId, debtId) => {
        const amount = await prompt({
            title: 'Pembayaran hutang',
            description: 'Masukkan jumlah pembayaran pelanggan.',
            placeholder: 'Jumlah pembayaran',
            inputType: 'number',
            confirmText: 'Bayar',
        })
        if (!amount) return

        try {
            const response = await authFetch(`/api/customers/${customerId}/debts/${debtId}/pay`, {
                method: 'POST',
                body: JSON.stringify({ amount: parseInt(amount) })
            })
            if (response.ok) {
                loadCustomers()
                notify({ type: 'success', title: 'Pembayaran berhasil', message: 'Hutang pelanggan berhasil dibayar.' })
            } else {
                const error = await response.json()
                notify({ type: 'error', title: 'Pembayaran gagal', message: error.detail })
            }
        } catch (error) {
            notify({ type: 'error', title: 'Pembayaran gagal', message: error.message })
        }
    }

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone && c.phone.includes(searchQuery))
    )

    const totalDebt = customers.reduce((sum, c) => sum + (c.total_debt || 0), 0)

    if (loading) {
        return <PageLoading />
    }

    return (
        <div className="page-container admin-page-shell">
            <CustomersToolbar
                setShowForm={setShowForm}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                showDebtOnly={showDebtOnly}
                setShowDebtOnly={setShowDebtOnly}
            />

            <CustomersSummaryCards customers={customers} totalDebt={totalDebt} />

            <CustomersTableSection
                filteredCustomers={filteredCustomers}
                handleEdit={handleEdit}
                handlePayDebt={handlePayDebt}
            />

            <CustomerFormModal
                showForm={showForm}
                selectedCustomer={selectedCustomer}
                resetForm={resetForm}
                handleSubmit={handleSubmit}
                formData={formData}
                setFormData={setFormData}
            />
        </div>
    )
}

export default CustomersPage
