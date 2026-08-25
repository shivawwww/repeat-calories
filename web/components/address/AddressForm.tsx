'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { IconMapPin } from '@/components/ui/icons'
import { getCurrentLocation, reverseGeocode } from '@/lib/mapbox'
import { Address } from '@/types/models'
import MapPicker from './MapPicker'

const LABELS: Address['label'][] = ['Home', 'Work', 'Other']

export type AddressFormValues = Omit<Address, 'address_id'>

export default function AddressForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
  showSetDefault = true,
}: {
  initial?: Partial<AddressFormValues>
  onSubmit: (values: AddressFormValues) => void
  onCancel?: () => void
  submitting?: boolean
  showSetDefault?: boolean
}) {
  const [label, setLabel] = useState<Address['label']>(initial?.label ?? 'Home')
  const [fullAddress, setFullAddress] = useState(initial?.full_address ?? '')
  const [area, setArea] = useState(initial?.area ?? '')
  const [city, setCity] = useState(initial?.city ?? 'Coimbatore')
  const [pincode, setPincode] = useState(initial?.pincode ?? '')
  const [landmark, setLandmark] = useState(initial?.landmark ?? '')
  const [isDefault, setIsDefault] = useState(initial?.is_default ?? false)
  const [lat, setLat] = useState<number | undefined>(initial?.lat)
  const [lng, setLng] = useState<number | undefined>(initial?.lng)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState<string | null>(null)

  async function handleUseLocation() {
    setLocating(true)
    setLocateError(null)
    try {
      const pos = await getCurrentLocation()
      setLat(pos.lat)
      setLng(pos.lng)
      const geo = await reverseGeocode(pos.lat, pos.lng)
      if (geo) {
        setFullAddress(geo.full_address || fullAddress)
        setArea(geo.area || area)
        setCity(geo.city || city)
        setPincode(geo.pincode || pincode)
      }
    } catch {
      setLocateError('Could not access your location. You can still enter it manually below.')
    } finally {
      setLocating(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      label,
      full_address: fullAddress,
      area,
      city,
      pincode,
      landmark,
      is_default: isDefault,
      ...(lat !== undefined ? { lat } : {}),
      ...(lng !== undefined ? { lng } : {}),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-2">
        {LABELS.map((l) => (
          <button
            type="button"
            key={l}
            onClick={() => setLabel(l)}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
              label === l ? 'bg-green text-cream-soft' : 'bg-cream-deep/50 text-ink-soft hover:bg-cream-deep'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleUseLocation}
        disabled={locating}
        className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-green/50 bg-green-soft px-4 py-2.5 text-sm font-semibold text-green-dark transition-colors hover:bg-green-soft/70 disabled:opacity-60"
      >
        <IconMapPin className="h-4 w-4" />
        {locating ? 'Locating…' : 'Use current location'}
      </button>
      {locateError && <p className="text-xs text-red">{locateError}</p>}

      {lat !== undefined && lng !== undefined && <MapPicker lat={lat} lng={lng} onChange={(a, b) => { setLat(a); setLng(b) }} />}

      <Textarea
        label="Full address"
        required
        rows={2}
        value={fullAddress}
        onChange={(e) => setFullAddress(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Area" required value={area} onChange={(e) => setArea(e.target.value)} />
        <Input label="City" required value={city} onChange={(e) => setCity(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Pincode"
          required
          inputMode="numeric"
          value={pincode}
          onChange={(e) => setPincode(e.target.value)}
        />
        <Input label="Landmark (optional)" value={landmark} onChange={(e) => setLandmark(e.target.value)} />
      </div>

      {showSetDefault && (
        <label className="flex items-center gap-2 text-sm font-medium text-ink-soft">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="h-4 w-4 rounded accent-green"
          />
          Set as default address
        </label>
      )}

      <div className="mt-1 flex gap-3">
        {onCancel && (
          <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="flex-1" loading={submitting}>
          Save Address
        </Button>
      </div>
    </form>
  )
}
