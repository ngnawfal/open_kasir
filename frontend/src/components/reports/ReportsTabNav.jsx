function ReportsTabNav({ activeTab, setActiveTab }) {
    const tabs = [
        { id: 'daily', label: '📅 Harian' },
        { id: 'monthly', label: '📆 Bulanan' },
        { id: 'bestsellers', label: '🏆 Terlaris' },
    ]

    return (
        <div className="report-tabs">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                    onClick={() => setActiveTab(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    )
}

export default ReportsTabNav
