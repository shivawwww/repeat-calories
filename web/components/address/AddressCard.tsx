'use client'

import { Address } from '@/types/models'
import Badge from '@/components/ui/Badge'
import { IconCheck } from '@/components/ui/icons'

export default function AddressCard({
  address,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: Address
  selected?: boolean
  onSelect?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onSetDefault?: () => void
}) {
  const selectable = !!onSelect

  return (
    <div
      onClick={onSelect}
      className={`relative rounded-3xl border-2 p-4 transition-colors ${
        selected ? 'border-green bg-green-soft/60' : 'border-cream-deep bg-cream-soft'
      } ${selectable ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-bold uppercase tracking-wide text-ink">{address.label}</span>
          {address.is_default && <Badge tone="green">Default</Badge>}
        </div>
        {selectable && (
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
              selected ? 'border-green bg-green text-cream-soft' : 'border-cream-deep'
            }`}
          >
            {selected && <IconCheck className="h-3 w-3" />}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        {address.full_address}, {address.area}, {address.city} - {address.pincode}
      </p>
      {address.landmark && <p className="mt-0.5 text-xs text-ink-soft">Landmark: {address.landmark}</p>}

      {(onEdit || onDelete || onSetDefault) && (
        <div className="mt-3 flex gap-4 text-xs font-bold uppercase tracking-wide">
          {onEdit && (
            <button onClick={(e) => { e.stopPropagation(); onEdit() }} className="text-green hover:underline">
              Edit
            </button>
          )}
          {!address.is_default && onSetDefault && (
            <button onClick={(e) => { e.stopPropagation(); onSetDefault() }} className="text-green hover:underline">
              Set Default
            </button>
          )}
          {onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="text-red hover:underline">
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}
