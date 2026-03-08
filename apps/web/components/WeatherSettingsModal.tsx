'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Zap } from 'lucide-react';

interface WeatherSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (latitude: number, longitude: number, locationName: string) => void;
  currentLocation?: { latitude: number; longitude: number; name: string };
}

export default function WeatherSettingsModal({
  isOpen,
  onClose,
  onLocationSelect,
  currentLocation,
}: WeatherSettingsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'auto' | 'manual'>('auto');

  const handleAutoDetect = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Get location name from coordinates
          try {
            const response = await fetch(
              `/api/geocoding?lat=${latitude}&lng=${longitude}`
            );
            const data = await response.json();
            const locationName = data.address?.city || data.address?.state || 'Current Location';
            
            onLocationSelect(latitude, longitude, locationName);
            setLoading(false);
            onClose();
          } catch (error) {
            console.error('Error getting location name:', error);
            onLocationSelect(latitude, longitude, 'Current Location');
            setLoading(false);
            onClose();
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLoading(false);
          alert('Unable to access your location. Please enable location services.');
        }
      );
    }
  };

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/geocoding?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      
      if (data.results) {
        setSearchResults(data.results.slice(0, 5));
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = (result: any) => {
    const locationName = result.address?.city || result.display_name || 'Selected Location';
    onLocationSelect(result.lat, result.lon, locationName);
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Weather Location Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Auto-detect button */}
          <div>
            <button
              onClick={handleAutoDetect}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all"
            >
              <Zap size={18} />
              {loading ? 'Detecting...' : 'Auto-Detect My Location'}
            </button>
            {currentLocation && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Current: {currentLocation.name}
              </p>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Manual location search */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <MapPin size={16} className="inline mr-2" />
              Search Location
            </label>
            <input
              type="text"
              placeholder="Search city, area, or address..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectLocation(result)}
                  className="w-full text-left p-3 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                  <p className="font-medium text-gray-900 text-sm">
                    {result.address?.city || result.display_name?.split(',')[0]}
                  </p>
                  <p className="text-xs text-gray-500">
                    {result.address?.state && `${result.address.state}, `}
                    {result.address?.country || result.display_name?.split(',').pop()}
                  </p>
                </button>
              ))}
            </div>
          )}

          {searchQuery.length > 0 && searchResults.length === 0 && !loading && (
            <p className="text-center text-sm text-gray-500">No results found</p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
