import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import Dialog from '../components/ui/Dialog'

const UIContext = createContext(null)

export function UIProvider({ children }) {
    const toastIdRef = useRef(0)
    const [toasts, setToasts] = useState([])
    const [confirmState, setConfirmState] = useState(null)
    const [promptState, setPromptState] = useState(null)
    const [promptValue, setPromptValue] = useState('')

    const dismissToast = useCallback((id) => {
        setToasts((current) => current.filter((toast) => toast.id !== id))
    }, [])

    const notify = useCallback((input) => {
        const payload = typeof input === 'string' ? { message: input } : input
        const id = ++toastIdRef.current
        const toast = {
            id,
            type: payload.type || 'info',
            title: payload.title || '',
            message: payload.message || '',
            duration: payload.duration ?? 3200,
        }

        setToasts((current) => [...current, toast])

        if (toast.duration > 0) {
            window.setTimeout(() => dismissToast(id), toast.duration)
        }
    }, [dismissToast])

    const confirm = useCallback((options) => new Promise((resolve) => {
        setConfirmState({
            title: options?.title || 'Konfirmasi aksi',
            description: options?.description || options?.message || '',
            confirmText: options?.confirmText || 'Lanjutkan',
            cancelText: options?.cancelText || 'Batal',
            tone: options?.tone || 'primary',
            resolve,
        })
    }), [])

    const prompt = useCallback((options) => new Promise((resolve) => {
        setPromptValue(options?.initialValue || '')
        setPromptState({
            title: options?.title || 'Masukkan nilai',
            description: options?.description || options?.message || '',
            placeholder: options?.placeholder || '',
            inputType: options?.inputType || 'text',
            confirmText: options?.confirmText || 'Simpan',
            cancelText: options?.cancelText || 'Batal',
            resolve,
        })
    }), [])

    const closeConfirm = useCallback((result) => {
        setConfirmState((current) => {
            if (current?.resolve) current.resolve(result)
            return null
        })
    }, [])

    const closePrompt = useCallback((result) => {
        setPromptState((current) => {
            if (current?.resolve) current.resolve(result)
            return null
        })
        setPromptValue('')
    }, [])

    const value = useMemo(() => ({ notify, confirm, prompt }), [notify, confirm, prompt])

    return (
        <UIContext.Provider value={value}>
            {children}

            <div className="ui-toast-stack" aria-live="polite">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`ui-toast ${toast.type}`}>
                        <div className="ui-toast-copy">
                            {toast.title && <strong>{toast.title}</strong>}
                            <span>{toast.message}</span>
                        </div>
                        <button className="ui-toast-close" onClick={() => dismissToast(toast.id)}>×</button>
                    </div>
                ))}
            </div>

            {confirmState && (
                <Dialog
                    title={confirmState.title}
                    description={confirmState.description}
                    onClose={() => closeConfirm(false)}
                    footer={
                        <>
                            <button className="btn btn-ghost" onClick={() => closeConfirm(false)}>{confirmState.cancelText}</button>
                            <button className={`btn ${confirmState.tone === 'danger' ? 'btn-danger' : 'btn-primary'}`} onClick={() => closeConfirm(true)}>{confirmState.confirmText}</button>
                        </>
                    }
                />
            )}

            {promptState && (
                <Dialog
                    title={promptState.title}
                    description={promptState.description}
                    onClose={() => closePrompt(null)}
                    footer={
                        <>
                            <button className="btn btn-ghost" onClick={() => closePrompt(null)}>{promptState.cancelText}</button>
                            <button className="btn btn-primary" onClick={() => closePrompt(promptValue)} disabled={!String(promptValue).trim()}>{promptState.confirmText}</button>
                        </>
                    }
                >
                    <input
                        type={promptState.inputType}
                        className="form-input ui-prompt-input"
                        placeholder={promptState.placeholder}
                        value={promptValue}
                        onChange={(e) => setPromptValue(e.target.value)}
                        autoFocus
                    />
                </Dialog>
            )}
        </UIContext.Provider>
    )
}

export function useUI() {
    const context = useContext(UIContext)
    if (!context) {
        throw new Error('useUI must be used within UIProvider')
    }
    return context
}

export default UIContext
