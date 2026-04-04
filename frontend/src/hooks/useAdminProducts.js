import { useEffect, useRef, useState } from 'react'
import { loadZxingReader } from '../services/scannerLoader'

export function useAdminProducts({ products, onProductsChange, authFetch, notify, confirm }) {
    const [showForm, setShowForm] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [barcodeImage, setBarcodeImage] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [uploading, setUploading] = useState(false)
    const [showScanner, setShowScanner] = useState(false)
    const [scannerStatus, setScannerStatus] = useState('')
    const [showBarcodeModal, setShowBarcodeModal] = useState(null)
    const [productBarcodes, setProductBarcodes] = useState([])
    const [newBarcodeInput, setNewBarcodeInput] = useState('')
    const [newBarcodeDesc, setNewBarcodeDesc] = useState('')
    const [pendingImageFile, setPendingImageFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [customCategory, setCustomCategory] = useState('')
    const [batchScanMode, setBatchScanMode] = useState(false)
    const [usbScanMode, setUsbScanMode] = useState(false)
    const [scannedBarcodes, setScannedBarcodes] = useState([])
    const [formData, setFormData] = useState({
        barcode: '',
        name: '',
        price: '',
        cost_price: '',
        stock: '',
        min_stock: '5',
        category: 'Makanan',
        emoji: '🍽️'
    })

    const videoRef = useRef(null)
    const readerRef = useRef(null)
    const scanBarcodeReaderRef = useRef(null)
    const scanVideoRef = useRef(null)
    const usbBufferRef = useRef('')
    const usbTimeoutRef = useRef(null)
    const modalProductRef = useRef(null)
    const lastBatchScanRef = useRef('')
    const lastBatchScanTimeRef = useRef(0)

    const emojiOptions = [
        '🍛', '🍜', '🍲', '🍵', '🧊', '🍊', '☕', '💧', '🍔', '🍕', '🌮', '🥤', '🍰', '🍩', '🍗', '🍟', '🍘',
        '🥛', '🍞', '🧈', '🥚', '🧀', '🥩', '🍖', '🐟', '🥬', '🥕', '🧅', '🍎', '🍌', '🍇', '🍫', '🍬', '🍪',
        '🧴', '🧻', '🧹', '🪥', '🧽', '💊', '🩹', '📱', '🔌', '💡', '🔋', '📦', '🛒', '🏷️', '💵', '🎁'
    ]

    const categories = [
        'Makanan', 'Minuman', 'Snack', 'Sembako', 'Bumbu Dapur', 'Frozen Food', 'Roti & Kue', 'Susu & Dairy',
        'Mie Instan', 'Kebutuhan Bayi', 'Perawatan Tubuh', 'Kosmetik', 'Skincare', 'Kebersihan Rumah',
        'Obat & Kesehatan', 'Rokok', 'ATK', 'Elektronik', 'Aksesoris', 'Lainnya'
    ]

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery))
    )

    const formatRupiah = (amount) => `Rp ${amount.toLocaleString('id-ID')}`

    useEffect(() => {
        modalProductRef.current = showBarcodeModal
    }, [showBarcodeModal])

    useEffect(() => {
        if (!showBarcodeModal && scanBarcodeReaderRef.current) {
            scanBarcodeReaderRef.current.reset()
            setBatchScanMode(false)
            setUsbScanMode(false)
        }
    }, [showBarcodeModal])

    useEffect(() => {
        if (!usbScanMode || !showBarcodeModal) return

        const handleKeyDown = (e) => {
            if (usbTimeoutRef.current) clearTimeout(usbTimeoutRef.current)
            if (e.key === 'Enter' && usbBufferRef.current.length > 3) {
                e.preventDefault()
                const barcode = usbBufferRef.current
                usbBufferRef.current = ''
                addBarcodeFromScan(barcode)
                return
            }
            if (e.key.length !== 1) return
            usbBufferRef.current += e.key
            usbTimeoutRef.current = setTimeout(() => {
                if (usbBufferRef.current.length > 3) {
                    const barcode = usbBufferRef.current
                    usbBufferRef.current = ''
                    addBarcodeFromScan(barcode)
                }
            }, 100)
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            if (usbTimeoutRef.current) clearTimeout(usbTimeoutRef.current)
        }
    }, [usbScanMode, showBarcodeModal])

    const resetForm = () => {
        setShowForm(false)
        setSelectedProduct(null)
        setCustomCategory('')
        setPendingImageFile(null)
        setPreviewUrl(null)
        setFormData({
            barcode: '',
            name: '',
            price: '',
            cost_price: '',
            stock: '',
            min_stock: '5',
            category: 'Makanan',
            emoji: '🍽️'
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const url = selectedProduct ? `/api/products/${selectedProduct.id}` : '/api/products'
            const response = await authFetch(url, {
                method: selectedProduct ? 'PUT' : 'POST',
                body: JSON.stringify({
                    barcode: formData.barcode || null,
                    name: formData.name,
                    price: parseInt(formData.price),
                    cost_price: parseInt(formData.cost_price) || 0,
                    stock: parseInt(formData.stock) || 0,
                    min_stock: parseInt(formData.min_stock) || 5,
                    category: formData.category,
                    emoji: formData.emoji
                })
            })

            if (response.ok) {
                const result = await response.json()
                if (!selectedProduct && pendingImageFile && result.id) {
                    await handleImageUpload(result.id, pendingImageFile)
                }
                onProductsChange()
                resetForm()
            } else {
                const error = await response.json()
                notify({ type: 'error', title: 'Gagal menyimpan produk', message: error.detail })
            }
        } catch (error) {
            notify({ type: 'error', title: 'Gagal menyimpan produk', message: error.message })
        }
    }

    const handleDelete = async (productId) => {
        if (!(await confirm({ title: 'Hapus produk?', description: 'Produk yang dihapus tidak akan tampil di daftar aktif.', confirmText: 'Hapus', tone: 'danger' }))) return
        try {
            const response = await authFetch(`/api/products/${productId}`, { method: 'DELETE' })
            if (response.ok) onProductsChange()
        } catch (error) {
            console.error('Error:', error)
        }
    }

    const openBarcodeModal = async (product) => {
        setShowBarcodeModal(product)
        setNewBarcodeInput('')
        setNewBarcodeDesc('')
        setBatchScanMode(false)
        setUsbScanMode(false)
        setScannedBarcodes([])
        try {
            const response = await authFetch(`/api/products/${product.id}/barcodes`)
            if (response.ok) setProductBarcodes(await response.json())
        } catch (error) {
            console.error('Error loading barcodes:', error)
        }
    }

    const addBarcodeFromScan = async (barcode) => {
        const product = modalProductRef.current
        if (!product) return
        const now = Date.now()
        if (barcode === lastBatchScanRef.current && now - lastBatchScanTimeRef.current < 1000) return
        lastBatchScanRef.current = barcode
        lastBatchScanTimeRef.current = now

        try {
            const response = await authFetch(`/api/products/${product.id}/barcodes`, {
                method: 'POST',
                body: JSON.stringify({ barcode, description: 'Dari batch scan' })
            })

            if (response.ok) {
                setScannedBarcodes((prev) => [...prev, barcode])
                const refreshResp = await authFetch(`/api/products/${product.id}/barcodes`)
                if (refreshResp.ok) setProductBarcodes(await refreshResp.json())
                onProductsChange()
            }
        } catch (error) {
            console.error('Error adding barcode:', error)
        }
    }

    const addBarcodeAlias = async () => {
        if (!newBarcodeInput.trim() || !showBarcodeModal) return
        try {
            const response = await authFetch(`/api/products/${showBarcodeModal.id}/barcodes`, {
                method: 'POST',
                body: JSON.stringify({ barcode: newBarcodeInput.trim(), description: newBarcodeDesc.trim() || null })
            })
            if (response.ok) {
                openBarcodeModal(showBarcodeModal)
                setNewBarcodeInput('')
                setNewBarcodeDesc('')
                onProductsChange()
            } else {
                const error = await response.json()
                notify({ type: 'error', title: 'Gagal menambah barcode', message: error.detail })
            }
        } catch (error) {
            notify({ type: 'error', title: 'Gagal menambah barcode', message: error.message })
        }
    }

    const deleteBarcodeAlias = async (barcodeId) => {
        if (!showBarcodeModal) return
        try {
            const response = await authFetch(`/api/products/${showBarcodeModal.id}/barcodes/${barcodeId}`, { method: 'DELETE' })
            if (response.ok) {
                openBarcodeModal(showBarcodeModal)
                onProductsChange()
            }
        } catch (error) {
            console.error('Error:', error)
        }
    }

    const handleEdit = (product) => {
        setSelectedProduct(product)
        setCustomCategory(categories.includes(product.category) ? '' : product.category)
        setFormData({
            barcode: product.barcode || '',
            name: product.name,
            price: product.price.toString(),
            cost_price: (product.cost_price || 0).toString(),
            stock: product.stock.toString(),
            min_stock: (product.min_stock || 5).toString(),
            category: product.category,
            emoji: product.emoji
        })
        setShowForm(true)
    }

    const showBarcode = (product) => {
        setBarcodeImage({ product, imageUrl: `/api/products/${product.id}/barcode-image` })
    }

    const printBarcode = () => {
        if (!barcodeImage) return
        const printWindow = window.open('', '_blank')
        printWindow.document.write(`
      <html>
        <head>
          <title>Barcode - ${barcodeImage.product.name}</title>
          <style>
            body { font-family: Arial; text-align: center; padding: 20px; }
            .barcode-container { display: inline-block; border: 2px solid #333; padding: 15px; margin: 10px; }
            img { max-width: 250px; height: auto; }
            h3 { margin: 10px 0 5px; }
            p { margin: 0; color: #666; }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <img src="${barcodeImage.imageUrl}" />
            <h3>${barcodeImage.product.emoji} ${barcodeImage.product.name}</h3>
            <p>Rp ${barcodeImage.product.price.toLocaleString('id-ID')}</p>
            ${barcodeImage.product.barcode ? `<p style="font-size: 12px; margin-top: 5px;">${barcodeImage.product.barcode}</p>` : ''}
          </div>
        </body>
      </html>
    `)
        printWindow.document.close()
        setTimeout(() => printWindow.print(), 250)
    }

    const handleImageUpload = async (productId, file) => {
        if (!file) return
        setUploading(true)
        try {
            const uploadFormData = new FormData()
            uploadFormData.append('file', file)
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/products/${productId}/upload-image`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: uploadFormData
            })
            if (response.ok) {
                onProductsChange()
                notify({ type: 'success', title: 'Upload berhasil', message: 'Gambar produk berhasil diperbarui' })
            } else {
                const error = await response.json()
                notify({ type: 'error', title: 'Upload gagal', message: error.detail || 'Gagal upload gambar' })
            }
        } catch (error) {
            notify({ type: 'error', title: 'Upload gagal', message: error.message })
        } finally {
            setUploading(false)
        }
    }

    const handleDeleteImage = async (productId) => {
        if (!(await confirm({ title: 'Hapus gambar?', description: 'Gambar produk akan dihapus permanen.', confirmText: 'Hapus', tone: 'danger' }))) return
        try {
            const response = await authFetch(`/api/products/${productId}/image`, { method: 'DELETE' })
            if (response.ok) onProductsChange()
        } catch (error) {
            console.error('Error:', error)
        }
    }

    const closeScannerModal = () => {
        setShowScanner(false)
        setScannerStatus('')
        if (readerRef.current) readerRef.current.reset()
    }

    const startFormScanner = async () => {
        try {
            setScannerStatus('Memulai kamera...')
            if (!readerRef.current) {
                const BrowserMultiFormatReader = await loadZxingReader()
                readerRef.current = new BrowserMultiFormatReader()
            }
            const devices = await readerRef.current.listVideoInputDevices()
            if (!devices.length) {
                setScannerStatus('❌ Tidak ada kamera')
                return
            }
            const backCam = devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment')) || devices[0]
            setScannerStatus('Arahkan ke barcode...')
            await readerRef.current.decodeFromVideoDevice(backCam.deviceId, videoRef.current, (result) => {
                if (result) {
                    const barcode = result.getText()
                    setFormData((prev) => ({ ...prev, barcode }))
                    setScannerStatus('✅ Barcode: ' + barcode)
                    setTimeout(() => {
                        if (readerRef.current) readerRef.current.reset()
                        setShowScanner(false)
                        setScannerStatus('')
                    }, 1000)
                }
            })
        } catch (err) {
            setScannerStatus('❌ ' + (err.message || 'Gagal akses kamera'))
        }
    }

    const startBatchScanner = () => {
        setTimeout(async () => {
            try {
                if (!scanBarcodeReaderRef.current) {
                    const BrowserMultiFormatReader = await loadZxingReader()
                    scanBarcodeReaderRef.current = new BrowserMultiFormatReader()
                }
                const devices = await scanBarcodeReaderRef.current.listVideoInputDevices()
                const backCam = devices.find((d) => d.label.toLowerCase().includes('back')) || devices[0]
                if (backCam && scanVideoRef.current) {
                    await scanBarcodeReaderRef.current.decodeFromVideoDevice(backCam.deviceId, scanVideoRef.current, (result) => {
                        if (result) addBarcodeFromScan(result.getText())
                    })
                } else {
                    setBatchScanMode(false)
                }
            } catch (err) {
                console.error('Scanner error:', err)
                setBatchScanMode(false)
            }
        }, 200)
    }

    const closeBarcodeModal = () => {
        setShowBarcodeModal(null)
        setBatchScanMode(false)
        setUsbScanMode(false)
        if (scanBarcodeReaderRef.current) scanBarcodeReaderRef.current.reset()
    }

    return {
        showForm,
        setShowForm,
        selectedProduct,
        barcodeImage,
        setBarcodeImage,
        searchQuery,
        setSearchQuery,
        uploading,
        showScanner,
        scannerStatus,
        showBarcodeModal,
        productBarcodes,
        newBarcodeInput,
        setNewBarcodeInput,
        pendingImageFile,
        setPendingImageFile,
        previewUrl,
        setPreviewUrl,
        customCategory,
        setCustomCategory,
        formData,
        setFormData,
        videoRef,
        scanVideoRef,
        usbBufferRef,
        batchScanMode,
        setBatchScanMode,
        usbScanMode,
        setUsbScanMode,
        scannedBarcodes,
        emojiOptions,
        categories,
        filteredProducts,
        formatRupiah,
        handleSubmit,
        handleDelete,
        openBarcodeModal,
        addBarcodeAlias,
        deleteBarcodeAlias,
        handleEdit,
        resetForm,
        showBarcode,
        printBarcode,
        handleImageUpload,
        handleDeleteImage,
        closeScannerModal,
        startFormScanner,
        startBatchScanner,
        closeBarcodeModal,
        addBarcodeFromScan,
    }
}

export default useAdminProducts
