'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAddresses } from '@/hooks/useAddresses'
import { useToast } from '@/components/ui/Toast'
import { ApiError } from '@/lib/api'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Skeleton from '@/components/ui/Skeleton'
import AddressCard from '@/components/address/AddressCard'
import AddressForm, { AddressFormValues } from '@/components/address/AddressForm'
import { Address } from '@/types/models'

export default function AddressesPage() {
  const { addresses, loading, addAddress, updateAddress, removeAddress, setDefaultAddress } = useAddresses()
  const { show } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Address | null>(null)
  const [saving, setSaving] = useState(false)

  function openAdd() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(address: Address) {
    setEditing(address)
    setModalOpen(true)
  }

  async function handleSubmit(values: AddressFormValues) {
    setSaving(true)
    try {
      if (editing) {
        await updateAddress(editing.address_id, values)
        if (values.is_default) await setDefaultAddress(editing.address_id)
      } else {
        await addAddress(values)
      }
      setModalOpen(false)
    } catch (e) {
      show(e instanceof ApiError ? e.message : 'Could not save address', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(address: Address) {
    if (!confirm('Delete this address?')) return
    try {
      await removeAddress(address.address_id)
    } catch (e) {
      show(e instanceof ApiError ? e.message : 'Could not delete address', 'error')
    }
  }

  return (
    <div className="mx-auto max-w-xl pb-6">
      <Link href="/profile" className="text-xs font-bold uppercase tracking-wide text-ink-soft hover:text-green">
        ← Back to Profile
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">Addresses</h1>
        <Button size="sm" onClick={openAdd}>
          + Add
        </Button>
      </div>

      {loading ? (
        <div className="mt-6 flex flex-col gap-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="mt-10 text-center text-sm text-ink-soft">No saved addresses yet.</div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {addresses.map((a) => (
            <AddressCard
              key={a.address_id}
              address={a}
              onEdit={() => openEdit(a)}
              onDelete={() => handleDelete(a)}
              onSetDefault={() => setDefaultAddress(a.address_id).catch(() => show('Could not set default', 'error'))}
            />
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Address' : 'Add Address'}>
        <AddressForm
          key={editing?.address_id ?? 'new'}
          initial={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          submitting={saving}
        />
      </Modal>
    </div>
  )
}
