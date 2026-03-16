'use client';

import { useEffect, useRef, useState } from 'react';
import { useGeocoding } from '@/hooks/useGeocoding';
import dynamic from 'next/dynamic';

interface LocationSearchProps {
  value: string;
  onChange: (value: string, lat?: number, lng?: number, address?: string, addressComponents?: any) => void;
  placeholder?: string;
  showCoordinates?: boolean;
}

interface AutocompleteResult {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text?: string;
  types: string[];
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

export default function LocationSearch({ value, onChange, placeholder = 'Search location', showCoordinates = true }: LocationSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const sessionTokenRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<typeof TELANGANA_LOCATIONS>([]);
  const [autocompletePredictions, setAutocompletePredictions] = useState<AutocompleteResult[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number; address: string; city?: string; state?: string; pincode?: string } | null>(null);
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

        // PLACES API - Autocomplete with Telangana bounds (strict)
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode'],
          sessionToken: sessionTokenRef.current,
          fields: ['place_id', 'formatted_address', 'name', 'geometry'],
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
          
          console.log('📍 Place selected from autocomplete:', { place_id: place?.place_id, formattedAddress: place?.formatted_address });
          
          if (!place || !place.place_id) {
            console.warn('No place selected or no place_id');
            return;
          }

          setIsValidating(true);
          setShowSuggestions(false);

          try {
            // MAPS JAVASCRIPT API & PLACES API - Get place details with geometry
            const mapElement = document.body;
            const service = new window.google.maps.places.PlacesService(mapElement);
            
            console.log('📍 Requesting place details for place_id:', place.place_id);
            
            service.getDetails({
              placeId: place.place_id,
              sessionToken: sessionTokenRef.current,
              fields: ['geometry', 'formatted_address', 'address_components', 'name']
            }, async (result: any, status: string) => {
              console.log('📍 PlacesService.getDetails response:', { 
                status, 
                placeId: place.place_id,
                hasGeometry: !!result?.geometry,
                hasLocation: !!result?.geometry?.location 
              });
              
              if (status === window.google.maps.places.PlacesServiceStatus.OK && result?.geometry?.location) {
                try {
                  let lat, lng;
                  
                  // Handle both function and property access
                  if (typeof result.geometry.location.lat === 'function') {
                    lat = result.geometry.location.lat();
                    lng = result.geometry.location.lng();
                  } else {
                    lat = result.geometry.location.lat;
                    lng = result.geometry.location.lng;
                  }
                  
                  console.log('✅ Extracted coordinates from Places API:', { lat, lng, address: result.formatted_address });
                  
                  // GEOCODING API - Reverse geocode to extract detailed address components
                  try {
                    const geocodedAddress = await reverseGeocode(lat, lng);
                    const validatedAddress = geocodedAddress?.formatted_address || result.formatted_address;
                    
                    console.log('📍 Location confirmed via Geocoding API:', { 
                      address: validatedAddress,
                      latitude: lat, 
                      longitude: lng,
                      city: geocodedAddress?.city,
                      state: geocodedAddress?.state,
                      pincode: geocodedAddress?.pincode
                    });
                  
                    // Store coords for map display with all details
                    setSelectedCoords({
                      lat,
                      lng,
                      address: validatedAddress,
                      city: geocodedAddress?.city,
                      state: geocodedAddress?.state,
                      pincode: geocodedAddress?.pincode
                    });
                    
                    // Notify parent with geocoded address components
                    onChange(validatedAddress, lat, lng, validatedAddress, geocodedAddress);
                  } catch (geocodingError) {
                    // Fallback if Geocoding API fails - still use the coordinates we got from Places API
                    console.warn('Geocoding API failed, using Places data:', geocodingError);
                    setSelectedCoords({ lat, lng, address: result.formatted_address });
                    onChange(result.formatted_address, lat, lng, result.formatted_address);
                  }
                  } catch (extractError) {
                    console.error('Error extracting coordinates:', extractError);
                    // Fallback: still use what we have
                    setSelectedCoords({ lat, lng, address: result.formatted_address });
                    onChange(result.formatted_address, lat, lng, result.formatted_address);
                  }
              } else {
                console.error('PlacesService error or no geometry:', { status });
                // Fallback: If getDetails fails, try to use geometry from initial place object
                if (place?.geometry?.location) {
                  let lat, lng;
                  if (typeof place.geometry.location.lat === 'function') {
                    lat = place.geometry.location.lat();
                    lng = place.geometry.location.lng();
                  } else {
                    lat = place.geometry.location.lat;
                    lng = place.geometry.location.lng;
                  }
                  console.log('📍 Using geometry from initial place object:', { lat, lng });
                  try {
                    const geocodedAddress = await reverseGeocode(lat, lng);
                    setSelectedCoords({
                      lat,
                      lng,
                      address: geocodedAddress?.formatted_address || place.formatted_address,
                      city: geocodedAddress?.city,
                      state: geocodedAddress?.state,
                      pincode: geocodedAddress?.pincode
                    });
                    onChange(geocodedAddress?.formatted_address || place.formatted_address, lat, lng, geocodedAddress?.formatted_address || place.formatted_address, geocodedAddress);
                  } catch (error) {
                    setSelectedCoords({ lat, lng, address: place.formatted_address });
                    onChange(place.formatted_address, lat, lng, place.formatted_address);
                  }
                }
              }
              
              // Reset session token after selection for next search
              sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
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
      
      setSelectedCoords({
        lat: location.lat,
        lng: location.lng,
        address,
        city: geocodedAddress?.city,
        state: geocodedAddress?.state,
        pincode: geocodedAddress?.pincode
      });
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

  const handleMapMarkerMove = async (newLat: number, newLng: number, newAddress: string) => {
    try {
      const geocodedAddress = await reverseGeocode(newLat, newLng);
      const finalAddress = geocodedAddress?.formatted_address || newAddress;
      
      setSelectedCoords({
        lat: newLat,
        lng: newLng,
        address: finalAddress,
        city: geocodedAddress?.city,
        state: geocodedAddress?.state,
        pincode: geocodedAddress?.pincode
      });
      
      onChange(finalAddress, newLat, newLng, finalAddress, geocodedAddress);
    } catch (error) {
      console.error('Error updating map marker location:', error);
      setSelectedCoords({ lat: newLat, lng: newLng, address: newAddress });
      onChange(newAddress, newLat, newLng, newAddress);
    }
  };

  return (
    <div className="space-y-4">
      {/* Google Maps Style Search Bar */}
      <div className="relative" ref={containerRef}>
        <div className="relative flex items-center bg-white border border-slate-300 rounded-xl shadow-md hover:shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent">
          {/* Search Icon */}
          <svg className="absolute left-3 w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => value && value.length > 0 && setShowSuggestions(true)}
            className="w-full pl-10 pr-10 py-3 bg-transparent focus:outline-none text-slate-900 placeholder-slate-500"
            disabled={isValidating}
          />
          
          {/* Spinner or Clear Button */}
          <div className="absolute right-3">
            {isValidating ? (
              <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
            ) : selectedCoords ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedCoords(null);
                  onChange('');
                  if (inputRef.current) inputRef.current.value = '';
                }}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
        
        {/* Suggestions Dropdown - Google Maps Style */}
        {showSuggestions && (value.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-300 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
            {/* Telangana Location Suggestions */}
            {filteredLocations.length > 0 && (
              <>
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 sticky top-0">
                  Telangana Locations
                </div>
                {filteredLocations.map((location) => (
                  <button
                    key={location.name}
                    type="button"
                    onClick={() => handleLocationSelect(location)}
                    className="w-full text-left px-4 py-3 hover:bg-brand-50 transition-colors flex items-center gap-3 border-b border-slate-100 last:border-b-0 group"
                  >
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-brand-600 flex-shrink-0 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 font-medium truncate">{location.name}</p>
                      <p className="text-xs text-slate-500">Telangana, India</p>
                    </div>
                  </button>
                ))}
              </>
            )}
            
            {/* Google Places Autocomplete Predictions */}
            {autocompletePredictions.length > 0 && (
              <>
                {filteredLocations.length > 0 && (
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    Search Results
                  </div>
                )}
                {autocompletePredictions.map((prediction) => (
                  <button
                    key={prediction.place_id}
                    type="button"
                    onClick={() => {
                      if (inputRef.current) {
                        inputRef.current.value = prediction.description;
                      }
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-brand-50 transition-colors flex items-center gap-3 border-b border-slate-100 last:border-b-0 group"
                  >
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-brand-600 flex-shrink-0 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 font-medium truncate">{prediction.main_text}</p>
                      {prediction.secondary_text && (
                        <p className="text-xs text-slate-500 truncate">{prediction.secondary_text}</p>
                      )}
                    </div>
                  </button>
                ))}
              </>
            )}
            
            {filteredLocations.length === 0 && autocompletePredictions.length === 0 && (
              <div className="px-4 py-8 text-center text-slate-500">
                <svg className="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">No locations found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Coordinate Fields - Always Visible */}
      {showCoordinates && selectedCoords && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
            <label className="text-xs font-semibold text-slate-600">Latitude</label>
            <p className="text-sm font-mono text-slate-900 mt-1">{selectedCoords.lat.toFixed(6)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
            <label className="text-xs font-semibold text-slate-600">Longitude</label>
            <p className="text-sm font-mono text-slate-900 mt-1">{selectedCoords.lng.toFixed(6)}</p>
          </div>
        </div>
      )}

      {/* Address Details Grid */}
      {selectedCoords && (selectedCoords.city || selectedCoords.state || selectedCoords.pincode) && (
        <div className="grid grid-cols-3 gap-3">
          {selectedCoords.city && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
              <label className="text-xs font-semibold text-blue-700">City</label>
              <p className="text-sm text-blue-900 mt-1 truncate">{selectedCoords.city}</p>
            </div>
          )}
          {selectedCoords.state && (
            <div className="bg-green-50 rounded-lg border border-green-200 p-3">
              <label className="text-xs font-semibold text-green-700">State</label>
              <p className="text-sm text-green-900 mt-1 truncate">{selectedCoords.state}</p>
            </div>
          )}
          {selectedCoords.pincode && (
            <div className="bg-purple-50 rounded-lg border border-purple-200 p-3">
              <label className="text-xs font-semibold text-purple-700">Pincode</label>
              <p className="text-sm text-purple-900 mt-1 truncate">{selectedCoords.pincode}</p>
            </div>
          )}
        </div>
      )}

      {/* Map Preview with Draggable Marker */}
      {selectedCoords && (
        <div className="w-full space-y-2">
          <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm">
            <GoogleMapComponent
              lat={selectedCoords.lat}
              lng={selectedCoords.lng}
              address={selectedCoords.address}
              onMarkerMove={handleMapMarkerMove}
            />
          </div>
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-900">Location Confirmed</p>
                <p className="text-sm text-green-700 mt-1">{selectedCoords.address}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
