export async function fetchCustomers(authFetch, options = {}) {
    const url = options.hasDebt ? '/api/customers?has_debt=true' : '/api/customers'
    const response = await authFetch(url)
    return response.json()
}

export async function saveCustomer(authFetch, payload, customerId = null) {
    return authFetch(customerId ? `/api/customers/${customerId}` : '/api/customers', {
        method: customerId ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
    })
}

export async function payCustomerDebt(authFetch, customerId, debtId, amount) {
    return authFetch(`/api/customers/${customerId}/debts/${debtId}/pay`, {
        method: 'POST',
        body: JSON.stringify({ amount })
    })
}
