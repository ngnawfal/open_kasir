function Dialog({ title, description, onClose, footer, children, panelClassName = '' }) {
    return (
        <div className="ui-dialog-backdrop" onClick={onClose}>
            <div className={`ui-dialog-panel ${panelClassName}`.trim()} onClick={(e) => e.stopPropagation()}>
                <div className="ui-dialog-header">
                    <div>
                        {title && <h3 className="ui-dialog-title">{title}</h3>}
                        {description && <p className="ui-dialog-description">{description}</p>}
                    </div>
                    <button className="ui-dialog-close" onClick={onClose} aria-label="Tutup dialog">×</button>
                </div>
                <div className="ui-dialog-body">{children}</div>
                {footer && <div className="ui-dialog-footer">{footer}</div>}
            </div>
        </div>
    )
}

export default Dialog
