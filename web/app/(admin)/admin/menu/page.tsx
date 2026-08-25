'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { api, withIds, withId, ApiError } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Skeleton from '@/components/ui/Skeleton'
import MenuItemForm, { MenuItemFormValues } from '@/components/admin/MenuItemForm'
import { MenuItem } from '@/types/models'

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const { show } = useToast()

  const load = useCallback(() => {
    setLoading(true)
    api
      .get<(MenuItem & { _id: string })[]>('/api/admin/menu/getall')
      .then(({ obj }) => setItems(withIds(obj)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    // Loads menu items from the server on mount — not derived from render state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  function openAdd() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(item: MenuItem) {
    setEditing(item)
    setModalOpen(true)
  }

  async function handleSubmit(values: MenuItemFormValues) {
    setSaving(true)
    try {
      if (editing) {
        await api.put('/api/admin/menu/update', { id: editing.id, ...values })
        setItems((prev) => prev.map((i) => (i.id === editing.id ? { ...i, ...values } : i)))
      } else {
        const { obj } = await api.post<MenuItem & { _id: string }>('/api/admin/menu/add', values)
        setItems((prev) => [...prev, withId(obj)])
      }
      show('Menu item saved', 'success')
      setModalOpen(false)
    } catch (e) {
      show(e instanceof ApiError ? e.message : 'Could not save item', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(item: MenuItem) {
    setTogglingId(item.id)
    try {
      await api.patch('/api/admin/menu/toggle', { id: item.id })
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_available: !i.is_available } : i)))
    } catch {
      show('Could not update availability', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">Menu Items</h1>
        <Button size="sm" onClick={openAdd}>
          + Add Item
        </Button>
      </div>

      {loading ? (
        <div className="mt-6 flex flex-col gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 rounded-3xl border border-cream-deep bg-cream-soft p-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-cream-deep/40">
                <Image src={item.image_url || '/meals/placeholder.jpg'} alt={item.name} fill className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-display text-sm font-semibold text-ink">{item.name}</p>
                  <Badge tone="neutral">{item.category}</Badge>
                  {item.is_featured && <Badge tone="orange">Featured</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-ink-soft">
                  ₹{item.price} · P{item.nutrition.protein_g}g C{item.nutrition.carbs_g}g F{item.nutrition.fibre_g}g · {item.nutrition.calories} cal
                </p>
              </div>
              <button
                onClick={() => handleToggle(item)}
                disabled={togglingId === item.id}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                  item.is_available ? 'bg-green-soft text-green-dark' : 'bg-red-soft text-red'
                }`}
              >
                {item.is_available ? 'Available' : 'Out of Stock'}
              </button>
              <button onClick={() => openEdit(item)} className="shrink-0 text-xs font-bold uppercase tracking-wide text-green hover:underline">
                Edit
              </button>
            </div>
          ))}
          {items.length === 0 && <p className="py-10 text-center text-sm text-ink-soft">No menu items yet.</p>}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Menu Item' : 'Add Menu Item'}>
        <MenuItemForm key={editing?.id ?? 'new'} initial={editing ?? undefined} onSubmit={handleSubmit} onCancel={() => setModalOpen(false)} submitting={saving} />
      </Modal>
    </div>
  )
}
