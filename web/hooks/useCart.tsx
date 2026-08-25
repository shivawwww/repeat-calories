'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import { CartItem } from '@/types/models'
import { useToast } from '@/components/ui/Toast'

interface CartState {
  items: CartItem[]
  total_amount: number
}

interface CartContextValue extends CartState {
  count: number
  loading: boolean
  addItem: (menuItemId: string, quantity?: number) => Promise<void>
  updateQty: (menuItemId: string, quantity: number) => Promise<void>
  removeItem: (menuItemId: string) => Promise<void>
  clear: () => Promise<void>
  refresh: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

const EMPTY: CartState = { items: [], total_amount: 0 }

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const authed = status === 'authenticated'
  const [state, setState] = useState<CartState>(EMPTY)
  const [loading, setLoading] = useState(true)
  const { show } = useToast()

  const refresh = useCallback(async () => {
    if (!authed) {
      setState(EMPTY)
      setLoading(false)
      return
    }
    try {
      const { obj } = await api.get<CartState>('/api/cart/get')
      setState({ items: obj.items ?? [], total_amount: obj.total_amount ?? 0 })
    } catch {
      // leave existing state on transient failure
    } finally {
      setLoading(false)
    }
  }, [authed])

  useEffect(() => {
    // Loads the cart from the server on mount / auth change — not derived from render state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
  }, [refresh])

  const addItem = useCallback(
    async (menuItemId: string, quantity = 1) => {
      try {
        const { obj } = await api.post<CartState>('/api/cart/add', { menu_item_id: menuItemId, quantity })
        setState({ items: obj.items ?? [], total_amount: obj.total_amount ?? 0 })
        show('Added to cart', 'success')
      } catch (e) {
        show(e instanceof Error ? e.message : 'Could not add item', 'error')
      }
    },
    [show]
  )

  const updateQty = useCallback(
    async (menuItemId: string, quantity: number) => {
      try {
        const { obj } = await api.put<CartState>('/api/cart/updateqty', { menu_item_id: menuItemId, quantity })
        setState({ items: obj.items ?? [], total_amount: obj.total_amount ?? 0 })
      } catch (e) {
        show(e instanceof Error ? e.message : 'Could not update quantity', 'error')
      }
    },
    [show]
  )

  const removeItem = useCallback(
    async (menuItemId: string) => {
      try {
        const { obj } = await api.del<CartState>('/api/cart/remove', { menu_item_id: menuItemId })
        setState({ items: obj.items ?? [], total_amount: obj.total_amount ?? 0 })
      } catch (e) {
        show(e instanceof Error ? e.message : 'Could not remove item', 'error')
      }
    },
    [show]
  )

  const clear = useCallback(async () => {
    try {
      await api.del('/api/cart/clear')
      setState(EMPTY)
    } catch {
      // ignore — next refresh will reconcile
    }
  }, [])

  const count = useMemo(() => state.items.reduce((sum, i) => sum + i.quantity, 0), [state.items])

  const value: CartContextValue = {
    ...state,
    count,
    loading,
    addItem,
    updateQty,
    removeItem,
    clear,
    refresh,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
