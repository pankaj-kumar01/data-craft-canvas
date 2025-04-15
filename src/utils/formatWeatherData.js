export const formatWeatherData = (apiData) => {
    const { main, wind, clouds } = apiData;
  
    return [
      { name: 'Temperature (°C)', value: (main.temp - 273.15).toFixed(2) },
      { name: 'Feels Like (°C)', value: (main.feels_like - 273.15).toFixed(2) },
      { name: 'Humidity (%)', value: main.humidity },
      { name: 'Pressure (hPa)', value: main.pressure },
      { name: 'Wind Speed (m/s)', value: wind.speed },
      { name: 'Cloudiness (%)', value: clouds.all }
    ];
  };