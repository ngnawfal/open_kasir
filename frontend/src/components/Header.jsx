import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { getNavItems } from '../config/routes'
import DesktopSidebar from './header/DesktopSidebar'
import MobileHeaderBar from './header/MobileHeaderBar'
import MobileDrawerMenu from './header/MobileDrawerMenu'
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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    const toggleSidebar = () => onSidebarToggle?.(!sidebarCollapsed)
    const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen)

    return (
        <>
            <DesktopSidebar
                navItems={navItems}
                iconMap={iconMap}
                cartCount={cartCount}
                sidebarCollapsed={sidebarCollapsed}
                toggleSidebar={toggleSidebar}
                user={user}
                isDark={isDark}
                toggleTheme={toggleTheme}
                logout={logout}
                ChevronRightIcon={ChevronRight}
                ChevronLeftIcon={ChevronLeft}
                CrownIcon={Crown}
                UserIcon={UserIcon}
                SunIcon={Sun}
                MoonIcon={Moon}
                LogOutIcon={LogOut}
            />
            <MobileHeaderBar toggleMobileMenu={toggleMobileMenu} cartCount={cartCount} />
            <MobileDrawerMenu
                mobileMenuOpen={mobileMenuOpen}
                toggleMobileMenu={toggleMobileMenu}
                navItems={navItems}
                iconMap={iconMap}
                user={user}
                cartCount={cartCount}
                isDark={isDark}
                toggleTheme={toggleTheme}
                logout={logout}
                CrownIcon={Crown}
                UserIcon={UserIcon}
                XIcon={X}
                SunIcon={Sun}
                MoonIcon={Moon}
                LogOutIcon={LogOut}
            />
        </>
    )
}

export default Header
