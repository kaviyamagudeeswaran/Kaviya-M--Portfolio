import type express from 'express';
import logger from '../utils/logger';
import { tryDecodeBase64 } from '../utils/utils';

interface WeatherDataResponse {
  current: CurrentWeather;
  forecast: ForecastWeather[];
  past: PastWeather[];
}

interface CurrentWeather {
  temperature: number;
  humidity: number;
  description: string;
  icon: string;
}

interface ForecastWeather {
  timestamp: number; // Unix timestamp
  temperature: number;
  description: string;
  icon: string;
}

interface PastWeather {
  timestamp: number; // Unix timestamp
  temperature: number;
  description: string;
  icon: string;
}

const getWeatherData = (): express.RequestHandler => {
  const handler: express.RequestHandler = async (req, res, next) => {
    try {
      // Validate city parameter
      const city = req.query.city as string;
      
      if (!city) {
        res.status(400).json({ error: 'City parameter is required' });
        return;
      }

      // Get API key from environment variable
      const apiKey = tryDecodeBase64(process.env.OPENWEATHERMAP_API_KEY || '');
      
      if (!apiKey) {
        logger.error('OPENWEATHERMAP_API_KEY environment variable is not set');
        throw new Error('OpenWeatherMap API key is not configured');
      }

      // Fetch current weather data
      const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
      const currentWeatherResponse = await fetch(currentWeatherUrl);
      
      if (!currentWeatherResponse.ok) {
        logger.error(`Failed to fetch current weather: ${currentWeatherResponse.status} ${currentWeatherResponse.statusText}`);
        throw new Error('Failed to retrieve current weather data from OpenWeatherMap API');
      }
      
      const currentWeatherData = await currentWeatherResponse.json();
      
      // Get coordinates for other API calls
      const lat = currentWeatherData.coord.lat;
      const lon = currentWeatherData.coord.lon;

      // Fetch forecast weather data (5 day / 3 hour forecast)
      const forecastWeatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
      const forecastWeatherResponse = await fetch(forecastWeatherUrl);
      
      if (!forecastWeatherResponse.ok) {
        logger.error(`Failed to fetch forecast weather: ${forecastWeatherResponse.status} ${forecastWeatherResponse.statusText}`);
        throw new Error('Failed to retrieve forecast weather data from OpenWeatherMap API');
      }
      
      const forecastWeatherData = await forecastWeatherResponse.json();

      // Fetch historical weather data (past 5 days)
      const pastWeatherPromises: Promise<any>[] = [];
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Get historical data for the past 5 days (one data point per day)
      for (let i = 1; i <= 5; i++) {
        const timestamp = currentTime - (i * 24 * 60 * 60);
        const historicalUrl = `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${timestamp}&appid=${apiKey}&units=metric`;
        pastWeatherPromises.push(
          fetch(historicalUrl).then(async (response) => {
            if (response.ok) {
              return await response.json();
            }
            return null;
          }).catch(() => null)
        );
      }

      const pastWeatherResults = await Promise.all(pastWeatherPromises);

      // Transform current weather data
      const current: CurrentWeather = {
        temperature: currentWeatherData.main.temp,
        humidity: currentWeatherData.main.humidity,
        description: currentWeatherData.weather[0].description,
        icon: currentWeatherData.weather[0].icon,
      };

      // Transform forecast weather data
      const forecast: ForecastWeather[] = forecastWeatherData.list.map((item: any) => ({
        timestamp: item.dt,
        temperature: item.main.temp,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
      }));

      // Transform past weather data
      const past: PastWeather[] = pastWeatherResults
        .filter((result) => result !== null)
        .map((result: any) => {
          const data = result.data?.[0] || result.current || result;
          return {
            timestamp: data.dt,
            temperature: data.temp,
            description: data.weather?.[0]?.description || 'N/A',
            icon: data.weather?.[0]?.icon || '',
          };
        });

      // Construct response
      const response: WeatherDataResponse = {
        current,
        forecast,
        past,
      };

      res.status(200).json(response);
      return;
    } catch (e) {
      next(e);
    }
  };
  return handler;
};

export default getWeatherData;
