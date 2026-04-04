export async function loginRequest(username, password) {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Login gagal')
    }

    return response.json()
}

export async function authenticatedRequest(url, token, logout, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(url, { ...options, headers })

    if (response.status === 401) {
        logout()
        throw new Error('Sesi telah berakhir')
    }

    return response
}
