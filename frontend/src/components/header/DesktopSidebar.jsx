import { Link, NavLink } from 'react-router-dom'
import { ROUTES } from '../../config/routes'

function DesktopSidebar({ navItems, iconMap, cartCount, sidebarCollapsed, toggleSidebar, user, isDark, toggleTheme, logout, ChevronRightIcon, ChevronLeftIcon, CrownIcon, UserIcon, SunIcon, MoonIcon, LogOutIcon }) {
    return (
        <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <Link className="sidebar-logo clickable-logo" to={ROUTES.cashier}>
                    <img src="/kasirzcuu-logo.svg" alt="KasirzCuu" />
                </Link>
                <button className="sidebar-toggle-btn" onClick={toggleSidebar} title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}>
                    {sidebarCollapsed ? <ChevronRightIcon size={20} /> : <ChevronLeftIcon size={20} />}
                </button>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    const IconComponent = iconMap[item.icon]
                    return (
                        <NavLink key={item.key} className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`} to={item.path} title={sidebarCollapsed ? item.label : ''}>
                            <span className="nav-icon"><IconComponent size={20} strokeWidth={2} /></span>
                            <span className="nav-label">{item.label}</span>
                            {item.key === 'cashier' && cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                        </NavLink>
                    )
                })}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-user-avatar">
                        {user?.role === 'admin' ? <CrownIcon size={20} /> : <UserIcon size={20} />}
                    </div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{user?.full_name}</div>
                        <div className="sidebar-user-role">{user?.role === 'admin' ? 'Administrator' : 'Kasir'}</div>
                    </div>
                </div>

                <div className="sidebar-actions">
                    <button className="sidebar-action-btn" onClick={toggleTheme} title={isDark ? 'Light Mode' : 'Dark Mode'}>
                        {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
                    </button>
                    <button className="sidebar-action-btn logout" onClick={logout} title="Logout">
                        <LogOutIcon size={18} />
                    </button>
                </div>
            </div>
        </aside>
    )
}

export default DesktopSidebar
