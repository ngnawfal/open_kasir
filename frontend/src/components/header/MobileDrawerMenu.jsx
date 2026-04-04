import { NavLink } from 'react-router-dom'

function MobileDrawerMenu({ mobileMenuOpen, toggleMobileMenu, navItems, iconMap, user, cartCount, isDark, toggleTheme, logout, CrownIcon, UserIcon, XIcon, SunIcon, MoonIcon, LogOutIcon }) {
    if (!mobileMenuOpen) return null

    return (
        <>
            <div className="mobile-menu-overlay" onClick={toggleMobileMenu}></div>
            <div className="mobile-menu-drawer">
                <div className="mobile-menu-header">
                    <div className="mobile-user-avatar">
                        {user?.role === 'admin' ? <CrownIcon size={24} /> : <UserIcon size={24} />}
                    </div>
                    <div className="mobile-user-info">
                        <div className="mobile-user-name">{user?.full_name}</div>
                        <div className="mobile-user-role">{user?.role === 'admin' ? 'Administrator' : 'Kasir'}</div>
                    </div>
                    <button className="mobile-menu-close" onClick={toggleMobileMenu} aria-label="Close Menu"><XIcon size={20} /></button>
                </div>

                <nav className="mobile-menu-nav">
                    {navItems.map((item) => {
                        const IconComponent = iconMap[item.icon]
                        return (
                            <NavLink key={item.key} className={({ isActive }) => `mobile-menu-item ${isActive ? 'active' : ''}`} to={item.path} onClick={toggleMobileMenu}>
                                <span className="nav-icon"><IconComponent size={20} strokeWidth={2} /></span>
                                <span className="nav-label">{item.label}</span>
                                {item.key === 'cashier' && cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                            </NavLink>
                        )
                    })}
                </nav>

                <div className="mobile-menu-footer">
                    <button className="mobile-menu-item" onClick={toggleTheme}>
                        <span className="nav-icon">{isDark ? <SunIcon size={20} /> : <MoonIcon size={20} />}</span>
                        <span className="nav-label">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                    <button className="mobile-menu-item logout" onClick={() => { logout(); toggleMobileMenu() }}>
                        <span className="nav-icon"><LogOutIcon size={20} /></span>
                        <span className="nav-label">Logout</span>
                    </button>
                </div>
            </div>
        </>
    )
}

export default MobileDrawerMenu
