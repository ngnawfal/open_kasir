import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { BrowserMultiFormatReader } from '@zxing/library'
import ProductListSection from '../components/admin/ProductListSection'
import ProductBarcodePreviewModal from '../components/admin/ProductBarcodePreviewModal'
import ProductFormModal from '../components/admin/ProductFormModal'
import ProductScannerModal from '../components/admin/ProductScannerModal'
import ProductBarcodeManagerModal from '../components/admin/ProductBarcodeManagerModal'

function AdminPage({ products, onProductsChange }) {
    const { authFetch, isAdmin } = useAuth()
    const [showForm, setShowForm] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [barcodeImage, setBarcodeImage] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [uploading, setUploading] = useState(false)
    const [showScanner, setShowScanner] = useState(false)
    const [scannerStatus, setScannerStatus] = useState('')
    const [showBarcodeModal, setShowBarcodeModal] = useState(null) // product for barcode management
    const [productBarcodes, setProductBarcodes] = useState([])
    const [newBarcodeInput, setNewBarcodeInput] = useState('')
    const [newBarcodeDesc, setNewBarcodeDesc] = useState('')
    const [pendingImageFile, setPendingImageFile] = useState(null) // for new product image upload
    const [previewUrl, setPreviewUrl] = useState(null) // preview before save
    const fileInputRef = useRef(null)
    const videoRef = useRef(null)
    const readerRef = useRef(null)
    const [customCategory, setCustomCategory] = useState('')
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

    const formatRupiah = (amount) => `Rp ${amount.toLocaleString('id-ID')}`

    const emojiOptions = [
        '🍛', '🍜', '🍲', '🍵', '🧊', '🍊', '☕', '💧', '🍔', '🍕', '🌮', '🥤', '🍰', '🍩', '🍗', '🍟', '🍘',
        '🥛', '🍞', '🧈', '🥚', '🧀', '🥩', '🍖', '🐟', '🥬', '🥕', '🧅', '🍎', '🍌', '🍇', '🍫', '🍬', '🍪',
        '🧴', '🧻', '🧹', '🪥', '🧽', '💊', '🩹', '📱', '🔌', '💡', '🔋', '📦', '🛒', '🏷️', '💵', '🎁'
    ]
    const categories = [
        'Makanan',
        'Minuman',
        'Snack',
        'Sembako',
        'Bumbu Dapur',
        'Frozen Food',
        'Roti & Kue',
        'Susu & Dairy',
        'Mie Instan',
        'Kebutuhan Bayi',
        'Perawatan Tubuh',
        'Kosmetik',
        'Skincare',
        'Kebersihan Rumah',
        'Obat & Kesehatan',
        'Rokok',
        'ATK',
        'Elektronik',
        'Aksesoris',
        'Lainnya'
    ]

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery))
    )

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const url = selectedProduct
                ? `/api/products/${selectedProduct.id}`
                : '/api/products'

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

                // Auto-upload pending image for new products
                if (!selectedProduct && pendingImageFile && result.id) {
                    await handleImageUpload(result.id, pendingImageFile)
                }

                onProductsChange()
                resetForm()
            } else {
                const error = await response.json()
                alert(error.detail)
            }
        } catch (error) {
            alert('Error: ' + error.message)
        }
    }

    const handleDelete = async (productId) => {
        if (!confirm('Hapus produk ini?')) return

        try {
            const response = await authFetch(`/api/products/${productId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                onProductsChange()
            }
        } catch (error) {
            console.error('Error:', error)
        }
    }

    // ============ BARCODE MANAGEMENT ============
    const [batchScanMode, setBatchScanMode] = useState(false)
    const [usbScanMode, setUsbScanMode] = useState(false)
    const [scannedBarcodes, setScannedBarcodes] = useState([])
    const scanBarcodeReaderRef = useRef(null)
    const scanVideoRef = useRef(null)
    const usbBufferRef = useRef('')
    const usbTimeoutRef = useRef(null)

    const openBarcodeModal = async (product) => {
        setShowBarcodeModal(product)
        setNewBarcodeInput('')
        setNewBarcodeDesc('')
        setBatchScanMode(false)
        setUsbScanMode(false)
        setScannedBarcodes([])
        // Load all barcodes for this product
        try {
            const response = await authFetch(`/api/products/${product.id}/barcodes`)
            if (response.ok) {
                const data = await response.json()
                setProductBarcodes(data)
            }
        } catch (error) {
            console.error('Error loading barcodes:', error)
        }
    }

    // USB Scanner - keyboard listener
    useEffect(() => {
        if (!usbScanMode || !showBarcodeModal) return

        const handleKeyDown = (e) => {
            // Clear any existing timeout
            if (usbTimeoutRef.current) {
                clearTimeout(usbTimeoutRef.current)
            }

            // Enter key = process the barcode
            if (e.key === 'Enter' && usbBufferRef.current.length > 3) {
                e.preventDefault()
                const barcode = usbBufferRef.current
                usbBufferRef.current = ''
                addBarcodeFromScan(barcode)
                return
            }

            // Ignore non-printable keys
            if (e.key.length !== 1) return

            // Add to buffer
            usbBufferRef.current += e.key

            // Auto-process after 100ms of no input (scanner is done)
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

    // Add barcode directly from scan (auto-add)
    const modalProductRef = useRef(null)
    const lastBatchScanRef = useRef('')
    const lastBatchScanTimeRef = useRef(0)

    // Update ref when modal changes
    useEffect(() => {
        modalProductRef.current = showBarcodeModal
    }, [showBarcodeModal])

    // Cleanup scanner when modal closes
    useEffect(() => {
        if (!showBarcodeModal && scanBarcodeReaderRef.current) {
            scanBarcodeReaderRef.current.reset()
            setBatchScanMode(false)
            setUsbScanMode(false)
        }
    }, [showBarcodeModal])

    const addBarcodeFromScan = async (barcode) => {
        const product = modalProductRef.current
        if (!product) return

        // Debounce - prevent same barcode within 1 second
        const now = Date.now()
        if (barcode === lastBatchScanRef.current && now - lastBatchScanTimeRef.current < 1000) {
            return
        }
        lastBatchScanRef.current = barcode
        lastBatchScanTimeRef.current = now

        try {
            const response = await authFetch(`/api/products/${product.id}/barcodes`, {
                method: 'POST',
                body: JSON.stringify({
                    barcode: barcode,
                    description: 'Dari batch scan'
                })
            })

            if (response.ok) {
                setScannedBarcodes(prev => [...prev, barcode])
                // Reload barcodes
                const refreshResp = await authFetch(`/api/products/${product.id}/barcodes`)
                if (refreshResp.ok) {
                    const data = await refreshResp.json()
                    setProductBarcodes(data)
                }
                onProductsChange()

                // Play success sound
                try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)()
                    const osc = ctx.createOscillator()
                    const gain = ctx.createGain()
                    osc.connect(gain)
                    gain.connect(ctx.destination)
                    osc.frequency.value = 1000
                    gain.gain.value = 0.3
                    osc.start()
                    osc.stop(ctx.currentTime + 0.15)
                } catch (e) { }
            } else {
                // Already exists - play different sound
                try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)()
                    const osc = ctx.createOscillator()
                    osc.connect(ctx.destination)
                    osc.frequency.value = 400
                    osc.start()
                    osc.stop(ctx.currentTime + 0.1)
                } catch (e) { }
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
                body: JSON.stringify({
                    barcode: newBarcodeInput.trim(),
                    description: newBarcodeDesc.trim() || null
                })
            })

            if (response.ok) {
                // Reload barcodes
                openBarcodeModal(showBarcodeModal)
                setNewBarcodeInput('')
                setNewBarcodeDesc('')
                onProductsChange() // Refresh product list
            } else {
                const error = await response.json()
                alert(error.detail)
            }
        } catch (error) {
            alert('Error: ' + error.message)
        }
    }

    const deleteBarcodeAlias = async (barcodeId) => {
        if (!showBarcodeModal) return

        try {
            const response = await authFetch(`/api/products/${showBarcodeModal.id}/barcodes/${barcodeId}`, {
                method: 'DELETE'
            })

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
        // Check if category is custom (not in predefined list)
        if (!categories.includes(product.category)) {
            setCustomCategory(product.category)
        } else {
            setCustomCategory('')
        }
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

    const resetForm = () => {
        setShowForm(false)
        setSelectedProduct(null)
        setCustomCategory('')
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

    const showBarcode = async (product) => {
        setBarcodeImage({
            product,
            imageUrl: `/api/products/${product.id}/barcode-image`
        })
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

    // Handle image upload
    const handleImageUpload = async (productId, file) => {
        if (!file) return

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const token = localStorage.getItem('token')
            const response = await fetch(`/api/products/${productId}/upload-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            })

            if (response.ok) {
                onProductsChange()
                alert('Gambar berhasil diupload!')
            } else {
                const error = await response.json()
                alert(error.detail || 'Gagal upload gambar')
            }
        } catch (error) {
            alert('Error: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    const handleDeleteImage = async (productId) => {
        if (!confirm('Hapus gambar produk ini?')) return

        try {
            const response = await authFetch(`/api/products/${productId}/image`, {
                method: 'DELETE'
            })

            if (response.ok) {
                onProductsChange()
            }
        } catch (error) {
            console.error('Error:', error)
        }
    }

    const closeScannerModal = () => {
        setShowScanner(false)
        setScannerStatus('')
        if (readerRef.current) {
            readerRef.current.reset()
        }
    }

    const startFormScanner = async () => {
        try {
            setScannerStatus('Memulai kamera...')

            if (!readerRef.current) {
                readerRef.current = new BrowserMultiFormatReader()
            }

            const devices = await readerRef.current.listVideoInputDevices()
            if (!devices.length) {
                setScannerStatus('❌ Tidak ada kamera')
                return
            }

            const backCam = devices.find(d =>
                d.label.toLowerCase().includes('back') ||
                d.label.toLowerCase().includes('environment')
            ) || devices[0]

            setScannerStatus('Arahkan ke barcode...')

            await readerRef.current.decodeFromVideoDevice(
                backCam.deviceId,
                videoRef.current,
                (result) => {
                    if (result) {
                        const barcode = result.getText()
                        setFormData(prev => ({ ...prev, barcode }))
                        setScannerStatus('✅ Barcode: ' + barcode)

                        setTimeout(() => {
                            if (readerRef.current) readerRef.current.reset()
                            setShowScanner(false)
                            setScannerStatus('')
                        }, 1000)
                    }
                }
            )
        } catch (err) {
            setScannerStatus('❌ ' + (err.message || 'Gagal akses kamera'))
        }
    }

    const startBatchScanner = () => {
        setTimeout(async () => {
            try {
                if (!scanBarcodeReaderRef.current) {
                    scanBarcodeReaderRef.current = new BrowserMultiFormatReader()
                }
                const devices = await scanBarcodeReaderRef.current.listVideoInputDevices()
                const backCam = devices.find(d => d.label.toLowerCase().includes('back')) || devices[0]
                if (backCam && scanVideoRef.current) {
                    await scanBarcodeReaderRef.current.decodeFromVideoDevice(
                        backCam.deviceId,
                        scanVideoRef.current,
                        (result) => {
                            if (result) addBarcodeFromScan(result.getText())
                        }
                    )
                } else {
                    console.error('No video element or camera')
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

    if (!isAdmin) {
        return (
            <div className="text-center" style={{ padding: '3rem' }}>
                <span style={{ fontSize: '4rem' }}>🔒</span>
                <h2 className="mt-md">Akses Ditolak</h2>
                <p className="text-muted">Halaman ini hanya untuk Admin</p>
            </div>
        )
    }

    return (
        <div className="page-container admin-page-shell" style={{ maxWidth: '100%', padding: '24px' }}>
            <ProductListSection
                products={products}
                filteredProducts={filteredProducts}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                formatRupiah={formatRupiah}
                setShowForm={setShowForm}
                uploading={uploading}
                handleImageUpload={handleImageUpload}
                showBarcode={showBarcode}
                openBarcodeModal={openBarcodeModal}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
            />

            <ProductBarcodePreviewModal
                barcodeImage={barcodeImage}
                setBarcodeImage={setBarcodeImage}
                handleDeleteImage={handleDeleteImage}
                printBarcode={printBarcode}
                handleImageUpload={handleImageUpload}
                uploading={uploading}
                formatRupiah={formatRupiah}
            />

            <ProductFormModal
                showForm={showForm}
                selectedProduct={selectedProduct}
                resetForm={resetForm}
                handleSubmit={handleSubmit}
                formData={formData}
                setFormData={setFormData}
                setShowScanner={setShowScanner}
                categories={categories}
                customCategory={customCategory}
                setCustomCategory={setCustomCategory}
                previewUrl={previewUrl}
                pendingImageFile={pendingImageFile}
                uploading={uploading}
                handleImageUpload={handleImageUpload}
                handleDeleteImage={handleDeleteImage}
                setPendingImageFile={setPendingImageFile}
                setPreviewUrl={setPreviewUrl}
                emojiOptions={emojiOptions}
            />

            {uploading && (
                <div className="modal-overlay">
                    <div style={{ textAlign: 'center', color: 'white' }}>
                        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                        <p>Mengupload gambar...</p>
                    </div>
                </div>
            )}

            <ProductScannerModal
                showScanner={showScanner}
                closeScanner={closeScannerModal}
                scannerStatus={scannerStatus}
                videoRef={videoRef}
                startScanner={startFormScanner}
            />

            <ProductBarcodeManagerModal
                showBarcodeModal={showBarcodeModal}
                closeBarcodeModal={closeBarcodeModal}
                productBarcodes={productBarcodes}
                deleteBarcodeAlias={deleteBarcodeAlias}
                batchScanMode={batchScanMode}
                setBatchScanMode={setBatchScanMode}
                usbScanMode={usbScanMode}
                setUsbScanMode={setUsbScanMode}
                scanBarcodeReaderRef={scanBarcodeReaderRef}
                scanVideoRef={scanVideoRef}
                scannedBarcodes={scannedBarcodes}
                addBarcodeFromScan={addBarcodeFromScan}
                newBarcodeInput={newBarcodeInput}
                setNewBarcodeInput={setNewBarcodeInput}
                addBarcodeAlias={addBarcodeAlias}
                usbBufferRef={usbBufferRef}
                startBatchScanner={startBatchScanner}
            />
        </div>
    )
}

export default AdminPage

