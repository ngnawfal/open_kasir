import { useState, useEffect, useRef, useCallback } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'

function BarcodeScanner({ onScan, isScanning, setIsScanning }) {
    const videoRef = useRef(null)
    const readerRef = useRef(null)
    const lastScannedRef = useRef(null)
    const lastScanTimeRef = useRef(0)
    const [error, setError] = useState(null)
    const [manualInput, setManualInput] = useState('')
    const [scanCount, setScanCount] = useState(0)
    const [status, setStatus] = useState('')

    // Debounced scan handler
    const handleScan = useCallback((decodedText) => {
        const now = Date.now()

        // Prevent accidental double scans within 500ms (but allow intentional re-scans)
        if (decodedText === lastScannedRef.current && now - lastScanTimeRef.current < 500) {
            return
        }

        lastScannedRef.current = decodedText
        lastScanTimeRef.current = now
        setScanCount(prev => prev + 1)

        // Play beep sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()
            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)
            oscillator.frequency.value = 1200
            oscillator.type = 'sine'
            gainNode.gain.value = 0.3
            oscillator.start()
            oscillator.stop(audioContext.currentTime + 0.15)
        } catch (e) { }

        onScan(decodedText)
    }, [onScan])

    useEffect(() => {
        let mounted = true

        const startScanner = async () => {
            try {
                setError(null)
                setStatus('Memulai kamera...')

                // Create reader
                if (!readerRef.current) {
                    readerRef.current = new BrowserMultiFormatReader()
                }

                // Get video devices
                const videoDevices = await readerRef.current.listVideoInputDevices()

                if (videoDevices.length === 0) {
                    setError('Tidak ada kamera yang ditemukan')
                    setIsScanning(false)
                    return
                }

                setStatus('Kamera aktif - Arahkan ke barcode')

                // Use back camera if available
                const backCamera = videoDevices.find(d =>
                    d.label.toLowerCase().includes('back') ||
                    d.label.toLowerCase().includes('belakang') ||
                    d.label.toLowerCase().includes('environment')
                ) || videoDevices[0]

                // Start decoding with video constraints for auto focus
                await readerRef.current.decodeFromVideoDevice(
                    backCamera.deviceId,
                    videoRef.current,
                    (result, error) => {
                        if (result && mounted) {
                            handleScan(result.getText())
                        }
                        // Ignore errors - they happen when no barcode is visible
                    }
                )

                // Apply auto focus to video stream
                if (videoRef.current && videoRef.current.srcObject) {
                    const stream = videoRef.current.srcObject
                    const track = stream.getVideoTracks()[0]
                    if (track) {
                        const capabilities = track.getCapabilities()
                        if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
                            try {
                                await track.applyConstraints({
                                    advanced: [{ focusMode: 'continuous' }]
                                })
                                console.log('✅ Auto focus enabled')
                            } catch (e) {
                                console.log('⚠️ Auto focus not supported:', e)
                            }
                        }
                    }
                }

            } catch (err) {
                console.error('Scanner error:', err)
                if (mounted) {
                    if (err.name === 'NotAllowedError') {
                        setError('Izin kamera ditolak. Buka pengaturan browser dan izinkan kamera.')
                    } else if (err.name === 'NotFoundError') {
                        setError('Kamera tidak ditemukan.')
                    } else if (err.name === 'NotReadableError') {
                        setError('Kamera sedang digunakan aplikasi lain.')
                    } else {
                        setError('Gagal: ' + (err.message || err))
                    }
                    setIsScanning(false)
                    setStatus('')
                }
            }
        }

        const stopScanner = () => {
            setStatus('')
            if (readerRef.current) {
                readerRef.current.reset()
            }
        }

        if (isScanning) {
            startScanner()
        } else {
            stopScanner()
        }

        return () => {
            mounted = false
            stopScanner()
        }
    }, [isScanning, handleScan, setIsScanning])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (readerRef.current) {
                readerRef.current.reset()
                readerRef.current = null
            }
        }
    }, [])

    const toggleScanner = () => {
        setError(null)
        if (isScanning) {
            setIsScanning(false)
        } else {
            setIsScanning(true)
            setScanCount(0)
        }
    }

    const handleManualSubmit = (e) => {
        e.preventDefault()
        if (manualInput.trim()) {
            handleScan(manualInput.trim())
            setManualInput('')
        }
    }

    return (
        <div className="scanner-card cashier-scanner-card">
            <div className="cashier-scanner-header">
                <div>
                    <strong>Scanner Kamera</strong>
                    <p>Arahkan barcode ke area kamera atau input manual jika perlu.</p>
                </div>
                <span className="cashier-scanner-counter">{scanCount} scan</span>
            </div>

            <div
                className="scanner-container cashier-scanner-frame"
                style={{
                    display: isScanning ? 'block' : 'none'
                }}
            >
                <video
                    ref={videoRef}
                    style={{
                        width: '100%',
                        height: 'auto',
                        minHeight: '250px',
                        maxHeight: '400px',
                        objectFit: 'cover'
                    }}
                    playsInline
                    muted
                />
                <div className="cashier-scan-line" />
            </div>

            {status && isScanning && (
                <div className="cashier-scanner-status success">
                    ✅ {status}
                </div>
            )}

            {error && (
                <div className="cashier-scanner-status error">
                    ❌ {error}
                </div>
            )}

            <form onSubmit={handleManualSubmit} className="cashier-manual-scan-form">
                <div className="cashier-manual-row">
                    <input
                        type="text"
                        className="form-input"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        placeholder="Ketik barcode manual..."
                    />
                    <button type="submit" className="btn btn-ghost">Tambahkan</button>
                </div>
            </form>

            <style>{`
                @keyframes scanLine {
                    0%, 100% { transform: translateY(-30px); opacity: 0.5; }
                    50% { transform: translateY(30px); opacity: 1; }
                }
            `}</style>
        </div>
    )
}

export default BarcodeScanner
