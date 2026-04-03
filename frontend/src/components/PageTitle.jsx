// Reusable Page Title Component with Vertical Accent Bar

export function PageTitle({ title, subtitle }) {
    return (
        <div className="page-header">
            <div className="page-title-group">
                <div className="page-title-accent"></div>
                <div>
                    <h1 className="page-title">{title}</h1>
                    {subtitle && <p className="page-subtitle">{subtitle}</p>}
                </div>
            </div>
        </div>
    )
}
