import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { PageTitle } from '../components/PageTitle'
import AccessDenied from '../components/common/AccessDenied'
import PageLoading from '../components/common/PageLoading'
import ReportsSummaryOverview from '../components/reports/ReportsSummaryOverview'
import ReportsExportPanel from '../components/reports/ReportsExportPanel'
import ReportsTabNav from '../components/reports/ReportsTabNav'
import DailyReportPanel from '../components/reports/DailyReportPanel'
import MonthlyReportPanel from '../components/reports/MonthlyReportPanel'
import BestSellersPanel from '../components/reports/BestSellersPanel'

function ReportsPage() {
    const { authFetch, isAdmin } = useAuth()
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('daily')
    const [dailyReport, setDailyReport] = useState(null)
    const [monthlyReport, setMonthlyReport] = useState(null)
    const [bestSellers, setBestSellers] = useState(null)
    const [summary, setSummary] = useState(null)
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

    useEffect(() => {
        if (isAdmin) {
            fetchReports()
        }
    }, [isAdmin])

    const fetchReports = async () => {
        try {
            const [summaryRes, dailyRes, monthlyRes, sellersRes] = await Promise.all([
                authFetch('/api/reports/summary'),
                authFetch(`/api/reports/daily?date=${selectedDate}`),
                authFetch('/api/reports/monthly'),
                authFetch('/api/reports/best-sellers')
            ])

            if (summaryRes.ok) setSummary(await summaryRes.json())
            if (dailyRes.ok) setDailyReport(await dailyRes.json())
            if (monthlyRes.ok) setMonthlyReport(await monthlyRes.json())
            if (sellersRes.ok) setBestSellers(await sellersRes.json())
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchDailyReport = async (date) => {
        try {
            const response = await authFetch(`/api/reports/daily?date=${date}`)
            if (response.ok) {
                setDailyReport(await response.json())
            }
        } catch (error) {
            console.error('Error:', error)
        }
    }

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value)
        fetchDailyReport(e.target.value)
    }

    const exportExcel = async (endpoint, filename) => {
        try {
            const response = await authFetch(endpoint)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = filename
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            } else {
                alert('Gagal export data')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error saat export: ' + error.message)
        }
    }

    const formatRupiah = (amount) => `Rp ${amount?.toLocaleString('id-ID') || 0}`

    if (!isAdmin) {
        return <AccessDenied message="Halaman ini hanya untuk Admin" />
    }

    if (loading) {
        return <PageLoading />
    }

    return (
        <div className="page-container admin-page-shell reports-page-shell">
            <PageTitle
                title="Laporan & Analitik"
                subtitle="Dashboard laporan keuangan dan performa bisnis"
            />

            <ReportsSummaryOverview summary={summary} formatRupiah={formatRupiah} />

            <ReportsExportPanel exportExcel={exportExcel} />

            <ReportsTabNav activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === 'daily' && <DailyReportPanel dailyReport={dailyReport} selectedDate={selectedDate} handleDateChange={handleDateChange} formatRupiah={formatRupiah} />}

            {activeTab === 'monthly' && <MonthlyReportPanel monthlyReport={monthlyReport} formatRupiah={formatRupiah} />}

            {activeTab === 'bestsellers' && <BestSellersPanel bestSellers={bestSellers} formatRupiah={formatRupiah} />}
        </div>
    )
}

export default ReportsPage
