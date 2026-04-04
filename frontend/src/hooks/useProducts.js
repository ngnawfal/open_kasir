import { useCallback, useEffect, useState } from 'react'

export function useProducts(autoLoad = true) {
    const [products, setProducts] = useState([])
    const [loadingProducts, setLoadingProducts] = useState(autoLoad)

    const fetchProducts = useCallback(async () => {
        setLoadingProducts(true)
        try {
            const response = await fetch('/api/products')
            const data = await response.json()
            setProducts(data)
        } catch (error) {
            console.error('Error fetching products:', error)
        } finally {
            setLoadingProducts(false)
        }
    }, [])

    useEffect(() => {
        if (autoLoad) {
            fetchProducts()
        }
    }, [autoLoad, fetchProducts])

    return { products, setProducts, loadingProducts, fetchProducts }
}

export default useProducts
