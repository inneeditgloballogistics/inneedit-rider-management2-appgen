'use client';

import { useEffect, useRef, useState } from 'react';

interface PlaceDetails {
  storeName: string;
  fullAddress: string;
  area: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

interface GooglePlacesAutocompleteProps {
  onPlaceSelected: (details: PlaceDetails) => void;
  placeholder?: string;
  className?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function GooglePlacesAutocomplete({
  onPlaceSelected,
  placeholder = 'Search for a location...',
  className = '',
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!inputRef.current || !window.google) return;

    const newAutocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['name', 'formatted_address', 'address_components', 'geometry'],
      componentRestrictions: { country: 'in' }, // Restrict to India
    });

    newAutocomplete.addListener('place_changed', () => {
      const place = newAutocomplete.getPlace();
      if (!place.geometry) {
        console.error('No geometry found for selected place');
        return;
      }

      setIsLoading(true);

      // Extract address components
      const addressComponents = place.address_components || [];
      let area = '';
      let city = '';
      let state = '';
      let country = '';
      let pincode = '';

      addressComponents.forEach((component: any) => {
        const types = component.types;

        if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
          area = component.long_name;
        }
        if (types.includes('locality')) {
          city = component.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          state = component.long_name;
        }
        if (types.includes('country')) {
          country = component.long_name;
        }
        if (types.includes('postal_code')) {
          pincode = component.long_name;
        }
      });

      const details: PlaceDetails = {
        storeName: place.name || '',
        fullAddress: place.formatted_address || '',
        area,
        city,
        state,
        country,
        pincode,
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
      };

      onPlaceSelected(details);
      setIsLoading(false);
    });

    setAutocomplete(newAutocomplete);
  }, [onPlaceSelected]);

  if (!window.google) {
    return (
      <div className="relative">
        <input
          type="text"
          disabled
          placeholder="Google Maps not loaded. Check API key in .env file."
          className={`w-full px-4 py-2.5 pr-10 rounded-lg border border-red-300 bg-red-50 text-red-600 outline-none ${className}`}
        />
        <i className="ph-bold ph-warning absolute right-3 top-1/2 -translate-y-1/2 text-red-500"></i>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 pr-10 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none ${className}`}
      />
      <i className={`ph-bold ${isLoading ? 'ph-spinner-gap animate-spin' : 'ph-map-pin'} absolute right-3 top-1/2 -translate-y-1/2 text-slate-400`}></i>
    </div>
  );
}
