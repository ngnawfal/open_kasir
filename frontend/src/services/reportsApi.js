export async function fetchReportsBundle(authFetch, date) {
    const [summaryRes, dailyRes, monthlyRes, sellersRes] = await Promise.all([
        authFetch('/api/reports/summary'),
        authFetch(`/api/reports/daily?date=${date}`),
        authFetch('/api/reports/monthly'),
        authFetch('/api/reports/best-sellers')
    ])

    return {
        summaryRes,
        dailyRes,
        monthlyRes,
        sellersRes,
    }
}

export async function fetchDailyReport(authFetch, date) {
    return authFetch(`/api/reports/daily?date=${date}`)
}

export async function exportReportFile(authFetch, endpoint) {
    return authFetch(endpoint)
}
