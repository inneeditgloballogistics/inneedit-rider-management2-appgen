import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get('lat') || '12.9716');
    const longitude = parseFloat(searchParams.get('lng') || '77.5946');

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { 
          current: {
            temp_c: 28,
            condition: { text: 'Partly Cloudy', icon: '' },
            is_day: 1
          },
          location: { name: 'Location', region: '', country: '' }
        }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${latitude},${longitude}&aqi=no`
      );

      if (!response.ok) {
        // Return fallback data
        return NextResponse.json({
          current: {
            temp_c: 28,
            condition: { text: 'Partly Cloudy', icon: '' },
            is_day: 1
          },
          location: { name: 'Current Location', region: '', country: '' }
        });
      }

      const data = await response.json();
      return NextResponse.json({
        current: {
          temp_c: data.current.temp_c,
          condition: {
            text: data.current.condition.text,
            icon: data.current.condition.icon
          },
          is_day: data.current.is_day
        },
        location: {
          name: data.location.name,
          region: data.location.region,
          country: data.location.country
        }
      });
    } catch (error) {
      console.error('Weather API error:', error);
      return NextResponse.json({
        current: {
          temp_c: 28,
          condition: { text: 'Partly Cloudy', icon: '' },
          is_day: 1
        },
        location: { name: 'Current Location', region: '', country: '' }
      });
    }
  } catch (error) {
    console.error('GET handler error:', error);
    return NextResponse.json({
      current: {
        temp_c: 28,
        condition: { text: 'Partly Cloudy', icon: '' },
        is_day: 1
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
