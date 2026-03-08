'use client';

import { useState } from 'react';

interface AddressComponents {
  formatted_address: string;
  latitude: number;
  longitude: number;
  street_address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

interface GeocodingResult {
  formatted_address: string;
  latitude: number;
  longitude: number;
  placeId?: string;
}

export function useGeocoding() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reverse Geocoding: Convert lat/lng to address
  const reverseGeocode = async (
    lat: number,
    lng: number
  ): Promise<AddressComponents | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/geocoding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, action: 'reverse' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Reverse geocoding failed');
      }

      const data = await response.json();
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Reverse geocoding error:', message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Forward Geocoding: Convert address to lat/lng
  const forwardGeocode = async (
    address: string
  ): Promise<GeocodingResult[] | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/geocoding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, action: 'forward' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Forward geocoding failed');
      }

      const data = await response.json();
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Forward geocoding error:', message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Quick reverse geocoding via GET
  const quickReverseGeocode = async (
    lat: number,
    lng: number
  ): Promise<GeocodingResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/geocoding?lat=${lat}&lng=${lng}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Quick geocoding failed');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Quick geocoding error:', message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    reverseGeocode,
    forwardGeocode,
    quickReverseGeocode,
    loading,
    error,
  };
}
