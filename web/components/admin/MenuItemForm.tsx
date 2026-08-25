'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { MenuItem } from '@/types/models'

export type MenuItemFormValues = Omit<MenuItem, 'id' | 'is_available'>

const CATEGORIES = ['Lunch', 'Dinner', 'Breakfast', 'Snacks', 'Beverages']

export default function MenuItemForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Partial<MenuItemFormValues>
  onSubmit: (values: MenuItemFormValues) => void
  onCancel?: () => void
  submitting?: boolean
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState(initial?.category ?? 'Lunch')
  const [price, setPrice] = useState(initial?.price ?? 0)
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '/meals/placeholder.jpg')
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? false)
  const [protein, setProtein] = useState(initial?.nutrition?.protein_g ?? 0)
  const [carbs, setCarbs] = useState(initial?.nutrition?.carbs_g ?? 0)
  const [fibre, setFibre] = useState(initial?.nutrition?.fibre_g ?? 0)
  const [calories, setCalories] = useState(initial?.nutrition?.calories ?? 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      name,
      description,
      category,
      price,
      image_url: imageUrl,
      is_featured: isFeatured,
      sort_order: initial?.sort_order ?? 0,
      nutrition: { protein_g: protein, carbs_g: carbs, fibre_g: fibre, calories },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
      <Textarea label="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-2xl border-2 border-cream-deep bg-cream-soft px-4 py-3 text-sm text-ink outline-none focus:border-green"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <Input label="Price (₹)" type="number" min={0} required value={price} onChange={(e) => setPrice(Number(e.target.value))} />
      </div>

      <Input label="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} hint="/meals/placeholder.jpg or a full https URL" />

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">Nutrition (per serving)</p>
        <div className="grid grid-cols-4 gap-2">
          <Input label="Protein (g)" type="number" min={0} value={protein} onChange={(e) => setProtein(Number(e.target.value))} />
          <Input label="Carbs (g)" type="number" min={0} value={carbs} onChange={(e) => setCarbs(Number(e.target.value))} />
          <Input label="Fibre (g)" type="number" min={0} value={fibre} onChange={(e) => setFibre(Number(e.target.value))} />
          <Input label="Calories" type="number" min={0} value={calories} onChange={(e) => setCalories(Number(e.target.value))} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-ink-soft">
        <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="h-4 w-4 rounded accent-green" />
        Feature this item on the menu page
      </label>

      <div className="mt-1 flex gap-3">
        {onCancel && (
          <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="flex-1" loading={submitting}>
          Save Item
        </Button>
      </div>
    </form>
  )
}
