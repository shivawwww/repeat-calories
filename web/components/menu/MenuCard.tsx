'use client'

import Image from 'next/image'
import { useCart } from '@/hooks/useCart'
import { IconPlus, IconMinus } from '@/components/ui/icons'
import { MenuItem } from '@/types/models'

export type MenuItemWithOrderable = MenuItem & { orderable: boolean }

function StatChip({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="flex flex-1 flex-col items-center rounded-xl bg-cream-deep/50 py-1.5">
      <span className="stat-figure text-xs font-bold text-ink">
        {value}
        <span className="text-[9px] font-semibold text-ink-soft">{unit}</span>
      </span>
      <span className="text-[9px] font-bold uppercase tracking-wide text-ink-soft">{label}</span>
    </div>
  )
}

export default function MenuCard({ item }: { item: MenuItemWithOrderable }) {
  const { items, addItem, updateQty } = useCart()
  const inCart = items.find((i) => i.menu_item_id === item.id)
  const disabled = !item.orderable

  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl border border-cream-deep bg-cream-soft shadow-sm shadow-ink/5 transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-cream-deep/40">
        <Image
          src={item.image_url || '/meals/placeholder.jpg'}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 50vw, 280px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {item.is_featured && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-orange px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cream-soft shadow">
            Featured
          </span>
        )}
        {disabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/55">
            <span className="rounded-full bg-cream-soft px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-ink">
              Closed for today
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base font-semibold text-ink">{item.name}</h3>
        {item.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">{item.description}</p>}

        <div className="mt-3 flex gap-1.5">
          <StatChip label="Protein" value={item.nutrition.protein_g} unit="g" />
          <StatChip label="Carbs" value={item.nutrition.carbs_g} unit="g" />
          <StatChip label="Fibre" value={item.nutrition.fibre_g} unit="g" />
          <StatChip label="Cal" value={item.nutrition.calories} unit="" />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="font-display text-lg font-bold text-ink">₹{item.price}</span>

          {!inCart ? (
            <button
              onClick={() => addItem(item.id)}
              disabled={disabled}
              className="flex items-center gap-1.5 rounded-full bg-orange px-4 py-2 text-xs font-bold uppercase tracking-wide text-cream-soft transition-all active:scale-95 hover:bg-orange-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              <IconPlus className="h-3.5 w-3.5" /> Add
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-full bg-green-soft px-1 py-1">
              <button
                onClick={() => updateQty(item.id, inCart.quantity - 1)}
                aria-label="Decrease quantity"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-cream-soft text-green-dark shadow-sm transition-transform active:scale-90"
              >
                <IconMinus className="h-3.5 w-3.5" />
              </button>
              <span className="w-4 text-center text-sm font-bold text-green-dark">{inCart.quantity}</span>
              <button
                onClick={() => updateQty(item.id, inCart.quantity + 1)}
                disabled={disabled}
                aria-label="Increase quantity"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-cream-soft text-green-dark shadow-sm transition-transform active:scale-90 disabled:opacity-40"
              >
                <IconPlus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
