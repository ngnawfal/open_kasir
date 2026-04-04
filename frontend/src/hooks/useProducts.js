import { useCallback, useEffect, useState } from 'react'
import { fetchProductsPublic } from '../services/productsApi'

export function useProducts(autoLoad = true) {
    const [products, setProducts] = useState([])
    const [loadingProducts, setLoadingProducts] = useState(autoLoad)

    const fetchProducts = useCallback(async () => {
        setLoadingProducts(true)
        try {
            setProducts(await fetchProductsPublic())
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
