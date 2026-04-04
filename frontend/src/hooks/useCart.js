import { useMemo, useState } from 'react'

export function useCart(products, notify) {
    const [cart, setCart] = useState([])

    const addToCart = (product) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find((item) => item.id === product.id)
            if (existingItem) {
                const currentQty = existingItem.quantity
                const availableStock = product.stock
                if (currentQty >= availableStock) {
                    notify?.({ type: 'warning', title: 'Stok tidak cukup', message: `${product.name} tersisa ${availableStock}` })
                    return prevCart
                }
                return prevCart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
            }
            return [...prevCart, { ...product, quantity: 1 }]
        })
    }

    const updateQuantity = (productId, newQuantity) => {
        setCart((prevCart) => {
            if (newQuantity <= 0) {
                return prevCart.filter((item) => item.id !== productId)
            }

            return prevCart.map((item) => {
                if (item.id !== productId) return item
                const product = products.find((p) => p.id === productId)
                if (product && newQuantity > product.stock) {
                    notify?.({ type: 'warning', title: 'Stok tidak cukup', message: `${product.name} maksimal ${product.stock}` })
                    return item
                }
                return { ...item, quantity: newQuantity }
            })
        })
    }

    const clearCart = () => setCart([])

    const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart])
    const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart])

    return {
        cart,
        setCart,
        addToCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
    }
}

export default useCart
