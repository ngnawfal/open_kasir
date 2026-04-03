export const ROUTES = {
    login: '/login',
    cashier: '/',
    products: '/products',
    inventory: '/inventory',
    customers: '/customers',
    users: '/users',
    discounts: '/discounts',
    reports: '/reports',
    history: '/history',
}

export function getNavItems(isAdmin) {
    return [
        { key: 'cashier', path: ROUTES.cashier, label: 'Kasir', icon: 'cashier' },
        ...(isAdmin ? [
            { key: 'products', path: ROUTES.products, label: 'Produk', icon: 'products' },
            { key: 'inventory', path: ROUTES.inventory, label: 'Stok', icon: 'inventory' },
            { key: 'customers', path: ROUTES.customers, label: 'Pelanggan', icon: 'customers' },
            { key: 'users', path: ROUTES.users, label: 'User', icon: 'users' },
            { key: 'discounts', path: ROUTES.discounts, label: 'Diskon', icon: 'discounts' },
            { key: 'reports', path: ROUTES.reports, label: 'Laporan', icon: 'reports' },
        ] : []),
        { key: 'history', path: ROUTES.history, label: 'Riwayat', icon: 'history' },
    ]
}

export function getPageKeyFromPath(pathname) {
    const entries = Object.entries(ROUTES).filter(([key]) => key !== 'login')
    const matched = entries.find(([, path]) => path === pathname)
    return matched ? matched[0] : 'cashier'
}
