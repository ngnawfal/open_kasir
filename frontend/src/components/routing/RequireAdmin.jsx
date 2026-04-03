import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import PageLoading from '../common/PageLoading'
import { ROUTES } from '../../config/routes'

function RequireAdmin({ children }) {
    const { loading, isAdmin } = useAuth()

    if (loading) return <PageLoading />
    if (!isAdmin) return <Navigate to={ROUTES.cashier} replace />

    return children
}

export default RequireAdmin
