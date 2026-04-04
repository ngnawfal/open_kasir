export async function fetchTransactions(authFetch, filter) {
    let url = '/api/transactions?limit=100'
    if (filter.payment_method) url += `&payment_method=${filter.payment_method}`
    if (filter.date_from) url += `&date_from=${filter.date_from}`
    if (filter.date_to) url += `&date_to=${filter.date_to}`

    const response = await authFetch(url)
    return response.json()
}
