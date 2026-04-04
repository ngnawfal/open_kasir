import { Link } from 'react-router-dom'
import { ROUTES } from '../../config/routes'

function MobileHeaderBar({ toggleMobileMenu, cartCount }) {
    return (
        <header className="header mobile-only">
            <div className="header-container">
                <button className="hamburger-btn" onClick={toggleMobileMenu} aria-label="Menu">
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                </button>

                <Link className="logo clickable-logo" to={ROUTES.cashier}>
                    <img src="/kasirzcuu-logo.svg" alt="KasirzCuu" />
                </Link>

                {cartCount > 0 && <div className="header-cart-badge">{cartCount}</div>}
            </div>
        </header>
    )
}

export default MobileHeaderBar
