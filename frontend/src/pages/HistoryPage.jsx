import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { PageTitle } from '../components/PageTitle'
import PageLoading from '../components/common/PageLoading'
import HistorySummaryCards from '../components/history/HistorySummaryCards'
import HistoryFiltersCard from '../components/history/HistoryFiltersCard'
import TransactionHistoryList from '../components/history/TransactionHistoryList'
import { fetchTransactions } from '../services/transactionsApi'

function HistoryPage() {
    const { authFetch } = useAuth()
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedTransaction, setSelectedTransaction] = useState(null)
    const [filter, setFilter] = useState({
        payment_method: '',
        date_from: '',
        date_to: ''
    })

    useEffect(() => {
        fetchTransactions()
    }, [])

    const fetchTransactions = async () => {
        try {
            setTransactions(await fetchTransactions(authFetch, filter))
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatRupiah = (amount) => `Rp ${amount?.toLocaleString('id-ID') || 0}`

    const formatDate = (dateString) => new Date(dateString).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })

    const getTotalItems = (items) => items?.reduce((sum, item) => sum + item.quantity, 0) || 0

    const getPaymentIcon = (method) => {
        switch (method) {
            case 'cash': return '💵'
            case 'qris': return '📱'
            case 'debit':
            case 'credit': return '💳'
            default: return '💰'
        }
    }

    const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0)
    const totalTransactions = transactions.length
    const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

    if (loading) {
        return <PageLoading />
    }

    return (
        <div className="page-container admin-page-shell">
            <PageTitle
                title="Riwayat Transaksi"
                subtitle="Lihat dan cari riwayat transaksi penjualan"
            />

            <HistorySummaryCards
                totalTransactions={totalTransactions}
                totalRevenue={totalRevenue}
                avgTransaction={avgTransaction}
                formatRupiah={formatRupiah}
            />

            <HistoryFiltersCard filter={filter} setFilter={setFilter} fetchTransactions={fetchTransactions} />

            <TransactionHistoryList
                transactions={transactions}
                selectedTransaction={selectedTransaction}
                setSelectedTransaction={setSelectedTransaction}
                getPaymentIcon={getPaymentIcon}
                formatDate={formatDate}
                getTotalItems={getTotalItems}
                formatRupiah={formatRupiah}
            />
        </div>
    )
}

export default HistoryPage
