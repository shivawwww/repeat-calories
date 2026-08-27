'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { api, ApiError } from '@/lib/api'
import Button from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { MenuItem } from '@/types/models'

export type MenuItemFormValues = Omit<MenuItem, 'id' | 'is_available'>

const MEAL_TIMES = ['Lunch', 'Dinner', 'Breakfast', 'Snacks', 'Beverages']
const MAX_IMAGES = 6

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
  const { show } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [mealTimes, setMealTimes] = useState<string[]>(initial?.meal_times ?? ['Lunch'])
  const [price, setPrice] = useState(initial?.price ?? 0)
  const [images, setImages] = useState<string[]>(initial?.images ?? [])
  const [uploading, setUploading] = useState(false)
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? false)
  const [protein, setProtein] = useState(initial?.nutrition?.protein_g ?? 0)
  const [carbs, setCarbs] = useState(initial?.nutrition?.carbs_g ?? 0)
  const [fibre, setFibre] = useState(initial?.nutrition?.fibre_g ?? 0)
  const [calories, setCalories] = useState(initial?.nutrition?.calories ?? 0)

  function toggleMealTime(time: string) {
    setMealTimes((prev) => (prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]))
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    const files = Array.from(fileList).slice(0, MAX_IMAGES - images.length)
    if (files.length === 0) {
      show(`You can add up to ${MAX_IMAGES} images`, 'error')
      return
    }

    setUploading(true)
    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        const { obj } = await api.upload<{ id: string; url: string }>('/api/admin/menu/upload-image', formData)
        setImages((prev) => [...prev, obj.url])
      }
    } catch (e) {
      show(e instanceof ApiError ? e.message : 'Could not upload image', 'error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url))
    if (url.startsWith('/api/menu/image/')) {
      const id = url.split('/').pop()
      if (id) api.del('/api/admin/menu/delete-image', { id }).catch(() => {})
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mealTimes.length === 0) {
      show('Pick at least one of Lunch / Dinner / Breakfast / Snacks / Beverages', 'error')
      return
    }
    onSubmit({
      name,
      description,
      meal_times: mealTimes,
      price,
      images,
      is_featured: isFeatured,
      sort_order: initial?.sort_order ?? 0,
      nutrition: { protein_g: protein, carbs_g: carbs, fibre_g: fibre, calories },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
      <Textarea label="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">Available for</p>
        <div className="flex flex-wrap gap-2">
          {MEAL_TIMES.map((t) => {
            const active = mealTimes.includes(t)
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleMealTime(t)}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                  active ? 'bg-green text-cream-soft' : 'bg-cream-deep/60 text-ink-soft hover:bg-cream-deep'
                }`}
              >
                {t}
              </button>
            )
          })}
        </div>
        <p className="mt-1.5 text-xs text-ink-soft">Pick both Lunch and Dinner if the same dish is sold at both times — no need to add it twice.</p>
      </div>

      <Input label="Price (₹)" type="number" min={0} required value={price} onChange={(e) => setPrice(Number(e.target.value))} />

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">Photos</p>
        <div className="flex flex-wrap gap-2.5">
          {images.map((url) => (
            <div key={url} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-cream-deep bg-cream-deep/40">
              <Image src={url} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                aria-label="Remove image"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/60 text-[10px] font-bold text-cream-soft"
              >
                ✕
              </button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-cream-deep text-ink-soft transition-colors hover:border-green hover:text-green disabled:opacity-50"
            >
              {uploading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <>
                  <span className="text-lg leading-none">+</span>
                  <span className="text-[10px] font-bold uppercase">Add</span>
                </>
              )}
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="mt-1.5 text-xs text-ink-soft">First photo is the cover shown on the menu. Up to {MAX_IMAGES} photos.</p>
      </div>

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
        <Button type="submit" className="flex-1" loading={submitting} disabled={uploading}>
          Save Item
        </Button>
      </div>
    </form>
  )
}
