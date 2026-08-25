'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Address } from '@/types/models'

export function useAddresses(autoLoad = true) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(autoLoad)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const { obj } = await api.get<Address[]>('/api/address/getall')
      setAddresses(obj ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Loads addresses from the server on mount — not derived from render state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoLoad) refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad])

  const addAddress = useCallback(async (data: Omit<Address, 'address_id'>) => {
    const { obj } = await api.post<Address>('/api/address/add', data)
    setAddresses((prev) => (obj.is_default ? prev.map((a) => ({ ...a, is_default: false })) : prev).concat(obj))
    return obj
  }, [])

  const updateAddress = useCallback(async (address_id: string, data: Partial<Omit<Address, 'address_id'>>) => {
    await api.put('/api/address/update', { address_id, ...data })
    setAddresses((prev) => prev.map((a) => (a.address_id === address_id ? { ...a, ...data } : a)))
  }, [])

  const removeAddress = useCallback(async (address_id: string) => {
    await api.del('/api/address/remove', { address_id })
    setAddresses((prev) => {
      const remaining = prev.filter((a) => a.address_id !== address_id)
      const removed = prev.find((a) => a.address_id === address_id)
      if (removed?.is_default && remaining.length > 0) remaining[0] = { ...remaining[0], is_default: true }
      return remaining
    })
  }, [])

  const setDefaultAddress = useCallback(async (address_id: string) => {
    await api.patch('/api/address/setdefault', { address_id })
    setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.address_id === address_id })))
  }, [])

  return { addresses, loading, refresh, addAddress, updateAddress, removeAddress, setDefaultAddress }
}
