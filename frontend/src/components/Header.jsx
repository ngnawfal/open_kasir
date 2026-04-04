import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ROUTES, getNavItems } from '../config/routes'
import {
    ShoppingCart,
    Package,
    BarChart3,
    Users,
    UserCog,
    Tag,
    TrendingUp,
    History,
    Crown,
    User as UserIcon,
    Moon,
    Sun,
    LogOut,
    ChevronLeft,
    ChevronRight,
    X
} from 'lucide-react'

function Header({ cartCount, sidebarCollapsed, onSidebarToggle }) {
    const { user, logout, isAdmin } = useAuth()
    const { toggleTheme, isDark } = useTheme()
    const location = useLocation()

    // Mobile menu state
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    // Save sidebar state to localStorage when it changes
    useEffect(() => {
        if (sidebarCollapsed !== undefined) {
            localStorage.setItem('sidebarCollapsed', sidebarCollapsed)
        }
    }, [sidebarCollapsed])

    const iconMap = {
        cashier: ShoppingCart,
        products: Package,
        inventory: BarChart3,
        customers: Users,
        users: UserCog,
        discounts: Tag,
        reports: TrendingUp,
        history: History,
    }

    const navItems = getNavItems(isAdmin)

    const closeMobileMenu = () => setMobileMenuOpen(false)

    const toggleSidebar = () => {
        if (onSidebarToggle) {
            onSidebarToggle(!sidebarCollapsed)
        }
    }

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen)
    }

    return (
        <>
            {/* DESKTOP: Sidebar Navigation */}
            <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                {/* Sidebar Header */}
                <div className="sidebar-header">
                    <Link className="sidebar-logo clickable-logo" to={ROUTES.cashier}>
                        <img
                            src="/kasirzcuu-logo.svg"
                            alt="KasirzCuu"
                        />
                    </Link>
                    <button
                        className="sidebar-toggle-btn"
                        onClick={toggleSidebar}
                        title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    >
                        {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>

                {/* Sidebar Navigation Items */}
                <nav className="sidebar-nav">
                    {navItems.map(item => {
                        const IconComponent = iconMap[item.icon]
                        return (
                            <NavLink
                                key={item.key}
                                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                                to={item.path}
                                title={sidebarCollapsed ? item.label : ''}
                            >
                                <span className="nav-icon">
                                    <IconComponent size={20} strokeWidth={2} />
                                </span>
                                <span className="nav-label">{item.label}</span>
                                {item.key === 'cashier' && cartCount > 0 && (
                                    <span className="cart-badge">{cartCount}</span>
                                )}
                            </NavLink>
                        )
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className="sidebar-footer">
                    {/* User Info */}
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">
                            {user?.role === 'admin' ? <Crown size={20} /> : <UserIcon size={20} />}
                        </div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{user?.full_name}</div>
                            <div className="sidebar-user-role">
                                {user?.role === 'admin' ? 'Administrator' : 'Kasir'}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="sidebar-actions">
                        <button
                            className="sidebar-action-btn"
                            onClick={toggleTheme}
                            title={isDark ? 'Light Mode' : 'Dark Mode'}
                        >
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button
                            className="sidebar-action-btn logout"
                            onClick={logout}
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* MOBILE: Top Header with Hamburger */}
            <header className="header mobile-only">
                <div className="header-container">
                    <button
                        className="hamburger-btn"
                        onClick={toggleMobileMenu}
                        aria-label="Menu"
                    >
                        <span className="hamburger-line"></span>
                        <span className="hamburger-line"></span>
                        <span className="hamburger-line"></span>
                    </button>

                    <Link className="logo clickable-logo" to={ROUTES.cashier}>
                        <img
                            src="/kasirzcuu-logo.svg"
                            alt="KasirzCuu"
                        />
                    </Link>

                    {cartCount > 0 && (
                        <div className="header-cart-badge">{cartCount}</div>
                    )}
                </div>
            </header>

            {/* MOBILE: Slide-out Drawer Menu */}
            {mobileMenuOpen && (
                <>
                    <div className="mobile-menu-overlay" onClick={toggleMobileMenu}></div>
                    <div className="mobile-menu-drawer">
                        {/* User Info Header with Close Button */}
                        <div className="mobile-menu-header">
                            <div className="mobile-user-avatar">
                                {user?.role === 'admin' ? <Crown size={24} /> : <UserIcon size={24} />}
                            </div>
                            <div className="mobile-user-info">
                                <div className="mobile-user-name">{user?.full_name}</div>
                                <div className="mobile-user-role">
                                    {user?.role === 'admin' ? 'Administrator' : 'Kasir'}
                                </div>
                            </div>
                            <button
                                className="mobile-menu-close"
                                onClick={toggleMobileMenu}
                                aria-label="Close Menu"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Menu Items */}
                        <nav className="mobile-menu-nav">
                            {navItems.map(item => {
                                const IconComponent = iconMap[item.icon]
                                return (
                                    <NavLink
                                        key={item.key}
                                        className={({ isActive }) => `mobile-menu-item ${isActive ? 'active' : ''}`}
                                        to={item.path}
                                        onClick={closeMobileMenu}
                                    >
                                        <span className="nav-icon">
                                            <IconComponent size={20} strokeWidth={2} />
                                        </span>
                                        <span className="nav-label">{item.label}</span>
                                        {item.key === 'cashier' && cartCount > 0 && (
                                            <span className="cart-badge">{cartCount}</span>
                                        )}
                                    </NavLink>
                                )
                            })}
                        </nav>

                        {/* Footer Actions */}
                        <div className="mobile-menu-footer">
                            <button className="mobile-menu-item" onClick={toggleTheme}>
                                <span className="nav-icon">
                                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                                </span>
                                <span className="nav-label">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                            </button>
                            <button className="mobile-menu-item logout" onClick={() => { logout(); setMobileMenuOpen(false); }}>
                                <span className="nav-icon">
                                    <LogOut size={20} />
                                </span>
                                <span className="nav-label">Logout</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}

export default Header
