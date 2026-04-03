import { lazy, Suspense, useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import PageLoading from './components/common/PageLoading'
import { ROUTES, getPageKeyFromPath } from './config/routes'

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
    const [cart, setCart] = useState([])
    const [products, setProducts] = useState([])
    const currentPage = getPageKeyFromPath(location.pathname)

    // Sidebar collapsed state - synced with Header
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebarCollapsed')
        return saved === 'true'
    })

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products')
            const data = await response.json()
            setProducts(data)
        } catch (error) {
            console.error('Error fetching products:', error)
        }
    }

    const addToCart = (product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id)
            if (existingItem) {
                // Check stock
                const currentQty = existingItem.quantity
                const availableStock = product.stock
                if (currentQty >= availableStock) {
                    alert(`Stok ${product.name} tidak cukup! Tersedia: ${availableStock}`)
                    return prevCart
                }
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...prevCart, { ...product, quantity: 1 }]
        })
    }

    const updateQuantity = (productId, newQuantity) => {
        setCart(prevCart => {
            // If quantity is 0 or less, remove item from cart
            if (newQuantity <= 0) {
                return prevCart.filter(item => item.id !== productId)
            }

            return prevCart.map(item => {
                if (item.id === productId) {
                    const product = products.find(p => p.id === productId)

                    // Check if new quantity exceeds stock
                    if (product && newQuantity > product.stock) {
                        alert(`Stok ${product.name} tidak cukup! Maksimal: ${product.stock}`)
                        return item // Keep current quantity
                    }

                    return { ...item, quantity: newQuantity }
                }
                return item
            })
        })
    }

    const clearCart = () => setCart([])

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

    // Show loading
    if (loading) {
        return (
            <div className="app app-loading-shell">
                <div className="spinner"></div>
            </div>
        )
    }

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
                            <Route path={ROUTES.products} element={<AdminPage products={products} onProductsChange={fetchProducts} />} />
                            <Route path={ROUTES.inventory} element={<InventoryPage />} />
                            <Route path={ROUTES.discounts} element={<DiscountsPage />} />
                            <Route path={ROUTES.reports} element={<ReportsPage />} />
                            <Route path={ROUTES.history} element={<HistoryPage />} />
                            <Route path={ROUTES.customers} element={<CustomersPage />} />
                            <Route path={ROUTES.users} element={<UsersPage />} />
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
            <Route
                path="/*"
                element={isAuthenticated ? <AuthenticatedShell /> : <Navigate to={ROUTES.login} replace />}
            />
        </Routes>
    )
}

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <AppContent />
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    )
}

export default App
