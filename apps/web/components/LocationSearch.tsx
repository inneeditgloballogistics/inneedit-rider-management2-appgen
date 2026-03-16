'use client';

import { useEffect, useRef, useState } from 'react';
import { useGeocoding } from '@/hooks/useGeocoding';

interface LocationSearchProps {
  value: string;
  onChange: (value: string, lat?: number, lng?: number, address?: string, addressComponents?: any) => void;
  placeholder?: string;
  showCoordinates?: boolean;
}

interface Prediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function LocationSearch({ value, onChange, placeholder = 'Search location', showCoordinates = true }: LocationSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const sessionTokenRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number; address: string; city?: string; state?: string; pincode?: string } | null>(null);
  const { reverseGeocode } = useGeocoding();

  // Fetch predictions from Google Places Autocomplete Service
  useEffect(() => {
    if (!value || value.length < 2) {
      setPredictions([]);
      setShowSuggestions(false);
      return;
    }

    if (!autocompleteServiceRef.current || !window.google?.maps?.places) {
      return;
    }

    setIsLoading(true);
    
    // Use Autocomplete Service for predictions
    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: value,
        componentRestrictions: { country: 'in' },
        sessionToken: sessionTokenRef.current
      },
      (predictions: Prediction[] | null) => {
        if (predictions) {
          setPredictions(predictions.slice(0, 8)); // Limit to 8 results
          setShowSuggestions(predictions.length > 0);
        } else {
          setPredictions([]);
          setShowSuggestions(false);
        }
        setIsLoading(false);
      }
    );
  }, [value]);

  // Initialize Google Places Services
  useEffect(() => {
    const initServices = () => {
      if (!window.google?.maps?.places) {
        setTimeout(initServices, 500);
        return;
      }

      try {
        // Initialize AutocompleteService for predictions
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        
        // Create a hidden div for PlacesService
        const div = document.createElement('div');
        placesServiceRef.current = new window.google.maps.places.PlacesService(div);
        
        // Initialize session token
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing Google Places services:', error);
      }
    };

    initServices();
  }, []);

  const handlePredictionSelect = async (prediction: Prediction) => {
    setIsLoading(true);
    setShowSuggestions(false);
    
    try {
      if (!placesServiceRef.current) return;

      // Get place details using place_id
      placesServiceRef.current.getDetails(
        {
          placeId: prediction.place_id,
          sessionToken: sessionTokenRef.current,
          fields: ['geometry', 'formatted_address', 'address_components', 'name']
        },
        async (place: any, status: string) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            try {
              let lat = place.geometry.location.lat();
              let lng = place.geometry.location.lng();

              // Get detailed address components
              const geocodedAddress = await reverseGeocode(lat, lng);
              const address = geocodedAddress?.formatted_address || place.formatted_address;

              setSelectedCoords({
                lat,
                lng,
                address,
                city: geocodedAddress?.city,
                state: geocodedAddress?.state,
                pincode: geocodedAddress?.pincode
              });

              onChange(address, lat, lng, address, geocodedAddress);

              if (inputRef.current) {
                inputRef.current.value = address;
              }

              console.log('📍 Location selected:', {
                place: prediction.description,
                address,
                lat,
                lng,
                components: geocodedAddress
              });

              // Reset session token for next search
              sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
            } catch (error) {
              console.error('Error getting geocoded address:', error);
              setSelectedCoords({
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                address: place.formatted_address
              });
              onChange(place.formatted_address, place.geometry.location.lat(), place.geometry.location.lng(), place.formatted_address);
            }
          }
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Error selecting prediction:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative" ref={containerRef}>
        {/* Search Input */}
        <div className="relative flex items-center bg-white border border-slate-300 rounded-xl shadow-md hover:shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent">
          <svg className="absolute left-3 w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => value && value.length >= 2 && setShowSuggestions(true)}
            className="w-full pl-10 pr-10 py-3 bg-transparent focus:outline-none text-slate-900 placeholder-slate-500"
            disabled={isLoading}
            autoComplete="off"
          />
          
          <div className="absolute right-3">
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
            ) : selectedCoords ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedCoords(null);
                  onChange('');
                  setPredictions([]);
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
        
        {/* Predictions Dropdown - Google Maps Style */}
        {showSuggestions && predictions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-300 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
            {predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                type="button"
                onClick={() => handlePredictionSelect(prediction)}
                className="w-full text-left px-4 py-3 hover:bg-brand-50 transition-colors flex items-center gap-3 border-b border-slate-100 last:border-b-0 group"
              >
                <svg className="w-5 h-5 text-slate-400 group-hover:text-brand-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
          </div>
        )}
      </div>

      {/* Selected Location Details */}
      {selectedCoords && (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <p className="text-sm font-medium text-slate-900 mb-3">📍 <span className="text-slate-700">{selectedCoords.address}</span></p>
          <div className="grid grid-cols-2 gap-3">
            {selectedCoords.city && (
              <div>
                <p className="text-xs font-semibold text-slate-600">City</p>
                <p className="text-sm text-slate-900 mt-1">{selectedCoords.city}</p>
              </div>
            )}
            {selectedCoords.state && (
              <div>
                <p className="text-xs font-semibold text-slate-600">State</p>
                <p className="text-sm text-slate-900 mt-1">{selectedCoords.state}</p>
              </div>
            )}
            {selectedCoords.pincode && (
              <div>
                <p className="text-xs font-semibold text-slate-600">Postal Code</p>
                <p className="text-sm text-slate-900 mt-1">{selectedCoords.pincode}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-slate-600">Latitude</p>
              <p className="text-sm text-slate-900 mt-1 font-mono">{selectedCoords.lat.toFixed(6)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600">Longitude</p>
              <p className="text-sm text-slate-900 mt-1 font-mono">{selectedCoords.lng.toFixed(6)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
