function PageLoading({ compact = false }) {
    return (
        <div className={`page-loading-state ${compact ? 'compact' : ''}`}>
            <div className="spinner"></div>
        </div>
    )
}

export default PageLoading
