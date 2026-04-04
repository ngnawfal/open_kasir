import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import AccessDenied from '../components/common/AccessDenied'
import useAdminProducts from '../hooks/useAdminProducts'
import ProductListSection from '../components/admin/ProductListSection'
import ProductBarcodePreviewModal from '../components/admin/ProductBarcodePreviewModal'
import ProductFormModal from '../components/admin/ProductFormModal'
import ProductScannerModal from '../components/admin/ProductScannerModal'
import ProductBarcodeManagerModal from '../components/admin/ProductBarcodeManagerModal'

function AdminPage({ products, onProductsChange }) {
    const { authFetch, isAdmin } = useAuth()
    const { notify, confirm } = useUI()
    const {
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
    } = useAdminProducts({ products, onProductsChange, authFetch, notify, confirm })

    if (!isAdmin) {
        return <AccessDenied message="Halaman ini hanya untuk Admin" />
    }

    return (
        <div className="page-container admin-page-shell admin-page-layout">
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
                    <div className="uploading-overlay-card">
                        <div className="spinner uploading-overlay-spinner"></div>
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

