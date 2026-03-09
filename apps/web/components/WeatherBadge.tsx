'use client';

import { useState, useEffect } from 'react';
import WeatherSettingsModal from './WeatherSettingsModal';
import './WeatherBadge.css';

interface WeatherData {
  current: {
    temp_c: number;
    condition: {
      text: string;
      icon: string;
    };
    is_day: number;
  };
  location: {
    name: string;
    region: string;
    country: string;
  };
}

interface WeatherBadgeProps {
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

export default function WeatherBadge({ latitude: propLat, longitude: propLng, locationName = 'Current Location' }: WeatherBadgeProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState<string>('');
  const [latitude, setLatitude] = useState<number | null>(propLat || null);
  const [longitude, setLongitude] = useState<number | null>(propLng || null);
  const [displayName, setDisplayName] = useState<string>(locationName);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
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

    // Auto-detect user location if not provided and not saved
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
  }, []);

  useEffect(() => {
    if (latitude && longitude) {
      fetchWeather();
    }
    
    // Update time every second
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }));
    };
    
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);
    
    return () => clearInterval(timeInterval);
  }, [latitude, longitude]);

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

  if (loading || !weather) {
    return (
      <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-full px-4 py-2 text-white text-sm font-medium shadow-lg animate-pulse">
        Loading weather...
      </div>
    );
  }

  // Get weather icon based on condition
  const getWeatherIcon = () => {
    const condition = weather.current.condition.text.toLowerCase();
    
    if (condition.includes('rain') || condition.includes('drizzle')) {
      return '🌧️';
    } else if (condition.includes('cloud')) {
      return '☁️';
    } else if (condition.includes('clear') || condition.includes('sunny')) {
      return '☀️';
    } else if (condition.includes('overcast')) {
      return '⛅';
    } else if (condition.includes('snow')) {
      return '❄️';
    } else if (condition.includes('thunder') || condition.includes('storm')) {
      return '⛈️';
    } else if (condition.includes('mist') || condition.includes('fog')) {
      return '🌫️';
    }
    
    return weather.current.is_day ? '☀️' : '🌙';
  };

  // Get dynamic gradient based on weather condition and time
  const getWeatherGradient = () => {
    const condition = weather.current.condition.text.toLowerCase();
    const isDay = weather.current.is_day === 1;

    // Rainy conditions
    if (condition.includes('rain') || condition.includes('drizzle')) {
      return isDay
        ? 'from-slate-400 to-slate-500'
        : 'from-slate-700 to-slate-800';
    }

    // Thunderstorm
    if (condition.includes('thunder') || condition.includes('storm')) {
      return isDay
        ? 'from-purple-500 to-purple-600'
        : 'from-purple-900 to-purple-950';
    }

    // Snow
    if (condition.includes('snow')) {
      return isDay
        ? 'from-cyan-300 to-cyan-400'
        : 'from-cyan-900 to-cyan-950';
    }

    // Cloudy
    if (condition.includes('cloud') || condition.includes('overcast')) {
      return isDay
        ? 'from-gray-400 to-gray-500'
        : 'from-gray-700 to-gray-800';
    }

    // Mist/Fog
    if (condition.includes('mist') || condition.includes('fog')) {
      return isDay
        ? 'from-blue-300 to-gray-400'
        : 'from-blue-900 to-gray-700';
    }

    // Clear/Sunny - default
    if (condition.includes('clear') || condition.includes('sunny')) {
      return isDay
        ? 'from-yellow-400 to-blue-400'
        : 'from-indigo-900 to-slate-800';
    }

    // Default: day blue / night indigo
    return isDay
      ? 'from-blue-400 to-blue-500'
      : 'from-indigo-800 to-slate-900';
  };

  // Get animation class based on weather
  const getWeatherAnimation = () => {
    const condition = weather.current.condition.text.toLowerCase();

    if (condition.includes('rain') || condition.includes('drizzle')) {
      return 'weather-rain-animation';
    }
    if (condition.includes('snow')) {
      return 'weather-snow-animation';
    }
    if (condition.includes('thunder') || condition.includes('storm')) {
      return 'weather-storm-animation';
    }
    if (condition.includes('cloud') || condition.includes('overcast')) {
      return 'weather-cloud-animation';
    }
    if (condition.includes('mist') || condition.includes('fog')) {
      return 'weather-fog-animation';
    }

    return '';
  };

  const finalDisplayName = displayName || (weather ? weather.location.name : 'Current Location');
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'short' });
  const monthDay = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const handleLocationSelect = (lat: number, lng: number, name: string) => {
    console.log('Location selected:', { lat, lng, name });
    setLatitude(lat);
    setLongitude(lng);
    setDisplayName(name);
    setLoading(true); // Reset loading state to show loading while fetching new weather
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('weatherLocation', JSON.stringify({
        latitude: lat,
        longitude: lng,
        name: name,
      }));
    }
  };

  const gradientClass = getWeatherGradient();
  const animationClass = getWeatherAnimation();

  return (
    <>
      <div
        onClick={() => setIsSettingsOpen(true)}
        className={`bg-gradient-to-r ${gradientClass} rounded-full px-4 py-2 text-white shadow-lg hover:shadow-xl hover:cursor-pointer transition-all flex items-center gap-2 whitespace-nowrap relative overflow-hidden ${animationClass}`}>
      
        {/* Animation overlay for rain, snow, etc. */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          {animationClass === 'weather-rain-animation' && (
            <div className="absolute inset-0">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-3 bg-white rounded-full opacity-60"
                  style={{
                    left: `${(i % 4) * 25}%`,
                    top: `${(i / 4) * 50}%`,
                    animation: `rainDrop 1s linear infinite`,
                    animationDelay: `${i * 0.125}s`,
                  }}
                />
              ))}
            </div>
          )}
          {animationClass === 'weather-snow-animation' && (
            <div className="absolute inset-0">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-70"
                  style={{
                    left: `${(i % 3) * 33}%`,
                    top: `${(i / 3) * 50}%`,
                    animation: `snowFall 2s linear infinite`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          )}
          {animationClass === 'weather-storm-animation' && (
            <div className="absolute inset-0 animate-pulse" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
          )}
        </div>
      
        <div className="text-2xl flex-shrink-0 relative z-10">{getWeatherIcon()}</div>
        
        <div className="flex flex-col gap-0 relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold">📍 {finalDisplayName}</span>
            <span className="text-base font-bold">{Math.round(weather.current.temp_c)}°C</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs opacity-90">
            <span>{dayName}, {monthDay}</span>
            <span className="font-medium text-[11px]">{time}</span>
          </div>
        </div>
      </div>

      <WeatherSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLocationSelect={handleLocationSelect}
        currentLocation={{
          latitude: latitude || 0,
          longitude: longitude || 0,
          name: finalDisplayName,
        }}
        onRefresh={() => {
          if (latitude && longitude) {
            fetchWeather();
          }
        }}
      />
    </>
  );
}
