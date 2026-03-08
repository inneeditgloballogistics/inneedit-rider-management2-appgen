import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get('lat') || '12.9716');
    const longitude = parseFloat(searchParams.get('lng') || '77.5946');

    try {
      // Using Open-Meteo (free, no API key required, real-time weather data)
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,is_day&timezone=auto`
      );

      if (!response.ok) {
        console.warn(`Weather API failed: ${response.status} ${response.statusText}`);
        throw new Error('Weather API failed');
      }

      const data = await response.json();
      const current = data.current;
      
      // Map weather codes to readable conditions
      const weatherCodeMap: { [key: number]: string } = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Foggy',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        71: 'Slight snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        80: 'Slight showers',
        81: 'Moderate showers',
        82: 'Heavy showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with hail',
        99: 'Thunderstorm with hail'
      };

      const conditionText = weatherCodeMap[current.weather_code] || 'Unknown';
      
      // Map weather codes to emojis
      const weatherEmojiMap: { [key: number]: string } = {
        0: '☀️',      // Clear sky
        1: '🌤️',     // Mainly clear
        2: '⛅',      // Partly cloudy
        3: '☁️',      // Overcast
        45: '🌫️',    // Foggy
        48: '🌫️',    // Foggy
        51: '🌧️',    // Light drizzle
        53: '🌧️',    // Moderate drizzle
        55: '🌧️',    // Dense drizzle
        61: '🌧️',    // Slight rain
        63: '🌧️',    // Moderate rain
        65: '⛈️',     // Heavy rain
        71: '❄️',     // Slight snow
        73: '❄️',     // Moderate snow
        75: '❄️',     // Heavy snow
        80: '🌦️',    // Slight showers
        81: '🌦️',    // Moderate showers
        82: '⛈️',     // Heavy showers
        85: '🌨️',    // Slight snow showers
        86: '🌨️',    // Heavy snow showers
        95: '⛈️',     // Thunderstorm
        96: '⛈️',     // Thunderstorm with hail
        99: '⛈️'      // Thunderstorm with hail
      };

      const icon = weatherEmojiMap[current.weather_code] || '🌡️';

      return NextResponse.json({
        current: {
          temp_c: current.temperature_2m,
          condition: {
            text: conditionText,
            icon: icon,
            code: current.weather_code
          },
          is_day: current.is_day
        },
        location: {
          name: 'Current Location',
          region: '',
          country: '',
          latitude,
          longitude
        }
      });
    } catch (error) {
      console.error('Weather API error:', error);
      // Fallback with reasonable defaults
      return NextResponse.json({
        current: {
          temp_c: 25,
          condition: { text: 'Unable to fetch', icon: '🌡️', code: -1 },
          is_day: new Date().getHours() > 6 && new Date().getHours() < 18 ? 1 : 0
        },
        location: { name: 'Current Location', region: '', country: '', latitude, longitude }
      });
    }
  } catch (error) {
    console.error('GET handler error:', error);
    return NextResponse.json({
      current: {
        temp_c: 25,
        condition: { text: 'Unable to fetch', icon: '🌡️', code: -1 },
        is_day: new Date().getHours() > 6 && new Date().getHours() < 18 ? 1 : 0
      },
      location: { name: 'Current Location', region: '', country: '' }
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { latitude, longitude, locations } = body;

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // Handle single location
    if (latitude && longitude) {
      try {
        const response = await fetch(
          `https://weatherapi.googleapis.com/v1/currentConditions:list?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              locations: [
                {
                  latitude,
                  longitude,
                },
              ],
              fields: [
                'currentConditions(temperature,condition,windSpeed,windGust,humidity,precipitationProbability)',
                'location',
              ],
            }),
          }
        );

        if (!response.ok) {
          console.error('Weather API response:', response.status, response.statusText);
          // Return fallback data if API fails
          return NextResponse.json({
            temperature: 25,
            condition: 'Clear',
            humidity: 60,
            windSpeed: 5,
            location: { latitude, longitude },
            timestamp: new Date().toISOString(),
          });
        }

        const data = await response.json();

        if (data.locations && data.locations.length > 0) {
          const location = data.locations[0];
          const conditions = location.currentConditions || {};

          return NextResponse.json({
            temperature: conditions.temperature?.value || 25,
            condition: conditions.condition || 'Unknown',
            humidity: conditions.humidity?.value,
            windSpeed: conditions.windSpeed?.value,
            windGust: conditions.windGust?.value,
            precipitationProbability: conditions.precipitationProbability?.value,
            location: { latitude, longitude },
            timestamp: new Date().toISOString(),
          });
        } else {
          // Fallback if no data returned
          return NextResponse.json({
            temperature: 25,
            condition: 'Clear',
            humidity: 60,
            windSpeed: 5,
            location: { latitude, longitude },
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error fetching single location weather:', error);
        // Return fallback data
        return NextResponse.json({
          temperature: 25,
          condition: 'Clear',
          humidity: 60,
          windSpeed: 5,
          location: { latitude, longitude },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Handle multiple locations
    if (locations && Array.isArray(locations)) {
      try {
        const response = await fetch(
          `https://weatherapi.googleapis.com/v1/currentConditions:list?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              locations: locations.map((loc) => ({
                latitude: loc.latitude,
                longitude: loc.longitude,
              })),
              fields: [
                'currentConditions(temperature,condition,windSpeed,windGust,humidity,precipitationProbability)',
                'location',
              ],
            }),
          }
        );

        if (!response.ok) {
          console.error('Weather API response:', response.status, response.statusText);
          // Return fallback data for all locations
          return NextResponse.json(
            locations.map((loc) => ({
              temperature: 25,
              condition: 'Clear',
              humidity: 60,
              windSpeed: 5,
              location: { latitude: loc.latitude, longitude: loc.longitude },
              timestamp: new Date().toISOString(),
            }))
          );
        }

        const data = await response.json();

        if (data.locations) {
          return NextResponse.json(
            data.locations.map((location: any, index: number) => ({
              temperature: location.currentConditions?.temperature?.value || 25,
              condition: location.currentConditions?.condition || 'Unknown',
              humidity: location.currentConditions?.humidity?.value,
              windSpeed: location.currentConditions?.windSpeed?.value,
              windGust: location.currentConditions?.windGust?.value,
              precipitationProbability:
                location.currentConditions?.precipitationProbability?.value,
              location: {
                latitude: locations[index].latitude,
                longitude: locations[index].longitude,
              },
              timestamp: new Date().toISOString(),
            }))
          );
        } else {
          // Fallback if no data
          return NextResponse.json(
            locations.map((loc) => ({
              temperature: 25,
              condition: 'Clear',
              humidity: 60,
              windSpeed: 5,
              location: { latitude: loc.latitude, longitude: loc.longitude },
              timestamp: new Date().toISOString(),
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching multiple locations weather:', error);
        // Return fallback data
        return NextResponse.json(
          locations.map((loc) => ({
            temperature: 25,
            condition: 'Clear',
            humidity: 60,
            windSpeed: 5,
            location: { latitude: loc.latitude, longitude: loc.longitude },
            timestamp: new Date().toISOString(),
          }))
        );
      }
    }

    return NextResponse.json(
      { error: 'Missing latitude/longitude or locations' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
