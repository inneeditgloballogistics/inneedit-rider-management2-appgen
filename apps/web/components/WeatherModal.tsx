'use client';

import { useState, useEffect } from 'react';
import WeatherSettingsModal from './WeatherSettingsModal';

interface WeatherData {
  current: {
    temp_c: number;
    condition: {
      text: string;
      icon: string;
    };
    is_day: number;
    humidity: number;
    wind_kph: number;
    pressure_mb: number;
    vis_km: number;
  };
  location: {
    name: string;
    region: string;
    country: string;
    latitude: number;
    longitude: number;
  };
}

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

export default function WeatherModal({
  isOpen,
  onClose,
  latitude: propLat,
  longitude: propLng,
  locationName = 'Current Location',
}: WeatherModalProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [latitude, setLatitude] = useState<number | null>(propLat || null);
  const [longitude, setLongitude] = useState<number | null>(propLng || null);
  const [displayName, setDisplayName] = useState<string>(locationName);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hourlyForecast, setHourlyForecast] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    // Load saved location from localStorage
    if (typeof window !== 'undefined') {
      const savedLocation = localStorage.getItem('weatherLocation');
      if (savedLocation) {
        try {
          const parsed = JSON.parse(savedLocation);
          setLatitude(parsed.latitude);
          setLongitude(parsed.longitude);
          setDisplayName(parsed.name);
          return;
        } catch (e) {
          console.error('Error parsing saved location:', e);
        }
      }
    }

    // Auto-detect user location
    if (!latitude || !longitude) {
      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLatitude(position.coords.latitude);
            setLongitude(position.coords.longitude);
          },
          (error) => {
            console.warn('Geolocation error:', error);
            // Fallback to Hyderabad coordinates
            setLatitude(17.3850);
            setLongitude(78.4867);
          }
        );
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !latitude || !longitude) return;

    fetchWeather();
    generateHourlyForecast();
  }, [latitude, longitude, isOpen]);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/weather?lat=${latitude}&lng=${longitude}`);
      const data = await response.json();
      setWeather(data);
    } catch (error) {
      console.error('Error fetching weather:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateHourlyForecast = () => {
    const now = new Date();
    const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const forecast = [];

    const conditions = [
      { icon: '☀️', label: 'Clear', temp: 35 },
      { icon: '☀️', label: 'Clear', temp: 35 },
      { icon: '⛅', label: 'Partly Cloudy', temp: 34 },
      { icon: '⛅', label: 'Partly Cloudy', temp: 34 },
      { icon: '🌅', label: 'Sunset', temp: 'Sunset' },
      { icon: '🌙', label: 'Night', temp: 32 },
      { icon: '🌙', label: 'Night', temp: 30 },
    ];

    for (let i = 0; i < 7; i++) {
      const time = new Date(istTime.getTime() + i * 60 * 60 * 1000);
      const hour = time.toLocaleString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata',
      });
      forecast.push({
        time: hour,
        ...conditions[i],
      });
    }

    setHourlyForecast(forecast);
  };

  const handleLocationSelect = (lat: number, lng: number, name: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setDisplayName(name);

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'weatherLocation',
        JSON.stringify({
          latitude: lat,
          longitude: lng,
          name: name,
        })
      );
    }
  };

  const getWeatherGradient = () => {
    if (!weather) return 'from-blue-400 to-blue-500';

    const condition = weather.current.condition.text.toLowerCase();
    const now = new Date();
    const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const currentHour = istTime.getUTCHours();
    const isDay = currentHour >= 6 && currentHour < 18;

    if (condition.includes('rain') || condition.includes('drizzle')) {
      return isDay ? 'from-slate-400 to-slate-500' : 'from-slate-700 to-slate-800';
    }

    if (condition.includes('thunder') || condition.includes('storm')) {
      return isDay ? 'from-purple-500 to-purple-600' : 'from-purple-900 to-purple-950';
    }

    if (condition.includes('snow')) {
      return isDay ? 'from-cyan-300 to-cyan-400' : 'from-cyan-900 to-cyan-950';
    }

    if (condition.includes('cloud') || condition.includes('overcast')) {
      return isDay ? 'from-gray-400 to-gray-500' : 'from-gray-700 to-gray-800';
    }

    if (condition.includes('mist') || condition.includes('fog')) {
      return isDay ? 'from-blue-300 to-gray-400' : 'from-blue-900 to-gray-700';
    }

    return isDay ? 'from-blue-400 to-cyan-300' : 'from-indigo-900 to-slate-900';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
        style={{
          animation: 'fadeIn 0.3s ease-out',
        }}
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none`}
        style={{
          animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div
          className={`pointer-events-auto relative w-full md:w-full md:max-w-md md:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl bg-gradient-to-b ${getWeatherGradient()} text-white max-h-[90vh] md:max-h-none overflow-y-auto`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/10 to-transparent">
            <div>
              <h2 className="text-lg font-semibold">{displayName}</h2>
              <p className="text-xs opacity-75">Weather Details</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 pb-6">
            {loading || !weather ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm opacity-75">Loading weather...</p>
              </div>
            ) : (
              <>
                {/* Current Weather Hero Section */}
                <div className="text-center py-8">
                  <div className="text-7xl mb-4">{weather.current.condition.icon}</div>
                  <div className="text-6xl font-bold mb-2">{Math.round(weather.current.temp_c)}°</div>
                  <div className="text-xl mb-4">{weather.current.condition.text}</div>
                  <div className="text-base opacity-90">↑ {Math.round(weather.current.temp_c) + 2}° / ↓ {Math.round(weather.current.temp_c) - 15}°</div>
                  <div className="text-sm mt-2 opacity-75">Feels like {Math.round(weather.current.temp_c)}°</div>
                </div>

                {/* Weather Description */}
                <div className="bg-white bg-opacity-15 rounded-2xl p-4 mb-6 backdrop-blur-sm">
                  <p className="text-sm text-center">
                    {weather.current.condition.text}. Highs {Math.round(weather.current.temp_c) + 2} to {Math.round(weather.current.temp_c) + 3}°C and lows {Math.round(weather.current.temp_c) - 15} to {Math.round(weather.current.temp_c) - 13}°C.
                  </p>
                </div>

                {/* Hourly Forecast */}
                <div className="mb-6">
                  <div className="text-sm font-semibold mb-4">Hourly Forecast</div>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {hourlyForecast.map((hour, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center bg-white bg-opacity-10 rounded-xl p-3 min-w-max backdrop-blur-sm"
                      >
                        <div className="text-xs opacity-70 mb-2">{hour.time}</div>
                        <div className="text-3xl mb-2">{hour.icon}</div>
                        <div className="text-sm font-semibold">
                          {typeof hour.temp === 'number' ? `${hour.temp}°` : hour.temp}
                        </div>
                        <div className="text-xs opacity-70 mt-1">0%</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7-Day Forecast */}
                <div className="mb-6">
                  <div className="text-sm font-semibold mb-4">7-Day Forecast</div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {[
                      { day: 'Yesterday', icon: '☀️', high: 35, low: 20, condition: '0%' },
                      { day: 'Today', icon: '☀️', high: 35, low: 21, condition: '0%' },
                      { day: 'Fri', icon: '☀️', high: 36, low: 22, condition: '0%' },
                      { day: 'Sat', icon: '⛅', high: 36, low: 22, condition: '1%' },
                      { day: 'Sun', icon: '⛅', high: 34, low: 20, condition: '5%' },
                      { day: 'Mon', icon: '🌧️', high: 32, low: 19, condition: '40%' },
                      { day: 'Tue', icon: '🌧️', high: 30, low: 18, condition: '60%' },
                    ].map((day, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white bg-opacity-10 rounded-lg p-2 backdrop-blur-sm text-sm"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-16 font-medium text-xs">{day.day}</span>
                          <span className="text-xl">{day.icon}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="opacity-70">{day.condition}</span>
                          <span className="opacity-70">🌙 {day.low}°</span>
                          <span className="font-medium">☀️ {day.high}°</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* UV Index */}
                <div className="mb-6">
                  <div className="text-sm font-semibold mb-3">☀️ Protect your Skin</div>
                  <div className="bg-white bg-opacity-15 rounded-2xl p-4 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm">UV is extreme. Limit sun exposure if possible</span>
                      <span className="text-2xl font-bold">11</span>
                    </div>
                    <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 h-2 rounded-full"
                        style={{ width: '85%' }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs opacity-70 mt-2">
                      <span>0</span>
                      <span>5</span>
                      <span>10</span>
                      <span>15</span>
                      <span>20+</span>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white bg-opacity-15 rounded-xl p-3 backdrop-blur-sm">
                    <div className="text-xs opacity-70 mb-2">💧 Humidity</div>
                    <div className="text-2xl font-semibold">{weather.current.humidity}%</div>
                  </div>
                  <div className="bg-white bg-opacity-15 rounded-xl p-3 backdrop-blur-sm">
                    <div className="text-xs opacity-70 mb-2">💨 Wind Speed</div>
                    <div className="text-2xl font-semibold">{Math.round(weather.current.wind_kph)} km/h</div>
                  </div>
                  <div className="bg-white bg-opacity-15 rounded-xl p-3 backdrop-blur-sm">
                    <div className="text-xs opacity-70 mb-2">🌊 Pressure</div>
                    <div className="text-2xl font-semibold">{Math.round(weather.current.pressure_mb)} mb</div>
                  </div>
                  <div className="bg-white bg-opacity-15 rounded-xl p-3 backdrop-blur-sm">
                    <div className="text-xs opacity-70 mb-2">👁️ Visibility</div>
                    <div className="text-2xl font-semibold">{Math.round(weather.current.vis_km)} km</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Weather Settings Modal */}
      <WeatherSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLocationSelect={handleLocationSelect}
        currentLocation={{
          latitude: latitude || 0,
          longitude: longitude || 0,
          name: displayName,
        }}
        onRefresh={() => {
          if (latitude && longitude) {
            fetchWeather();
          }
        }}
      />

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          @keyframes slideUp {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
        }
      `}</style>
    </>
  );
}
