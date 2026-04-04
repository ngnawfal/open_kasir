export async function fetchProductsPublic() {
    const response = await fetch('/api/products')
    return response.json()
}

export async function saveProduct(authFetch, payload, productId = null) {
    return authFetch(productId ? `/api/products/${productId}` : '/api/products', {
        method: productId ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
    })
}

export async function deleteProduct(authFetch, productId) {
    return authFetch(`/api/products/${productId}`, { method: 'DELETE' })
}

export async function fetchProductBarcodes(authFetch, productId) {
    return authFetch(`/api/products/${productId}/barcodes`)
}

export async function createProductBarcode(authFetch, productId, payload) {
    return authFetch(`/api/products/${productId}/barcodes`, {
        method: 'POST',
        body: JSON.stringify(payload)
    })
}

export async function deleteProductBarcode(authFetch, productId, barcodeId) {
    return authFetch(`/api/products/${productId}/barcodes/${barcodeId}`, { method: 'DELETE' })
}

export async function updateProductStock(authFetch, productId, payload) {
    return authFetch(`/api/products/${productId}/stock`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    })
}

export async function uploadProductImage(token, productId, file) {
    const formData = new FormData()
    formData.append('file', file)

    return fetch(`/api/products/${productId}/upload-image`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: formData
    })
}

export async function deleteProductImage(authFetch, productId) {
    return authFetch(`/api/products/${productId}/image`, { method: 'DELETE' })
}
