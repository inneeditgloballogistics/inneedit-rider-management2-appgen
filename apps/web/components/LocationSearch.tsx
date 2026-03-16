'use client';

import { useEffect, useRef, useState } from 'react';
import { useGeocoding } from '@/hooks/useGeocoding';
import dynamic from 'next/dynamic';

interface LocationSearchProps {
  value: string;
  onChange: (value: string, lat?: number, lng?: number, address?: string, addressComponents?: any) => void;
  placeholder?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

// Dynamic import for Google Maps component
const GoogleMapComponent = dynamic(() => import('@/components/MapPreview'), {
  ssr: false,
  loading: () => <div className="w-full h-48 bg-slate-100 rounded-lg animate-pulse flex items-center justify-center text-slate-500">Loading map...</div>
});

// Telangana specific locations for enhanced search
const TELANGANA_LOCATIONS = [
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { name: 'Secunderabad', lat: 17.3689, lng: 78.5294 },
  { name: 'Kukatpally', lat: 17.4691, lng: 78.4446 },
  { name: 'Banjara Hills', lat: 17.3972, lng: 78.4557 },
  { name: 'Jubilee Hills', lat: 17.3744, lng: 78.4554 },
  { name: 'Madhapur', lat: 17.4435, lng: 78.4374 },
  { name: 'Gachibowli', lat: 17.4406, lng: 78.4462 },
  { name: 'Kondapur', lat: 17.4531, lng: 78.4269 },
  { name: 'Hitech City', lat: 17.4437, lng: 78.4282 },
  { name: 'Uppal', lat: 17.3517, lng: 78.5583 },
  { name: 'LB Nagar', lat: 17.3667, lng: 78.5278 },
  { name: 'Lingampalli', lat: 17.4961, lng: 78.4456 },
  { name: 'JNTU', lat: 17.4465, lng: 78.4809 },
  { name: 'Koti', lat: 17.3619, lng: 78.4736 },
  { name: 'Charminar', lat: 17.3609, lng: 78.4734 },
  { name: 'Mehdipatnam', lat: 17.3825, lng: 78.4819 },
  { name: 'Dilsukhnagar', lat: 17.3672, lng: 78.5072 },
  { name: 'Narayanguda', lat: 17.3711, lng: 78.4972 },
  { name: 'Rajendra Nagar', lat: 17.3578, lng: 78.4536 },
  { name: 'Ameerpet', lat: 17.3838, lng: 78.4667 },
  { name: 'SR Nagar', lat: 17.4149, lng: 78.4662 },
  { name: 'Sardar Patel Nagar', lat: 17.4024, lng: 78.4728 },
  { name: 'Bhagyamandira', lat: 17.4117, lng: 78.4845 },
  { name: 'East Fort', lat: 17.3667, lng: 78.4865 },
  { name: 'West Fort', lat: 17.3661, lng: 78.4678 },
  { name: 'ECIL', lat: 17.4684, lng: 78.5217 },
  { name: 'Whitefield', lat: 17.4741, lng: 78.5517 },
  { name: 'Miyapur', lat: 17.4857, lng: 78.3944 },
  { name: 'Yadagirigutta', lat: 17.4417, lng: 78.1531 },
  { name: 'Shamshabad', lat: 17.2696, lng: 78.4306 },
  { name: 'Tandur', lat: 17.1989, lng: 78.1417 },
  { name: 'Ranga Reddy', lat: 17.1833, lng: 78.4167 },
  { name: 'Vikarabad', lat: 17.3314, lng: 78.1397 },
  { name: 'Tandoor', lat: 17.1989, lng: 78.1417 },
  { name: 'Medchal', lat: 17.2808, lng: 78.3614 },
  { name: 'Malkajgiri', lat: 17.3925, lng: 78.5328 },
  { name: 'Cantonment', lat: 17.3636, lng: 78.4708 },
  { name: 'Parigi', lat: 17.2625, lng: 78.5381 },
  { name: 'Mahbubnagar', lat: 16.7283, lng: 77.9811 },
  { name: 'Kodada', lat: 16.8339, lng: 78.3019 },
  { name: 'Wanaparthy', lat: 16.6019, lng: 77.8558 },
  { name: 'Jagitial', lat: 18.2467, lng: 78.7286 },
  { name: 'Peddapalli', lat: 18.5164, lng: 78.9939 },
  { name: 'Karimnagar', lat: 18.4279, lng: 78.8353 },
  { name: 'Sircilla', lat: 18.5256, lng: 78.8444 },
  { name: 'Parkal', lat: 17.9928, lng: 78.5619 },
  { name: 'Warangal', lat: 17.9689, lng: 78.6294 },
  { name: 'Hanamkonda', lat: 17.9497, lng: 78.6158 },
  { name: 'Jangaon', lat: 17.6681, lng: 78.4944 },
  { name: 'Hanwada', lat: 17.6964, lng: 78.6142 },
  { name: 'Khammam', lat: 17.2687, lng: 78.9844 },
  { name: 'Kothagudem', lat: 17.5644, lng: 80.1981 },
  { name: 'Karepalli', lat: 17.7858, lng: 80.0325 },
  { name: 'Manuguru', lat: 17.5806, lng: 80.1267 },
  { name: 'Sattupalli', lat: 17.1961, lng: 80.0269 },
  { name: 'Asifnagar', lat: 17.2342, lng: 78.4756 },
  { name: 'Vanasthalipuram', lat: 17.2656, lng: 78.5031 },
  { name: 'Tolichowki', lat: 17.2817, lng: 78.4747 },
  { name: 'Alaknanda', lat: 17.2908, lng: 78.4542 },
  { name: 'Bandlaguda', lat: 17.2933, lng: 78.4958 },
];

export default function LocationSearch({ value, onChange, placeholder = 'Search location' }: LocationSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const sessionTokenRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<typeof TELANGANA_LOCATIONS>([]);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const { reverseGeocode } = useGeocoding();

  // Filter Telangana locations based on input
  useEffect(() => {
    if (value && value.length > 0) {
      const filtered = TELANGANA_LOCATIONS.filter(loc =>
        loc.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredLocations(filtered.slice(0, 8));
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredLocations([]);
      setShowSuggestions(false);
    }
  }, [value]);

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

        // ✅ PLACES API - Autocomplete with Telangana bounds (strict)
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode'],
          sessionToken: sessionTokenRef.current,
          fields: ['place_id', 'formatted_address', 'name'],
          componentRestrictions: { country: 'in' },
          bounds: new window.google.maps.LatLngBounds(
            new window.google.maps.LatLng(15.4, 77.8),   // Southwest corner of Telangana (expanded)
            new window.google.maps.LatLng(18.6, 80.2)    // Northeast corner of Telangana (expanded)
          ),
          strictBounds: true // Only show results within bounds
        });

        autocompleteRef.current = autocomplete;

        autocomplete.addListener('place_changed', async () => {
          const place = autocomplete.getPlace();
          
          if (!place.place_id) {
            console.warn('No place selected');
            return;
          }

          setIsValidating(true);
          setShowSuggestions(false);

          try {
            // ✅ MAPS JAVASCRIPT API & PLACES API - Get place details with geometry
            const service = new window.google.maps.places.PlacesService(document.createElement('div'));
            
            service.getDetails({
              placeId: place.place_id,
              fields: ['geometry', 'formatted_address', 'address_components', 'name']
            }, async (result: any, status: string) => {
              console.log('PlacesService response:', { status, hasGeometry: !!result?.geometry, geometry: result?.geometry });
              
              if (status === window.google.maps.places.PlacesServiceStatus.OK && result?.geometry?.location) {
                let lat, lng;
                
                // Handle both function and property access
                if (typeof result.geometry.location.lat === 'function') {
                  lat = result.geometry.location.lat();
                  lng = result.geometry.location.lng();
                } else {
                  lat = result.geometry.location.lat;
                  lng = result.geometry.location.lng;
                }
                
                console.log('Extracted coordinates:', { lat, lng, type_lat: typeof lat, type_lng: typeof lng });
                
                // ✅ GEOCODING API - Validate & enhance address with reverse geocoding
                try {
                  const geocodedAddress = await reverseGeocode(lat, lng);
                  const validatedAddress = geocodedAddress?.formatted_address || result.formatted_address;
                  
                  console.log('📍 Location confirmed:', { 
                    address: validatedAddress,
                    latitude: lat, 
                    longitude: lng,
                    city: geocodedAddress?.city,
                    state: geocodedAddress?.state,
                    pincode: geocodedAddress?.pincode
                  });
                
                  // Store coords for map display
                  setSelectedCoords({ lat, lng, address: validatedAddress });
                  
                  // Notify parent with geocoded address components
                  onChange(validatedAddress, lat, lng, validatedAddress, geocodedAddress);
                } catch (geocodingError) {
                  // Fallback if Geocoding API fails
                  console.warn('Geocoding API validation skipped, using Places data:', geocodingError);
                  setSelectedCoords({ lat, lng, address: result.formatted_address });
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

  const handleLocationSelect = async (location: typeof TELANGANA_LOCATIONS[0]) => {
    setIsValidating(true);
    setShowSuggestions(false);
    
    try {
      const geocodedAddress = await reverseGeocode(location.lat, location.lng);
      const address = geocodedAddress?.formatted_address || `${location.name}, Telangana`;
      
      setSelectedCoords({ lat: location.lat, lng: location.lng, address });
      onChange(address, location.lat, location.lng, address, geocodedAddress);
      
      if (inputRef.current) {
        inputRef.current.value = address;
      }
      
      console.log('📍 Location selected from suggestions:', {
        name: location.name,
        lat: location.lat,
        lng: location.lng,
        address,
        components: geocodedAddress
      });
    } catch (error) {
      console.error('Error selecting location:', error);
      const address = `${location.name}, Telangana`;
      setSelectedCoords({ lat: location.lat, lng: location.lng, address });
      onChange(address, location.lat, location.lng, address);
      if (inputRef.current) {
        inputRef.current.value = address;
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleMapMarkerMove = (newLat: number, newLng: number, newAddress: string) => {
    setSelectedCoords({ lat: newLat, lng: newLng, address: newAddress });
    onChange(newAddress, newLat, newLng, newAddress);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value && value.length > 0 && setShowSuggestions(true)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
          disabled={isValidating}
        />
        {(!isInitialized || isValidating) && (
          <div className="absolute right-3 top-2.5">
            <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Telangana Location Suggestions */}
        {showSuggestions && filteredLocations.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {filteredLocations.map((location) => (
              <button
                key={location.name}
                type="button"
                onClick={() => handleLocationSelect(location)}
                className="w-full text-left px-3 py-2 hover:bg-brand-50 transition-colors flex items-center gap-2 border-b border-slate-100 last:border-b-0"
              >
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-slate-900 font-medium">{location.name}</span>
                <span className="text-xs text-slate-500 ml-auto">Telangana</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Preview with Draggable Marker */}
      {selectedCoords && (
        <div className="w-full">
          <div className="text-xs font-semibold text-slate-600 mb-2 px-1">Location Map (Drag marker to adjust)</div>
          <GoogleMapComponent
            lat={selectedCoords.lat}
            lng={selectedCoords.lng}
            address={selectedCoords.address}
            onMarkerMove={handleMapMarkerMove}
          />
          <div className="mt-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs font-semibold text-green-700">📍 Selected Location:</p>
            <p className="text-xs text-green-600 mt-1">{selectedCoords.address}</p>
            <p className="text-xs text-green-600 mt-1">Lat: {selectedCoords.lat.toFixed(4)}, Lng: {selectedCoords.lng.toFixed(4)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
