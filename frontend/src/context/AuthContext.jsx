import { createContext, useContext, useState, useEffect } from 'react'
import { loginRequest, authenticatedRequest } from '../services/authApi'
import { clearStoredAuth, loadStoredAuth, saveStoredAuth } from '../services/authStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(null)
    const [loading, setLoading] = useState(true)

    // Load from localStorage on mount
    useEffect(() => {
        const stored = loadStoredAuth()
        if (stored.token && stored.user) {
            setToken(stored.token)
            setUser(stored.user)
        }
        setLoading(false)
    }, [])

    const login = async (username, password) => {
        const data = await loginRequest(username, password)

        setToken(data.access_token)
        setUser(data.user)

        saveStoredAuth(data.access_token, data.user)

        return data.user
    }

    const logout = () => {
        setToken(null)
        setUser(null)
        clearStoredAuth()
    }

    const isAdmin = user?.role === 'admin'
    const isKasir = user?.role === 'kasir'
    const isAuthenticated = !!token

    // Helper for authenticated requests
    const authFetch = async (url, options = {}) => {
        return authenticatedRequest(url, token, logout, options)
    }

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        isAdmin,
        isKasir,
        isAuthenticated,
        authFetch
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}

export default AuthContext
