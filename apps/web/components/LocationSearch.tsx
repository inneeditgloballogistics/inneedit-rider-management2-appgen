'use client';

import { useEffect, useRef, useState } from 'react';

interface LocationSearchProps {
  value: string;
  onChange: (value: string, lat?: number, lng?: number) => void;
  placeholder?: string;
}

export default function LocationSearch({ value, onChange, placeholder = 'Search location' }: LocationSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!window.google) return;
    
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current!, {
      types: ['geocode'],
      componentRestrictions: { country: 'in' }
    });

    autocompleteRef.current = autocomplete;

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry && place.formatted_address) {
        onChange(place.formatted_address, place.geometry.location.lat(), place.geometry.location.lng());
      }
    });

    setIsLoaded(true);

    return () => {
      autocompleteRef.current = null;
    };
  }, [onChange]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
    />
  );
}
