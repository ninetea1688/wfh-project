import { useState, useEffect } from 'react'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'เบราว์เซอร์ไม่รองรับ GPS', loading: false }))
      return
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          error: null,
          loading: false,
        })
      },
      (err) => {
        let message = 'ไม่สามารถรับพิกัด GPS ได้'
        if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
          message = 'ไม่ได้รับอนุญาตเข้าถึง GPS — การลงชื่อจะดำเนินการต่อโดยไม่มีพิกัด'
        } else if (err.code === GeolocationPositionError.TIMEOUT) {
          message = 'หมดเวลารอ GPS — กรุณาลองใหม่'
        }
        setState((s) => ({ ...s, error: message, loading: false }))
      },
      options
    )
  }, [])

  return state
}
