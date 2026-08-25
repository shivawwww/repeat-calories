export interface ReverseGeocodeResult {
  full_address: string
  area: string
  city: string
  pincode: string
}

interface MapboxContextItem {
  id?: string
  text?: string
}

interface MapboxFeature {
  place_name?: string
  place_type?: string[]
  text?: string
  context?: MapboxContextItem[]
}

// Client-side helper — called from AddressForm after "use current location" or a pin drop.
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) return null

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=address,postcode,place`
  const res = await fetch(url)
  if (!res.ok) return null

  const data: { features?: MapboxFeature[] } = await res.json()
  const features: MapboxFeature[] = data.features ?? []

  const place = (type: string) => features.find((f) => f.place_type?.includes(type))

  const addressFeature = place('address') ?? features[0]
  const postcodeFeature = place('postcode')
  const placeFeature = place('place') // city/town

  return {
    full_address: addressFeature?.place_name ?? '',
    area:
      addressFeature?.context?.find((c) => c.id?.startsWith('neighborhood'))?.text ??
      addressFeature?.context?.find((c) => c.id?.startsWith('locality'))?.text ??
      '',
    city: placeFeature?.text ?? 'Coimbatore',
    pincode: postcodeFeature?.text ?? '',
  }
}

export function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  })
}
