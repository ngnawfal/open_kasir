export async function fetchUsers(authFetch) {
    const response = await authFetch('/api/users')
    return response.json()
}

export async function saveUser(authFetch, payload, userId = null) {
    return authFetch(userId ? `/api/users/${userId}` : '/api/users', {
        method: userId ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
    })
}

export async function resetUserPassword(authFetch, userId, newPassword) {
    return authFetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ new_password: newPassword })
    })
}

export async function updateUserStatus(authFetch, userId, isActive) {
    return authFetch(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: isActive })
    })
}
