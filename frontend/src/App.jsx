import { lazy, Suspense, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { UIProvider, useUI } from './context/UIContext'
import { ThemeProvider } from './context/ThemeContext'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import PageLoading from './components/common/PageLoading'
import RequireAuth from './components/routing/RequireAuth'
import RequireAdmin from './components/routing/RequireAdmin'
import { ROUTES, getPageKeyFromPath } from './config/routes'
import { useProducts } from './hooks/useProducts'
import { useCart } from './hooks/useCart'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const CashierPage = lazy(() => import('./pages/CashierPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const InventoryPage = lazy(() => import('./pages/InventoryPage'))
const DiscountsPage = lazy(() => import('./pages/DiscountsPage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const CustomersPage = lazy(() => import('./pages/CustomersPage'))
const UsersPage = lazy(() => import('./pages/UsersPage'))

function PageFallback() {
    return <PageLoading compact />
}

function AuthenticatedShell() {
    const location = useLocation()
    const { notify } = useUI()
    const currentPage = getPageKeyFromPath(location.pathname)

    // Sidebar collapsed state - synced with Header
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebarCollapsed')
        return saved === 'true'
    })

    const { products, fetchProducts } = useProducts(true)
    const { cart, addToCart, updateQuantity, clearCart, cartTotal, cartCount } = useCart(products, notify)

    return (
        <div className="app">
            <Header
                cartCount={cartCount}
                sidebarCollapsed={sidebarCollapsed}
                onSidebarToggle={setSidebarCollapsed}
            />
            <div className={`app-content page-${currentPage} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <main className={`main-content page-${currentPage}`}>
                    <Suspense fallback={<PageFallback />}>
                        <Routes>
                            <Route path={ROUTES.cashier} element={<CashierPage products={products} cart={cart} cartTotal={cartTotal} cartCount={cartCount} addToCart={addToCart} updateQuantity={updateQuantity} clearCart={clearCart} fetchProducts={fetchProducts} />} />
                            <Route path={ROUTES.products} element={<RequireAdmin><AdminPage products={products} onProductsChange={fetchProducts} /></RequireAdmin>} />
                            <Route path={ROUTES.inventory} element={<RequireAdmin><InventoryPage /></RequireAdmin>} />
                            <Route path={ROUTES.discounts} element={<RequireAdmin><DiscountsPage /></RequireAdmin>} />
                            <Route path={ROUTES.reports} element={<RequireAdmin><ReportsPage /></RequireAdmin>} />
                            <Route path={ROUTES.history} element={<HistoryPage />} />
                            <Route path={ROUTES.customers} element={<RequireAdmin><CustomersPage /></RequireAdmin>} />
                            <Route path={ROUTES.users} element={<RequireAdmin><UsersPage /></RequireAdmin>} />
                            <Route path="*" element={<Navigate to={ROUTES.cashier} replace />} />
                        </Routes>
                    </Suspense>
                </main>
            </div>
        </div>
    )
}

function AppContent() {
    const { isAuthenticated, loading } = useAuth()

    if (loading) {
        return <div className="app app-loading-shell"><div className="spinner"></div></div>
    }

    return (
        <Routes>
            <Route
                path={ROUTES.login}
                element={isAuthenticated ? <Navigate to={ROUTES.cashier} replace /> : <Suspense fallback={<PageFallback />}><LoginPage /></Suspense>}
            />
            <Route element={<RequireAuth />}>
                <Route path="/*" element={<AuthenticatedShell />} />
            </Route>
        </Routes>
    )
}

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <UIProvider>
                    <BrowserRouter>
                        <AppContent />
                    </BrowserRouter>
                </UIProvider>
            </AuthProvider>
        </ThemeProvider>
    )
}

export default App
