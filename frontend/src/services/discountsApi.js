export async function fetchDiscountsPublic() {
    const response = await fetch('/api/discounts')
    return response.json()
}

export async function saveDiscount(authFetch, payload, discountId = null) {
    return authFetch(discountId ? `/api/discounts/${discountId}` : '/api/discounts', {
        method: discountId ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
    })
}

export async function deleteDiscount(authFetch, discountId) {
    return authFetch(`/api/discounts/${discountId}`, { method: 'DELETE' })
}

export async function toggleDiscountStatus(authFetch, discountId, isActive) {
    return authFetch(`/api/discounts/${discountId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: isActive })
    })
}
