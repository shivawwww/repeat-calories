'use client'

import { useEffect, useRef } from 'react'
import type mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

export default function MapPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number
  lng: number
  onChange: (lat: number, lng: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!TOKEN || !containerRef.current) return
    let cancelled = false

    import('mapbox-gl').then((mod) => {
      if (cancelled || !containerRef.current) return
      const mapboxgl = mod.default
      mapboxgl.accessToken = TOKEN

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: 15,
      })
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

      const marker = new mapboxgl.Marker({ color: '#E87722', draggable: true }).setLngLat([lng, lat]).addTo(map)
      marker.on('dragend', () => {
        const pos = marker.getLngLat()
        onChangeRef.current(pos.lat, pos.lng)
      })
      map.on('click', (e) => {
        marker.setLngLat(e.lngLat)
        onChangeRef.current(e.lngLat.lat, e.lngLat.lng)
      })

      mapRef.current = map
      markerRef.current = marker
    })

    return () => {
      cancelled = true
      markerRef.current?.remove()
      mapRef.current?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (markerRef.current) {
      const current = markerRef.current.getLngLat()
      if (Math.abs(current.lat - lat) > 1e-6 || Math.abs(current.lng - lng) > 1e-6) {
        markerRef.current.setLngLat([lng, lat])
        mapRef.current?.setCenter([lng, lat])
      }
    }
  }, [lat, lng])

  if (!TOKEN) return null

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-cream-deep">
      <div ref={containerRef} className="h-48 w-full" />
      <p className="bg-cream-deep/40 px-3 py-1.5 text-[11px] text-ink-soft">Drag the pin or tap the map to fine-tune your location.</p>
    </div>
  )
}
