import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import PageLoading from '../common/PageLoading'
import { ROUTES } from '../../config/routes'

function RequireAuth() {
    const { isAuthenticated, loading } = useAuth()
    const location = useLocation()

    if (loading) return <PageLoading />
    if (!isAuthenticated) return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />

    return <Outlet />
}

export default RequireAuth
