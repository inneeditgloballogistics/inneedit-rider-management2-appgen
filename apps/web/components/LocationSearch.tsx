'use client';

import { useEffect, useRef, useState } from 'react';
import { useGeocoding } from '@/hooks/useGeocoding';

interface LocationSearchProps {
  value: string;
  onChange: (value: string, lat?: number, lng?: number, address?: string) => void;
  placeholder?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function LocationSearch({ value, onChange, placeholder = 'Search location' }: LocationSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const sessionTokenRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const { reverseGeocode } = useGeocoding();

  useEffect(() => {
    const initAutocomplete = () => {
      if (!inputRef.current) return;
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.warn('Google Maps API not yet loaded');
        setTimeout(initAutocomplete, 500);
        return;
      }

      try {
        // Create a fresh session token for this search session
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();

        // ✅ PLACES API - Autocomplete with Telangana bounds
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode'],
          sessionToken: sessionTokenRef.current,
          fields: ['place_id', 'formatted_address', 'name'],
          componentRestrictions: { country: 'in' },
          bounds: new window.google.maps.LatLngBounds(
            new window.google.maps.LatLng(15.5, 77.9),   // Southwest corner of Telangana
            new window.google.maps.LatLng(17.8, 79.8)    // Northeast corner of Telangana
          )
        });

        autocompleteRef.current = autocomplete;

        autocomplete.addListener('place_changed', async () => {
          const place = autocomplete.getPlace();
          
          if (!place.place_id) {
            console.warn('No place selected');
            return;
          }

          setIsValidating(true);

          try {
            // ✅ MAPS JAVASCRIPT API & PLACES API - Get place details with geometry
            const service = new window.google.maps.places.PlacesService(document.createElement('div'));
            
            service.getDetails({
              placeId: place.place_id,
              fields: ['geometry', 'formatted_address', 'address_components', 'name']
            }, async (result: any, status: string) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && result.geometry?.location) {
                const lat = typeof result.geometry.location.lat === 'function' 
                  ? result.geometry.location.lat() 
                  : result.geometry.location.lat;
                const lng = typeof result.geometry.location.lng === 'function' 
                  ? result.geometry.location.lng() 
                  : result.geometry.location.lng;
                
                // ✅ GEOCODING API - Validate & enhance address with reverse geocoding
                try {
                  const geocodedAddress = await reverseGeocode(lat, lng);
                  const validatedAddress = geocodedAddress?.formatted_address || result.formatted_address;
                  
                  // Pass all details back
                  onChange(validatedAddress, lat, lng, validatedAddress);
                  
                  console.log('📍 Location confirmed:', { 
                    address: validatedAddress,
                    latitude: lat, 
                    longitude: lng,
                    city: geocodedAddress?.city,
                    state: geocodedAddress?.state,
                    pincode: geocodedAddress?.pincode
                  });
                } catch (geocodingError) {
                  // Fallback if Geocoding API fails
                  console.warn('Geocoding API validation skipped, using Places data:', geocodingError);
                  onChange(result.formatted_address, lat, lng, result.formatted_address);
                }
                
                // Reset session token after selection for next search
                sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
              } else {
                console.error('PlacesService error:', status);
              }
              setIsValidating(false);
            });
          } catch (error) {
            console.error('Error processing location:', error);
            setIsValidating(false);
          }
        });

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
      }
    };

    initAutocomplete();

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onChange, reverseGeocode]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
        disabled={isValidating}
      />
      {(!isInitialized || isValidating) && (
        <div className="absolute right-3 top-2.5">
          <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
