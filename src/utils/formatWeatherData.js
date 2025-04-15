
export const formatWeatherData = (apiData) => {
  if (!apiData || typeof apiData !== 'object') {
    console.error('Invalid weather API data received:', apiData);
    return [];
  }

  const { main, wind, clouds } = apiData;

  // Validate required properties
  if (!main || !wind || !clouds) {
    console.error('Weather API data missing required properties:', apiData);
    return [];
  }

  try {
    return [
      { name: 'Temperature (°C)', value: parseFloat((main.temp - 273.15).toFixed(2)) },
      { name: 'Feels Like (°C)', value: parseFloat((main.feels_like - 273.15).toFixed(2)) },
      { name: 'Humidity (%)', value: parseFloat(main.humidity) },
      { name: 'Pressure (hPa)', value: parseFloat(main.pressure) },
      { name: 'Wind Speed (m/s)', value: parseFloat(wind.speed) },
      { name: 'Cloudiness (%)', value: parseFloat(clouds.all) }
    ];
  } catch (error) {
    console.error('Error formatting weather data:', error);
    return [];
  }
};
