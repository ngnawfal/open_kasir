const TOKEN_KEY = 'token'
const USER_KEY = 'user'

export function loadStoredAuth() {
    const token = localStorage.getItem(TOKEN_KEY)
    const user = localStorage.getItem(USER_KEY)

    if (!token || !user) return { token: null, user: null }

    try {
        return { token, user: JSON.parse(user) }
    } catch {
        clearStoredAuth()
        return { token: null, user: null }
    }
}

export function saveStoredAuth(token, user) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearStoredAuth() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
}
